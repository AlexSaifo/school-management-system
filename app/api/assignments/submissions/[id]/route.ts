import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;

    // Get authorization token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let submission;

    if (decoded.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId }
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Students can only see their own submissions
      submission = await prisma.assignmentSubmission.findFirst({
        where: {
          id: submissionId,
          studentId: student.id
        },
        include: {
          assignment: {
            select: { 
              title: true, 
              description: true,
              instructions: true,
              dueDate: true, 
              totalMarks: true,
              attachments: true,
              subject: {
                select: { name: true, nameAr: true }
              },
              teacher: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          }
        }
      });

    } else if (decoded.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Teachers can see submissions for their assignments
      submission = await prisma.assignmentSubmission.findFirst({
        where: {
          id: submissionId,
          assignment: {
            teacherId: teacher.id
          }
        },
        include: {
          assignment: {
            select: { 
              title: true, 
              description: true,
              instructions: true,
              dueDate: true, 
              totalMarks: true,
              attachments: true,
              subject: {
                select: { name: true, nameAr: true }
              }
            }
          },
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              },
              classRoom: {
                select: { name: true, nameAr: true }
              }
            }
          }
        }
      });

    } else if (decoded.role === 'ADMIN') {
      // Admins can see all submissions
      submission = await prisma.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: {
          assignment: {
            select: { 
              title: true, 
              description: true,
              instructions: true,
              dueDate: true, 
              totalMarks: true,
              attachments: true,
              subject: {
                select: { name: true, nameAr: true }
              },
              teacher: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          },
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              },
              classRoom: {
                select: { name: true, nameAr: true }
              }
            }
          }
        }
      });
    }

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;

    // Get authorization token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    if (decoded.role === 'STUDENT') {
      // Students cannot update their submissions once submitted
      return NextResponse.json({ 
        error: 'Students cannot modify submissions after submission. Multiple submissions are not allowed.' 
      }, { status: 403 });

    } else if (decoded.role === 'TEACHER' || decoded.role === 'ADMIN') {
      // Teachers and admins can grade submissions
      const { marksObtained, feedback } = body;

      let updateConditions: any = { id: submissionId };

      if (decoded.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: decoded.userId }
        });

        if (!teacher) {
          return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }

        // Teachers can only grade submissions for their assignments
        updateConditions = {
          id: submissionId,
          assignment: {
            teacherId: teacher.id
          }
        };
      }

      const submission = await prisma.assignmentSubmission.updateMany({
        where: updateConditions,
        data: {
          ...(typeof marksObtained === 'number' && { marksObtained }),
          ...(feedback && { feedback }),
          gradedAt: new Date()
        }
      });

      if (submission.count === 0) {
        return NextResponse.json({ 
          error: 'Submission not found or unauthorized' 
        }, { status: 404 });
      }

      return NextResponse.json({ message: 'Submission graded successfully' });

    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;

    // Get authorization token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId }
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Students can only delete their own ungraded submissions
      const deleteResult = await prisma.assignmentSubmission.deleteMany({
        where: {
          id: submissionId,
          studentId: student.id,
          marksObtained: null // Can only delete if not graded
        }
      });

      if (deleteResult.count === 0) {
        return NextResponse.json({ 
          error: 'Submission not found or already graded' 
        }, { status: 404 });
      }

    } else if (decoded.role === 'ADMIN') {
      // Admins can delete any submission
      const deleteResult = await prisma.assignmentSubmission.delete({
        where: { id: submissionId }
      });

      if (!deleteResult) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Submission deleted successfully' });

  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}