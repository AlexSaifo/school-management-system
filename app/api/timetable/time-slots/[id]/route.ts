import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/timetable/time-slots/[id] - Update time slot
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, nameAr, startTime, endTime, slotType, duration, slotOrder } = body;

    // Validate required fields
    if (!name || !nameAr || !startTime || !endTime || !slotType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const timeSlot = await prisma.timeSlot.update({
      where: { id },
      data: {
        name,
        nameAr,
        startTime,
        endTime,
        slotType,
        duration: duration || 40,
        ...(slotOrder && { slotOrder })
      }
    });

    return NextResponse.json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    console.error('Error updating time slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update time slot' },
      { status: 500 }
    );
  }
}

// DELETE /api/timetable/time-slots/[id] - Delete time slot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First, check if there are any timetable entries using this time slot
    const existingEntries = await prisma.timetable.findFirst({
      where: { timeSlotId: id }
    });

    if (existingEntries) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete time slot. It is being used in timetable entries.' },
        { status: 409 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.timeSlot.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Time slot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete time slot' },
      { status: 500 }
    );
  }
}
