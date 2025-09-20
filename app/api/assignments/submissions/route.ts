import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
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

    // Only students can submit assignments
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit assignments' }, { status: 403 });
    }

    const body = await request.json();
    const { assignmentId, submissionText, attachments } = body;

    // Validate required fields
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Get student info
    const student = await prisma.student.findUnique({
      where: { userId: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if assignment exists and is active
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classRoom: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (!assignment.isActive) {
      return NextResponse.json({ error: 'Assignment is not active' }, { status: 400 });
    }

    // Check if assignment is for student's classroom
    if (assignment.classRoomId !== student.classRoomId) {
      return NextResponse.json({ error: 'Assignment is not for your classroom' }, { status: 403 });
    }

    // Check if due date has passed
    if (new Date() > assignment.dueDate) {
      return NextResponse.json({ error: 'Assignment due date has passed' }, { status: 400 });
    }

    // Check if student has already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id
      }
    });

    if (existingSubmission) {
      // Student has already submitted - do not allow resubmission
      return NextResponse.json({ 
        error: 'You have already submitted this assignment. Multiple submissions are not allowed.',
        submissionExists: true 
      }, { status: 400 });
    }

    // Create new submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: student.id,
        content: submissionText,
        attachments: attachments || null,
        submittedAt: new Date()
      },
      include: {
        assignment: {
          select: { title: true }
        },
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Assignment submitted successfully',
      submission
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    let submissions;

    if (decoded.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId }
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Students can only see their own submissions
      submissions = await prisma.assignmentSubmission.findMany({
        where: {
          studentId: student.id,
          ...(assignmentId && { assignmentId })
        },
        include: {
          assignment: {
            select: { 
              title: true, 
              dueDate: true, 
              totalMarks: true,
              subject: {
                select: { name: true, nameAr: true }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      });

    } else if (decoded.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Teachers can see submissions for their assignments
      submissions = await prisma.assignmentSubmission.findMany({
        where: {
          assignment: {
            teacherId: teacher.id
          },
          ...(assignmentId && { assignmentId })
        },
        include: {
          assignment: {
            select: { 
              title: true, 
              dueDate: true, 
              totalMarks: true,
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
        },
        orderBy: { submittedAt: 'desc' }
      });

    } else if (decoded.role === 'ADMIN') {
      // Admins can see all submissions
      submissions = await prisma.assignmentSubmission.findMany({
        where: {
          ...(assignmentId && { assignmentId })
        },
        include: {
          assignment: {
            select: { 
              title: true, 
              dueDate: true, 
              totalMarks: true,
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
        },
        orderBy: { submittedAt: 'desc' }
      });
    }

    return NextResponse.json({ submissions });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}