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

    // Get active semester from cookies
    const activeSemesterId = request.cookies.get('active_semester_id')?.value;
    if (!activeSemesterId) {
      return NextResponse.json({ error: 'No active semester selected' }, { status: 400 });
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
// Let's make roomId accessible in the catch block
let globalRoomId: string | null = null;

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

    // Get active semester from cookies
    const activeSemesterId = request.cookies.get('active_semester_id')?.value;
    if (!activeSemesterId) {
      return NextResponse.json({ error: 'No active semester selected' }, { status: 400 });
    }

    const body = await request.json();
    let { timeSlotId, dayOfWeek, subjectId, teacherId, roomId, slotType, notes } = body;
    
    // Store roomId in the global variable for error handling
    globalRoomId = roomId;

    if (!timeSlotId || dayOfWeek === undefined) {
      return NextResponse.json(
        { success: false, error: 'Time slot and day of week are required' },
        { status: 400 }
      );
    }
    
    // If roomId is the same as the classId, it means we're using the default classroom
    // In that case, set roomId to null to avoid foreign key issues
    if (roomId === classId) {
      roomId = null;
      globalRoomId = null;
      body.roomId = null;
    }

    // Check for teacher conflicts if teacher is assigned
    if (teacherId && subjectId) {
      const conflictingTimetable = await prisma.timetable.findFirst({
        where: {
          teacherId: teacherId,
          timeSlotId: timeSlotId,
          dayOfWeek: dayOfWeek,
          semesterId: activeSemesterId,
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
    
    // If roomId is provided, check if it's a valid special location ID
    if (roomId) {
      try {
        console.log('Validating roomId:', roomId);
        
        // First check if it's a special location
        const specialLocation = await prisma.specialLocation.findUnique({
          where: { id: roomId }
        });

        if (specialLocation) {
          console.log('Found special location:', specialLocation.name);
          // It's a valid special location, keep roomId as is
        } else {
          console.log('Not a special location, checking if it\'s a classroom');
          
          // If not a special location, check if it's a regular classroom
          const classroom = await prisma.classRoom.findUnique({
            where: { id: roomId }
          });

          if (classroom) {
            console.log('Found classroom:', classroom.name);
            console.log('Setting roomId to null since it\'s a classroom, not a special location');
            // If it's a classroom, set roomId to null since it's not a special location
            // The classRoomId is already handled by the route parameter (classId)
            roomId = null;
            globalRoomId = null;
          } else {
            console.log('Room not found with ID:', roomId);
            return NextResponse.json(
              { success: false, error: 'Room not found with the provided ID' },
              { status: 400 }
            );
          }
        }
      } catch (error) {
        console.error('Error validating room ID:', error);
        return NextResponse.json(
          { success: false, error: 'Error validating room ID' },
          { status: 500 }
        );
      }
    } else {
      console.log('No roomId provided, will use null for specialLocationId');
    }

    // Log what values we're using for the update
    console.log('Timetable entry data:', {
      classId,
      timeSlotId,
      dayOfWeek,
      subjectId,
      teacherId,
      roomId,
      slotType,
      notes
    });

    // Create or update timetable entry
    const timetableEntry = await prisma.timetable.upsert({
      where: {
        classRoomId_timeSlotId_dayOfWeek_semesterId: {
          classRoomId: classId,
          timeSlotId: timeSlotId,
          dayOfWeek: dayOfWeek,
          semesterId: activeSemesterId
        }
      },
      update: {
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        // specialLocationId can only be a valid special location ID or null
        specialLocationId: roomId, // Will be null if it's not a special location
        slotType: slotType || 'LESSON',
        notes: notes || null
      },
      create: {
        classRoomId: classId,
        timeSlotId: timeSlotId,
        dayOfWeek: dayOfWeek,
        semesterId: activeSemesterId,
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        // specialLocationId can only be a valid special location ID or null
        specialLocationId: roomId, // Will be null if it's not a special location
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
  } catch (error: any) {
    console.error('Error creating/updating timetable entry:', error);
    
    // Provide more specific error message for foreign key violations
    if (error?.code === 'P2003' && error?.meta?.field_name?.includes('specialLocationId')) {
      console.error('Foreign key constraint violation for specialLocationId');
      console.error('This means the roomId provided is not a valid special location ID');
      console.error('roomId value:', globalRoomId);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid special location ID. The room ID provided is not a valid special location.',
          details: {
            code: error.code,
            meta: error.meta,
            roomId: globalRoomId
          }
        },
        { status: 400 }
      );
    }
    
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

    // Get active semester from cookies
    const activeSemesterId = request.cookies.get('active_semester_id')?.value;
    if (!activeSemesterId) {
      return NextResponse.json({ error: 'No active semester selected' }, { status: 400 });
    }

    const deletedEntry = await prisma.timetable.delete({
      where: {
        classRoomId_timeSlotId_dayOfWeek_semesterId: {
          classRoomId: classId,
          timeSlotId: timeSlotId,
          dayOfWeek: parseInt(dayOfWeek),
          semesterId: activeSemesterId
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
