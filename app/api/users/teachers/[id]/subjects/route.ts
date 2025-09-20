import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth verification
const verifyAuth = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

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

const updateSubjectsSchema = z.object({
  subjectIds: z.array(z.string()),
});

// GET /api/users/teachers/[id]/subjects - Get teacher's assigned subjects
export async function GET(
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

    const teacherId = params.id;

    const teacher = await prisma.teacher.findFirst({
      where: { userId: teacherId },
      include: {
        teacherSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    const subjects = teacher.teacherSubjects.map(ts => ts.subject);

    return NextResponse.json({
      success: true,
      data: subjects,
    });
  } catch (error: any) {
    console.error('Error fetching teacher subjects:', error);
    if (error.message.includes('token') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher subjects' },
      { status: 500 }
    );
  }
}

// PUT /api/users/teachers/[id]/subjects - Update teacher's assigned subjects
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

    const teacherId = params.id;
    const body = await request.json();
    const validatedData = updateSubjectsSchema.parse(body);

    // Verify teacher exists
    const teacher = await prisma.teacher.findFirst({
      where: { userId: teacherId }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Verify all subject IDs exist
    const subjects = await prisma.subject.findMany({
      where: { id: { in: validatedData.subjectIds } }
    });

    if (subjects.length !== validatedData.subjectIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more subjects not found' },
        { status: 400 }
      );
    }

    // Update teacher subjects in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove all existing assignments
      await tx.teacherSubject.deleteMany({
        where: { teacherId: teacher.id }
      });

      // Add new assignments
      if (validatedData.subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: validatedData.subjectIds.map(subjectId => ({
            teacherId: teacher.id,
            subjectId,
            isPrimary: false // You can add logic to determine primary subject
          }))
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher subjects updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating teacher subjects:', error);
    
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
      { success: false, error: 'Failed to update teacher subjects' },
      { status: 500 }
    );
  }
}