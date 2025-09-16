import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');

    if (!gradeId) {
      return NextResponse.json(
        { error: 'Grade ID is required' },
        { status: 400 }
      );
    }

    // Handle role-based filtering
    let classrooms;

    if (decoded.role === 'ADMIN') {
      // Admin can see all classrooms in the grade
      classrooms = await prisma.classRoom.findMany({
        where: {
          gradeLevelId: gradeId,
          isActive: true,
        },
        orderBy: { sectionNumber: 'asc' },
        select: {
          id: true,
          name: true,
          nameAr: true,
          section: true,
          sectionNumber: true,
          roomNumber: true,
          capacity: true,
          gradeLevel: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              level: true,
            },
          },
          _count: {
            select: { students: true },
          },
        },
      });
    } else if (decoded.role === 'TEACHER') {
      // Teacher can only see classrooms where they teach in this grade
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
      }

      // Get distinct classrooms from teacher's timetable entries in this grade
      const teacherClassrooms = await prisma.timetable.findMany({
        where: {
          teacherId: teacher.id,
          isActive: true,
          classRoom: {
            gradeLevelId: gradeId,
            isActive: true,
          },
        },
        select: {
          classRoom: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              section: true,
              sectionNumber: true,
              roomNumber: true,
              capacity: true,
              gradeLevel: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  level: true,
                },
              },
              _count: {
                select: { students: true },
              },
            },
          },
        },
        distinct: ['classRoomId'],
      });

      // Extract unique classrooms
      const classroomMap = new Map();
      teacherClassrooms.forEach(entry => {
        if (entry.classRoom) {
          classroomMap.set(entry.classRoom.id, entry.classRoom);
        }
      });

      classrooms = Array.from(classroomMap.values()).sort((a, b) => a.sectionNumber - b.sectionNumber);
    } else if (decoded.role === 'PARENT') {
      // Parent can see classrooms of their children in this grade
      const parent = await prisma.parent.findUnique({
        where: { userId: decoded.userId },
      });

      if (!parent) {
        return NextResponse.json({ error: 'Parent access required' }, { status: 403 });
      }

      // Get distinct classrooms from parent's children in this grade
      const parentClassrooms = await prisma.studentParent.findMany({
        where: { parentId: parent.id },
        select: {
          student: {
            select: {
              classRoom: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  section: true,
                  sectionNumber: true,
                  roomNumber: true,
                  capacity: true,
                  gradeLevel: {
                    select: {
                      id: true,
                      name: true,
                      nameAr: true,
                      level: true,
                    },
                  },
                  _count: {
                    select: { students: true },
                  },
                },
              },
            },
          },
        },
      });

      // Extract unique classrooms in the specified grade
      const classroomMap = new Map();
      parentClassrooms.forEach(entry => {
        if (entry.student?.classRoom && entry.student.classRoom.gradeLevel?.id === gradeId) {
          classroomMap.set(entry.student.classRoom.id, entry.student.classRoom);
        }
      });

      classrooms = Array.from(classroomMap.values()).sort((a, b) => a.sectionNumber - b.sectionNumber);
    } else {
      // Students cannot access attendance
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
