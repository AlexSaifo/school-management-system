import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/timetable/[classId] - Get timetable for a specific class
export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
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

    const { classId } = params;

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

    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get('dayOfWeek');

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
      isActive: true
    };

    if (dayOfWeek !== null) {
      whereClause.dayOfWeek = parseInt(dayOfWeek || '0');
    }

    // Get timetable entries
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
          const entry = timetable.find((t: any) => t.dayOfWeek === day && t.timeSlotId === slot.id);
          return {
            timeSlot: slot,
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
    console.error('Error fetching timetable:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timetable' },
      { status: 500 }
    );
  }
}

// POST /api/timetable/[classId] - Create or update timetable entry
export async function POST(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
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

    // Only admins and teachers can modify timetables
    if (decoded.role !== 'ADMIN' && decoded.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { classId } = params;
    const body = await request.json();
    const { timeSlotId, dayOfWeek, subjectId, teacherId, roomId, slotType, notes } = body;

    if (!timeSlotId || dayOfWeek === undefined) {
      return NextResponse.json(
        { success: false, error: 'Time slot and day of week are required' },
        { status: 400 }
      );
    }

    // Check for teacher conflicts if teacher is assigned
    if (teacherId && subjectId) {
      const conflictingTimetable = await prisma.timetable.findFirst({
        where: {
          teacherId: teacherId,
          timeSlotId: timeSlotId,
          dayOfWeek: dayOfWeek,
          isActive: true,
          classRoomId: { not: classId }
        }
      });

      if (conflictingTimetable) {
        return NextResponse.json(
          { success: false, error: 'Teacher has a conflict at this time slot' },
          { status: 400 }
        );
      }
    }

    // Create or update timetable entry
    const timetableEntry = await prisma.timetable.upsert({
      where: {
        classRoomId_timeSlotId_dayOfWeek: {
          classRoomId: classId,
          timeSlotId: timeSlotId,
          dayOfWeek: dayOfWeek
        }
      },
      update: {
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        specialLocationId: roomId || null,
        slotType: slotType || 'LESSON',
        notes: notes || null
      },
      create: {
        classRoomId: classId,
        timeSlotId: timeSlotId,
        dayOfWeek: dayOfWeek,
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        specialLocationId: roomId || null,
        slotType: slotType || 'LESSON',
        notes: notes || null,
        isActive: true
      },
      include: {
        timeSlot: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        specialLocation: true
      }
    });

    return NextResponse.json({
      success: true,
      data: timetableEntry
    });
  } catch (error) {
    console.error('Error creating/updating timetable entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update timetable entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/timetable/[classId] - Delete timetable entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const { classId } = params;
    const { searchParams } = new URL(request.url);
    const timeSlotId = searchParams.get('timeSlotId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    if (!timeSlotId || !dayOfWeek) {
      return NextResponse.json(
        { success: false, error: 'Time slot ID and day of week are required' },
        { status: 400 }
      );
    }

    const deletedEntry = await prisma.timetable.delete({
      where: {
        classRoomId_timeSlotId_dayOfWeek: {
          classRoomId: classId,
          timeSlotId: timeSlotId,
          dayOfWeek: parseInt(dayOfWeek)
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: deletedEntry
    });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete timetable entry' },
      { status: 500 }
    );
  }
}
