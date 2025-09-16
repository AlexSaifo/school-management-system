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

    if (!roomId || !dayOfWeek || !timeSlotId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Find conflicting timetable entries for the room
    const conflicts = await prisma.timetable.findMany({
      where: {
        specialLocationId: roomId,
        dayOfWeek: parseInt(dayOfWeek),
        timeSlotId,
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
