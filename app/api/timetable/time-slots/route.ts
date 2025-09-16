import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/timetable/time-slots - Get all time slots
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

    // All authenticated users can access time slots (needed for viewing timetables)
    const timeSlots = await prisma.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { slotOrder: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: timeSlots
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
}

// POST /api/timetable/time-slots - Create new time slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameAr, startTime, endTime, slotOrder, slotType, duration } = body;

    if (!name || !nameAr || !startTime || !endTime || !slotOrder || !slotType) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        name,
        nameAr,
        startTime,
        endTime,
        slotOrder,
        slotType,
        duration: duration || 40,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create time slot' },
      { status: 500 }
    );
  }
}
