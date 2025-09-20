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

// Validation schema for updates
const updateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').optional(),
  nameAr: z.string().min(1, 'Arabic subject name is required').optional(),
  code: z.string().min(1, 'Subject code is required').max(10, 'Code too long').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// GET /api/academic/subjects/[id] - Get single subject with relationships
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyAuth(request);
    const subjectId = params.id;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        gradeSubjects: {
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
        },
        teacherSubjects: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            assignments: true,
            exams: true,
            timetables: true
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const transformedSubject = {
      id: subject.id,
      name: subject.name,
      nameAr: subject.nameAr,
      code: subject.code,
      description: subject.description,
      color: subject.color || '#1976d2',
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      grades: subject.gradeSubjects.map((gs: any) => ({
        id: gs.gradeLevel.id,
        name: gs.gradeLevel.name,
        nameAr: gs.gradeLevel.nameAr,
        level: gs.gradeLevel.level,
        weeklyHours: gs.weeklyHours,
        isRequired: gs.isRequired
      })),
      teachers: subject.teacherSubjects.map((ts: any) => ({
        id: ts.teacher.id,
        name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
        isPrimary: ts.isPrimary
      })),
      stats: {
        assignmentCount: subject._count.assignments,
        examCount: subject._count.exams,
        timetableCount: subject._count.timetables
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedSubject,
    });
  } catch (error: any) {
    console.error('Error fetching subject:', error);
    if (error.message.includes('token') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subject' },
      { status: 500 }
    );
  }
}

// PUT /api/academic/subjects/[id] - Update subject
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
    const validatedData = updateSubjectSchema.parse(body);

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if new code already exists (if code is being updated)
    if (validatedData.code && validatedData.code !== existingSubject.code) {
      const codeExists = await prisma.subject.findUnique({
        where: { code: validatedData.code }
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Subject code already exists' },
          { status: 400 }
        );
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject,
    });
  } catch (error: any) {
    console.error('Error updating subject:', error);
    
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
      { success: false, error: 'Failed to update subject' },
      { status: 500 }
    );
  }
}

// DELETE /api/academic/subjects/[id] - Delete subject
export async function DELETE(
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

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        _count: {
          select: {
            assignments: true,
            exams: true,
            timetables: true,
            gradeSubjects: true,
            teacherSubjects: true
          }
        }
      }
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if subject has dependencies
    const hasAssignments = existingSubject._count.assignments > 0;
    const hasExams = existingSubject._count.exams > 0;
    const hasTimetables = existingSubject._count.timetables > 0;

    if (hasAssignments || hasExams || hasTimetables) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete subject with existing assignments, exams, or timetables. Please deactivate instead.' 
        },
        { status: 400 }
      );
    }

    // Delete in transaction to handle relationships
    await prisma.$transaction(async (tx) => {
      // Delete grade-subject relationships
      await tx.gradeSubject.deleteMany({
        where: { subjectId: subjectId }
      });

      // Delete teacher-subject relationships
      await tx.teacherSubject.deleteMany({
        where: { subjectId: subjectId }
      });

      // Delete the subject
      await tx.subject.delete({
        where: { id: subjectId }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting subject:', error);
    
    if (error.message.includes('token') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete subject' },
      { status: 500 }
    );
  }
}