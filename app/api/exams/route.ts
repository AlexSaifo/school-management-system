import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

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
    const classRoomId = searchParams.get('classRoomId');
    const subjectId = searchParams.get('subjectId');
    const teacherId = searchParams.get('teacherId');

    let exams;

    if (decoded.role === 'STUDENT') {
      // Students can only see exams for their classroom
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId },
        include: { classRoom: true }
      });

      if (!student || !student.classRoom) {
        return NextResponse.json({ error: 'Student not found or not assigned to class' }, { status: 404 });
      }

      exams = await prisma.exam.findMany({
        where: {
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
            select: { id: true, name: true, nameAr: true }
          },
          _count: {
            select: {
              results: {
                where: { studentId: student.id }
              }
            }
          }
        },
        orderBy: { examDate: 'desc' }
      });
    } else if (decoded.role === 'TEACHER') {
      // Teachers can see exams they created
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      exams = await prisma.exam.findMany({
        where: {
          teacherId: teacher.id,
          ...(classRoomId && { classRoomId }),
          ...(subjectId && { subjectId })
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
            select: { id: true, name: true, nameAr: true, section: true }
          },
          _count: {
            select: { results: true }
          }
        },
        orderBy: { examDate: 'desc' }
      });
    } else if (decoded.role === 'ADMIN') {
      // Admins can see all exams with filters
      exams = await prisma.exam.findMany({
        where: {
          ...(classRoomId && { classRoomId }),
          ...(subjectId && { subjectId }),
          ...(teacherId && { teacherId })
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
            select: { id: true, name: true, nameAr: true, section: true }
          },
          _count: {
            select: { results: true }
          }
        },
        orderBy: { examDate: 'desc' }
      });
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    return NextResponse.json({ exams });

  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Only teachers and admins can create exams
    if (decoded.role !== 'TEACHER' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      classRoomId,
      subjectId, 
      examDate, 
      duration,
      totalMarks, 
      instructions
    } = body;

    // Validate required fields
    if (!title || !classRoomId || !subjectId || !examDate || !totalMarks) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, classRoomId, subjectId, examDate, totalMarks' 
      }, { status: 400 });
    }

    let teacherId;

    if (decoded.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
        include: {
          teacherSubjects: {
            where: { subjectId },
            select: { subjectId: true }
          }
        }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Check if teacher teaches this subject
      if (teacher.teacherSubjects.length === 0) {
        return NextResponse.json({ 
          error: 'You are not authorized to create exams for this subject' 
        }, { status: 403 });
      }

      teacherId = teacher.id;
    } else {
      // Admin creating exam, need teacherId in request
      if (!body.teacherId) {
        return NextResponse.json({ error: 'Teacher ID is required for admin' }, { status: 400 });
      }
      teacherId = body.teacherId;
    }

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        classRoomId,
        subjectId,
        teacherId,
        examDate: new Date(examDate),
        duration: parseInt(duration) || 120,
        totalMarks: parseFloat(totalMarks),
        instructions,
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
          select: { id: true, name: true, nameAr: true, section: true }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Exam created successfully', 
      exam 
    });

  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
