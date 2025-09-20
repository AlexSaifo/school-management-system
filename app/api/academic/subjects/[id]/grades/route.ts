import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth verification
const verifyAuth = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Validation schema for updating grade assignments
const updateGradeAssignmentsSchema = z.object({
  gradeAssignments: z.array(z.object({
    gradeLevelId: z.string(),
    weeklyHours: z.number().min(1).max(10),
    isRequired: z.boolean()
  }))
});

// GET /api/academic/subjects/[id]/grades - Get subject's grade assignments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyAuth(request);
    const subjectId = params.id;

    const gradeAssignments = await prisma.gradeSubject.findMany({
      where: { subjectId },
      include: {
        gradeLevel: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            level: true
          }
        }
      },
      orderBy: {
        gradeLevel: {
          level: 'asc'
        }
      }
    });

    const transformedAssignments = gradeAssignments.map((assignment) => ({
      id: assignment.id,
      gradeLevelId: assignment.gradeLevelId,
      grade: {
        id: assignment.gradeLevel.id,
        name: assignment.gradeLevel.name,
        nameAr: assignment.gradeLevel.nameAr,
        level: assignment.gradeLevel.level
      },
      weeklyHours: assignment.weeklyHours,
      isRequired: assignment.isRequired,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: transformedAssignments,
    });
  } catch (error: any) {
    console.error('Error fetching subject grades:', error);
    if (error.message.includes('token') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subject grades' },
      { status: 500 }
    );
  }
}

// PUT /api/academic/subjects/[id]/grades - Update subject's grade assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyAuth(request);
    
    if (!['ADMIN'].includes(decoded.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const subjectId = params.id;
    const body = await request.json();
    const validatedData = updateGradeAssignmentsSchema.parse(body);

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Verify all grade levels exist
    const gradeIds = validatedData.gradeAssignments.map(ga => ga.gradeLevelId);
    const grades = await prisma.gradeLevel.findMany({
      where: { id: { in: gradeIds } }
    });

    if (grades.length !== gradeIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more grade levels not found' },
        { status: 400 }
      );
    }

    // Update grade assignments in transaction
    await prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.gradeSubject.deleteMany({
        where: { subjectId }
      });

      // Create new assignments
      if (validatedData.gradeAssignments.length > 0) {
        await tx.gradeSubject.createMany({
          data: validatedData.gradeAssignments.map(assignment => ({
            subjectId,
            gradeLevelId: assignment.gradeLevelId,
            weeklyHours: assignment.weeklyHours,
            isRequired: assignment.isRequired
          }))
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subject grade assignments updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating subject grades:', error);
    
    if (error.message.includes('token') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update subject grades' },
      { status: 500 }
    );
  }
}