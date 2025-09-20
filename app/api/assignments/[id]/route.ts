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

    let assignment;

    if (decoded.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId }
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          classRoomId: student.classRoomId!,
          isActive: true
        },
        include: {
          subject: {
            select: { name: true, nameAr: true, code: true }
          },
          teacher: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          classRoom: {
            select: { name: true, nameAr: true }
          },
          submissions: {
            where: { studentId: student.id },
            include: {
              student: {
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

      assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId: teacher.id
        },
        include: {
          subject: {
            select: { name: true, nameAr: true, code: true }
          },
          teacher: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          classRoom: {
            select: { name: true, nameAr: true, section: true }
          },
          submissions: {
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            },
            orderBy: { submittedAt: 'desc' }
          }
        }
      });
    } else if (decoded.role === 'ADMIN') {
      assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          subject: {
            select: { name: true, nameAr: true, code: true }
          },
          teacher: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          classRoom: {
            select: { name: true, nameAr: true, section: true }
          },
          submissions: {
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            },
            orderBy: { submittedAt: 'desc' }
          }
        }
      });
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Filter out submissions without complete student/user data to prevent frontend errors
    if (assignment.submissions) {
      assignment.submissions = assignment.submissions.filter(submission => 
        submission.student && 
        submission.student.user && 
        submission.student.user.firstName && 
        submission.student.user.lastName
      );
    }

    return NextResponse.json({ assignment });

  } catch (error) {
    console.error('Error fetching assignment:', error);
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
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only teachers and admins can update assignments
    if (decoded.role !== 'TEACHER' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const assignmentId = params.id;
    const body = await request.json();
    const { title, description, dueDate, totalMarks, instructions, attachments, isActive, classRoomIds } = body;

    // Handle single classroom selection (take first classroom from array)
    const classRoomId = classRoomIds && classRoomIds.length > 0 ? classRoomIds[0] : undefined;

    let assignment;

    if (decoded.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Teachers can only update their own assignments
      assignment = await prisma.assignment.updateMany({
        where: {
          id: assignmentId,
          teacherId: teacher.id
        },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
          ...(totalMarks && { totalMarks }),
          ...(instructions && { instructions }),
          ...(attachments && { attachments }),
          ...(classRoomId && { classRoomId }),
          ...(typeof isActive === 'boolean' && { isActive })
        }
      });
    } else if (decoded.role === 'ADMIN') {
      // Admins can update any assignment
      assignment = await prisma.assignment.updateMany({
        where: { id: assignmentId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
          ...(totalMarks && { totalMarks }),
          ...(instructions && { instructions }),
          ...(attachments && { attachments }),
          ...(classRoomId && { classRoomId }),
          ...(typeof isActive === 'boolean' && { isActive })
        }
      });
    }

    if (!assignment || assignment.count === 0) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    // Fetch the updated assignment
    const updatedAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: {
          select: { name: true, nameAr: true, code: true }
        },
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        classRoom: {
          select: { name: true, nameAr: true, section: true }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Assignment updated successfully', 
      assignment: updatedAssignment 
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
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
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only teachers and admins can delete assignments
    if (decoded.role !== 'TEACHER' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const assignmentId = params.id;

    let result;

    if (decoded.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Teachers can only soft-delete (mark inactive) their own assignments
      result = await prisma.assignment.updateMany({
        where: {
          id: assignmentId,
          teacherId: teacher.id
        },
        data: { isActive: false }
      });
    } else if (decoded.role === 'ADMIN') {
      // Admins can hard delete assignments
      result = await prisma.assignment.delete({
        where: { id: assignmentId }
      });
    }

    if (!result || (result as any).count === 0) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}