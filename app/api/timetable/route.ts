import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/timetable - Get timetable for current user (student gets their class, others need classId param)
export async function GET(request: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get('dayOfWeek');
    let classId = searchParams.get('classId');

    // For students, get their classId automatically if not provided
    if (decoded.role === 'STUDENT' && !classId) {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId },
        select: { classRoomId: true }
      });

      if (!student || !student.classRoomId) {
        return NextResponse.json({ error: 'Student not assigned to a class' }, { status: 400 });
      }

      classId = student.classRoomId;
    }

    // For non-students, classId is required
    if (!classId) {
      return NextResponse.json({ error: 'classId parameter is required' }, { status: 400 });
    }

    // Check if user has access to this classroom's timetable
    if (decoded.role === 'STUDENT') {
      // Students can only access their own classroom's timetable
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId },
        select: { classRoomId: true }
      });

      if (!student || student.classRoomId !== classId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (decoded.role === 'TEACHER') {
      // Teachers can only access timetables for classes they teach
      const teacherTimetable = await prisma.timetable.findFirst({
        where: {
          classRoomId: classId,
          teacherId: {
            equals: (await prisma.teacher.findUnique({
              where: { userId: decoded.userId },
              select: { id: true }
            }))?.id
          }
        }
      });

      if (!teacherTimetable) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // Admins have access to all timetables

    // Get active semester - for students, get it automatically from DB
    let activeSemesterId: string | undefined;
    
    if (decoded.role === 'STUDENT') {
      // For students, automatically get the active semester from database
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      
      if (!activeSemester) {
        return NextResponse.json({ error: 'No active semester found in the system' }, { status: 400 });
      }
      
      activeSemesterId = activeSemester.id;
    } else {
      // For teachers/admins, check cookies, query params, or headers
      activeSemesterId = request.cookies.get('active_semester_id')?.value;
      if (!activeSemesterId) {
        activeSemesterId = searchParams.get('active_semester_id') || undefined;
      }
      if (!activeSemesterId) {
        activeSemesterId = request.headers.get('x-active-semester-id') || undefined;
      }
      if (!activeSemesterId) {
        return NextResponse.json({ error: 'No active semester selected. Please select an academic semester in the UI or include the `active_semester_id` cookie, query parameter, or `x-active-semester-id` header.' }, { status: 400 });
      }
    }

    // First, get the class details
    const classDetails = await prisma.classRoom.findUnique({
      where: { id: classId },
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
    });

    if (!classDetails) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Build where clause
    const whereClause: any = {
      classRoomId: classId,
      semesterId: activeSemesterId,
      isActive: true
    };

    if (dayOfWeek !== null) {
      whereClause.dayOfWeek = parseInt(dayOfWeek || '0');
    }

    // Get timetable entries
    const timetableEntries = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        timeSlot: true,
        subject: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
            color: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        specialLocation: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            type: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeSlot: { slotOrder: 'asc' } }
      ]
    });

    // Get all time slots for reference
    const allTimeSlots = await prisma.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { slotOrder: 'asc' }
    });

    // Organize timetable by day and time slot
    const organizedTimetable = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysOfWeekAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let day = 0; day < 7; day++) {
      const dayTimetable = {
        day: day,
        dayName: daysOfWeek[day],
        dayNameAr: daysOfWeekAr[day],
        slots: allTimeSlots.map((slot: any) => {
          const entry = timetableEntries.find((t: any) => t.dayOfWeek === day && t.timeSlotId === slot.id);
          return {
            timeSlot: {
              id: slot.id,
              name: slot.name,
              nameAr: slot.nameAr,
              startTime: slot.startTime,
              endTime: slot.endTime,
              slotOrder: slot.slotOrder
            },
            entry: entry ? {
              id: entry.id,
              subject: entry.subject,
              teacher: entry.teacher ? {
                id: entry.teacher.id,
                employeeId: entry.teacher.employeeId,
                name: `${entry.teacher.user.firstName} ${entry.teacher.user.lastName}`
              } : null,
              room: entry.specialLocation,
              slotType: entry.slotType,
              notes: entry.notes
            } : null
          };
        })
      };
      organizedTimetable.push(dayTimetable);
    }

    return NextResponse.json({
      success: true,
      data: {
        class: classDetails,
        timetable: organizedTimetable
      }
    });

  } catch (error) {
    console.error('Timetable fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}