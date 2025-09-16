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
    const classroomId = searchParams.get('classroomId');
    let teacherId = searchParams.get('teacherId');

    if (!classroomId) {
      return NextResponse.json(
        { error: 'Classroom ID is required' },
        { status: 400 }
      );
    }

    // Handle role-based filtering
    let timetableWhere: any = {
      classRoomId: classroomId,
      isActive: true,
      subjectId: { not: null }, // Only subjects, not breaks
    };

    if (decoded.role === 'ADMIN') {
      // Admin can see all subjects in the classroom
      // No additional filtering needed
      if (teacherId && teacherId !== 'current') {
        timetableWhere.teacherId = teacherId;
      }
    } else if (decoded.role === 'TEACHER') {
      // Teacher can only see subjects they teach in this classroom
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
      }

      timetableWhere.teacherId = teacher.id;
    } else if (decoded.role === 'PARENT') {
      // Parent can see all subjects in their children's classroom
      // No additional teacher filter needed for parents
      if (teacherId && teacherId !== 'current') {
        timetableWhere.teacherId = teacherId;
      }
    } else {
      // Students cannot access attendance
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get subjects taught in this classroom
    const subjects = await prisma.timetable.findMany({
      where: timetableWhere,
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
            color: true,
          },
        },
        timeSlot: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            startTime: true,
            endTime: true,
          },
        },
        dayOfWeek: true,
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Group by subject and collect time slots
    const subjectMap = new Map();

    subjects.forEach((entry) => {
      if (!entry.subject) return;

      const subjectId = entry.subject.id;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          ...entry.subject,
          timeSlots: [],
        });
      }

      subjectMap.get(subjectId).timeSlots.push({
        dayOfWeek: entry.dayOfWeek,
        timeSlot: entry.timeSlot,
      });
    });

    const uniqueSubjects = Array.from(subjectMap.values());

    return NextResponse.json(uniqueSubjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
