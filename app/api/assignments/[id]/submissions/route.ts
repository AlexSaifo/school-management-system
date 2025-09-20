import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const assignmentId = params.id;
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
          assignmentId,
          studentId: student.id
        },
        include: {
          assignment: {
            select: { title: true, totalMarks: true, dueDate: true }
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

      // Verify teacher owns this assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId: teacher.id
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
      }

      // Teachers can see all submissions for their assignments
      submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          assignment: {
            select: { title: true, totalMarks: true, dueDate: true }
          }
        },
        orderBy: { submittedAt: 'desc' }
      });
    } else if (decoded.role === 'ADMIN') {
      // Admins can see all submissions
      submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          assignment: {
            select: { title: true, totalMarks: true, dueDate: true }
          }
        },
        orderBy: { submittedAt: 'desc' }
      });
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only students can submit assignments
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit assignments' }, { status: 403 });
    }

    const assignmentId = params.id;
    const body = await request.json();
    const { content, attachments } = body;

    const student = await prisma.student.findUnique({
      where: { userId: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify assignment exists and is accessible to student
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        classRoomId: student.classRoomId!,
        isActive: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or not accessible' }, { status: 404 });
    }

    // Check if assignment is past due
    if (new Date() > assignment.dueDate) {
      return NextResponse.json({ error: 'Assignment submission deadline has passed' }, { status: 400 });
    }

    // Check if student has already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id
        }
      }
    });

    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          attachments: attachments || null,
          submittedAt: new Date()
        },
        include: {
          assignment: {
            select: { title: true, totalMarks: true, dueDate: true }
          }
        }
      });

      return NextResponse.json({ 
        message: 'Assignment submission updated successfully',
        submission: updatedSubmission 
      });
    } else {
      // Create new submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId: student.id,
          content,
          attachments: attachments || null
        },
        include: {
          assignment: {
            select: { title: true, totalMarks: true, dueDate: true }
          }
        }
      });

      return NextResponse.json({ 
        message: 'Assignment submitted successfully',
        submission 
      });
    }

  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}