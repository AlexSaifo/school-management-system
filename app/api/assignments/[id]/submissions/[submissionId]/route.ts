import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only teachers and admins can grade submissions
    if (decoded.role !== 'TEACHER' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: assignmentId, submissionId } = params;
    const body = await request.json();
    const { marksObtained, feedback } = body;

    if (marksObtained === undefined) {
      return NextResponse.json({ error: 'Marks obtained is required' }, { status: 400 });
    }

    let submission;

    if (decoded.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Verify teacher owns the assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId: teacher.id
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
      }

      // Update the submission
      submission = await prisma.assignmentSubmission.update({
        where: {
          id: submissionId,
          assignmentId: assignmentId
        },
        data: {
          marksObtained,
          feedback,
          gradedAt: new Date(),
          gradedById: decoded.userId
        },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          assignment: {
            select: { title: true, totalMarks: true }
          }
        }
      });
    } else if (decoded.role === 'ADMIN') {
      // Admins can grade any submission
      submission = await prisma.assignmentSubmission.update({
        where: {
          id: submissionId,
          assignmentId: assignmentId
        },
        data: {
          marksObtained,
          feedback,
          gradedAt: new Date(),
          gradedById: decoded.userId
        },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          assignment: {
            select: { title: true, totalMarks: true }
          }
        }
      });
    }

    return NextResponse.json({ 
      message: 'Submission graded successfully',
      submission 
    });

  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}