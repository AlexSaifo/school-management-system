import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/timetable/conflicts/room - Check room conflicts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const dayOfWeek = searchParams.get('dayOfWeek');
    const timeSlotId = searchParams.get('timeSlotId');
    const excludeClassId = searchParams.get('excludeClassId');

    // Validate required parameters
    if (!dayOfWeek || !timeSlotId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: dayOfWeek or timeSlotId' },
        { status: 400 }
      );
    }

    // Get active semester from cookies, query params, or headers
    let activeSemesterId = request.cookies.get('active_semester_id')?.value;
    if (!activeSemesterId) {
      activeSemesterId = searchParams.get('active_semester_id') || undefined;
    }
    if (!activeSemesterId) {
      activeSemesterId = request.headers.get('x-active-semester-id') || undefined;
    }
    if (!activeSemesterId) {
      return NextResponse.json(
        { success: false, error: 'No active semester selected. Please select an academic semester in the UI or include the `active_semester_id` cookie, query parameter, or `x-active-semester-id` header.' },
        { status: 400 }
      );
    }

    // If no roomId is provided, return empty conflicts (no conflicts for default classroom)
    if (!roomId || roomId === '') {
      return NextResponse.json({
        success: true,
        conflicts: [],
        hasConflicts: false
      });
    }
    
    // Find conflicting timetable entries for the room
    const conflicts = await prisma.timetable.findMany({
      where: {
        specialLocationId: roomId,
        dayOfWeek: parseInt(dayOfWeek),
        timeSlotId,
        semesterId: activeSemesterId,
        isActive: true,
        ...(excludeClassId && { classRoomId: { not: excludeClassId } })
      },
      include: {
        classRoom: {
          include: {
            gradeLevel: true
          }
        },
        subject: true,
        teacher: {
          include: {
            user: true
          }
        },
        specialLocation: true,
        timeSlot: true
      }
    });

    return NextResponse.json({
      success: true,
      conflicts,
      hasConflicts: conflicts.length > 0
    });
  } catch (error) {
    console.error('Error checking room conflicts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check room conflicts' },
      { status: 500 }
    );
  }
}
