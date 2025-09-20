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

    let assignments;

    if (decoded.role === 'STUDENT') {
      // Students can only see assignments for their classroom
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId },
        include: { classRoom: true }
      });

      if (!student || !student.classRoom) {
        return NextResponse.json({ error: 'Student not found or not assigned to class' }, { status: 404 });
      }

      assignments = await prisma.assignment.findMany({
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
            select: { name: true, nameAr: true }
          },
          submissions: {
            where: { studentId: student.id },
            select: { id: true, submittedAt: true, marksObtained: true, feedback: true, content: true, attachments: true }
          }
        },
        orderBy: { dueDate: 'asc' }
      });
    } else if (decoded.role === 'TEACHER') {
      // Teachers can see assignments they created
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      assignments = await prisma.assignment.findMany({
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
            select: { name: true, nameAr: true, section: true }
          },
          submissions: {
            select: { id: true, studentId: true, submittedAt: true, marksObtained: true }
          },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (decoded.role === 'ADMIN') {
      // Admins can see all assignments with filters
      assignments = await prisma.assignment.findMany({
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
            select: { name: true, nameAr: true, section: true }
          },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    return NextResponse.json({ assignments });

  } catch (error) {
    console.error('Error fetching assignments:', error);
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

    // Only teachers and admins can create assignments
    if (decoded.role !== 'TEACHER' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      classRoomIds, // Array of classroom IDs or single ID
      subjectId, 
      dueDate, 
      totalMarks, 
      instructions, 
      attachments 
    } = body;

    // Validate required fields
    if (!title || !subjectId || !dueDate || !totalMarks) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, subjectId, dueDate, totalMarks' 
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
          error: 'You are not authorized to create assignments for this subject' 
        }, { status: 403 });
      }

      teacherId = teacher.id;
    } else {
      // Admin creating assignment, need teacherId in request
      if (!body.teacherId) {
        return NextResponse.json({ error: 'Teacher ID is required for admin' }, { status: 400 });
      }
      teacherId = body.teacherId;
    }

    // Handle multiple classrooms or single classroom
    const classRoomIdsArray = Array.isArray(classRoomIds) ? classRoomIds : [classRoomIds];

    if (!classRoomIdsArray || classRoomIdsArray.length === 0) {
      return NextResponse.json({ error: 'At least one classroom must be selected' }, { status: 400 });
    }

    // Create assignments for each classroom
    const assignments = await Promise.all(
      classRoomIdsArray.map(async (classRoomId: string) => {
        return prisma.assignment.create({
          data: {
            title,
            description,
            classRoomId,
            subjectId,
            teacherId,
            dueDate: new Date(dueDate),
            totalMarks,
            instructions,
            attachments: attachments || null
          },
          include: {
            subject: {
              select: { name: true, nameAr: true, code: true }
            },
            classRoom: {
              select: { name: true, nameAr: true, section: true }
            },
            teacher: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        });
      })
    );

    return NextResponse.json({ 
      message: 'Assignments created successfully', 
      assignments 
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
