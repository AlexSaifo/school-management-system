import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/timetable/teachers/[teacherId] - Get teacher's timetable
export async function GET(
  request: NextRequest,
  { params }: { params: { teacherId: string } }
) {
  try {
    const { teacherId } = params;
    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get('dayOfWeek');

    // Get teacher details
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        employeeId: true,
        department: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teacherSubjects: {
          select: {
            subject: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                code: true,
                color: true
              }
            }
          }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get active semester - for students, get it automatically from DB
    let activeSemesterId: string | undefined;
    
    // For teachers, check cookies, query params, or headers (since this endpoint is typically called by admins or the teacher themselves)
    activeSemesterId = request.cookies.get('active_semester_id')?.value;
    if (!activeSemesterId) {
      activeSemesterId = searchParams.get('active_semester_id') || undefined;
    }
    if (!activeSemesterId) {
      activeSemesterId = request.headers.get('x-active-semester-id') || undefined;
    }
    if (!activeSemesterId) {
      // Fallback: get active semester from database
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      
      if (activeSemester) {
        activeSemesterId = activeSemester.id;
      } else {
        return NextResponse.json({ error: 'No active semester found in the system' }, { status: 400 });
      }
    }

    // Build where clause
    const whereClause: any = {
      teacherId: teacherId,
      semesterId: activeSemesterId,
      isActive: true
    };

    if (dayOfWeek !== null) {
      whereClause.dayOfWeek = parseInt(dayOfWeek || '0');
    }

    // Get teacher's timetable
    const timetable = await prisma.timetable.findMany({
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
        classRoom: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            section: true,
            gradeLevel: {
              select: {
                name: true,
                nameAr: true,
                level: true
              }
            }
          }
        },
        specialLocation: {
          select: {
            id: true,
            name: true,
            nameAr: true
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

    // Organize timetable by day
    const organizedTimetable = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysOfWeekAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let day = 0; day < 7; day++) {
      const dayTimetable = {
        day: day,
        dayName: daysOfWeek[day],
        dayNameAr: daysOfWeekAr[day],
        slots: allTimeSlots.map((slot: any) => {
          const entry = timetable.find((t: any) => t.dayOfWeek === day && t.timeSlotId === slot.id);
          return {
            timeSlot: slot,
            entry: entry ? {
              id: entry.id,
              subject: entry.subject,
              class: entry.classRoom,
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
        teacher: {
          ...teacher,
          subjects: teacher.teacherSubjects.map((ts: any) => ts.subject)
        },
        timetable: organizedTimetable
      }
    });
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher timetable' },
      { status: 500 }
    );
  }
}

// GET /api/timetable/teachers/conflicts - Check for teacher conflicts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, timeSlotId, dayOfWeek, excludeClassId } = body;

    if (!teacherId || !timeSlotId || dayOfWeek === undefined) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID, time slot ID, and day of week are required' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      teacherId: teacherId,
      timeSlotId: timeSlotId,
      dayOfWeek: dayOfWeek,
      isActive: true
    };

    if (excludeClassId) {
      whereClause.classRoomId = { not: excludeClassId };
    }

    const conflictingTimetable = await prisma.timetable.findFirst({
      where: whereClause,
      include: {
        classRoom: {
          select: {
            name: true,
            nameAr: true,
            section: true,
            gradeLevel: {
              select: {
                name: true,
                nameAr: true
              }
            }
          }
        },
        subject: {
          select: {
            name: true,
            nameAr: true
          }
        },
        timeSlot: {
          select: {
            name: true,
            nameAr: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        hasConflict: !!conflictingTimetable,
        conflict: conflictingTimetable
      }
    });
  } catch (error) {
    console.error('Error checking teacher conflicts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check teacher conflicts' },
      { status: 500 }
    );
  }
}
