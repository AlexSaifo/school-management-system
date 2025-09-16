import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      // Check for auth_token cookie
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Handle role-based filtering
    let grades;

    if (decoded.role === 'ADMIN') {
      // Admin can see all grades
      grades = await prisma.gradeLevel.findMany({
        where: { isActive: true },
        orderBy: { level: 'asc' },
        select: {
          id: true,
          name: true,
          nameAr: true,
          level: true,
        },
      });
    } else if (decoded.role === 'TEACHER') {
      // Teacher can only see grades where they teach
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
      }

      // Get distinct grade levels from teacher's timetable entries
      const teacherGrades = await prisma.timetable.findMany({
        where: {
          teacherId: teacher.id,
          isActive: true,
        },
        select: {
          classRoom: {
            select: {
              gradeLevel: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  level: true,
                },
              },
            },
          },
        },
        distinct: ['classRoomId'],
      });

      // Extract unique grade levels
      const gradeMap = new Map();
      teacherGrades.forEach(entry => {
        if (entry.classRoom?.gradeLevel) {
          gradeMap.set(entry.classRoom.gradeLevel.id, entry.classRoom.gradeLevel);
        }
      });

      grades = Array.from(gradeMap.values()).sort((a, b) => a.level - b.level);
    } else if (decoded.role === 'PARENT') {
      // Parent can see grades of their children
      const parent = await prisma.parent.findUnique({
        where: { userId: decoded.userId },
      });

      if (!parent) {
        return NextResponse.json({ error: 'Parent access required' }, { status: 403 });
      }

      // Get distinct grade levels from parent's children
      const parentGrades = await prisma.studentParent.findMany({
        where: { parentId: parent.id },
        select: {
          student: {
            select: {
              classRoom: {
                select: {
                  gradeLevel: {
                    select: {
                      id: true,
                      name: true,
                      nameAr: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Extract unique grade levels
      const gradeMap = new Map();
      parentGrades.forEach(entry => {
        if (entry.student?.classRoom?.gradeLevel) {
          gradeMap.set(entry.student.classRoom.gradeLevel.id, entry.student.classRoom.gradeLevel);
        }
      });

      grades = Array.from(gradeMap.values()).sort((a, b) => a.level - b.level);
    } else {
      // Students cannot access attendance
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
