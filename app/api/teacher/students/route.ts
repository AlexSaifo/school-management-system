import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !['TEACHER', 'ADMIN'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: decoded.userId },
      include: {
        teacherSubjects: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get all classrooms where the teacher has subjects assigned
    const teacherClassrooms = await prisma.timetable.findMany({
      where: {
        teacherId: teacher.id
      },
      select: {
        classRoomId: true
      },
      distinct: ['classRoomId']
    });

    const classroomIds = teacherClassrooms.map(tc => tc.classRoomId);

    if (classroomIds.length === 0) {
      // If no timetables, get students from classes where teacher has assignments/exams
      const assignmentClassrooms = await prisma.assignment.findMany({
        where: { teacherId: teacher.id },
        select: { classRoomId: true },
        distinct: ['classRoomId']
      });

      const examClassrooms = await prisma.exam.findMany({
        where: { teacherId: teacher.id },
        select: { classRoomId: true },
        distinct: ['classRoomId']
      });

      classroomIds.push(...assignmentClassrooms.map(ac => ac.classRoomId));
      classroomIds.push(...examClassrooms.map(ec => ec.classRoomId));
    }

    // Remove duplicates
    const uniqueClassroomIds = Array.from(new Set(classroomIds));

    if (uniqueClassroomIds.length === 0) {
      return NextResponse.json({ students: [] });
    }

    // Get students from these classrooms
    const students = await prisma.student.findMany({
      where: {
        classRoomId: {
          in: uniqueClassroomIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        }
      },
      orderBy: [
        { classRoom: { name: 'asc' } },
        { rollNumber: 'asc' },
        { user: { firstName: 'asc' } }
      ]
    });

    // Filter out students without users and ensure user data exists
    const validStudents = students.filter(student => student.user && student.user.firstName && student.user.lastName);

    return NextResponse.json({ students: validStudents });

  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}