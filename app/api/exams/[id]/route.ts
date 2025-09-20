import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/exams/[id] - Get specific exam with results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                 request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { student: true, teacher: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true
          }
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            section: true,
            gradeLevel: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                level: true
              }
            }
          }
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        results: {
          include: {
            student: {
              select: {
                id: true,
                rollNumber: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: [
            {
              student: {
                rollNumber: 'asc'
              }
            }
          ]
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Apply role-based filtering
    if (user.role === 'STUDENT') {
      // Students can only see their own results
      if (exam.classRoomId !== user.student?.classRoomId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Filter results to only show their own
      exam.results = exam.results.filter(result => result.student.id === user.student?.id);
    } else if (user.role === 'TEACHER') {
      // Teachers can only see exams they created
      if (exam.teacherId !== user.teacher?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json({ exam });

  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

// PUT /api/exams/[id] - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                 request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { teacher: true }
    });

    if (!user || !['TEACHER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Teachers can only edit their own exams
    if (user.role === 'TEACHER' && exam.teacherId !== user.teacher?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      examDate,
      duration,
      totalMarks,
      instructions,
      isActive
    } = body;

    const updatedExam = await prisma.exam.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(examDate !== undefined && { examDate: new Date(examDate) }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(totalMarks !== undefined && { totalMarks: parseFloat(totalMarks) }),
        ...(instructions !== undefined && { instructions }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        subject: {
          select: {
            name: true,
            nameAr: true,
            code: true
          }
        },
        classRoom: {
          select: {
            name: true,
            nameAr: true,
            section: true
          }
        },
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ exam: updatedExam });

  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[id] - Delete exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                 request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { teacher: true }
    });

    if (!user || !['TEACHER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Teachers can only delete their own exams
    if (user.role === 'TEACHER' && exam.teacherId !== user.teacher?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.exam.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Exam deleted successfully' });

  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}