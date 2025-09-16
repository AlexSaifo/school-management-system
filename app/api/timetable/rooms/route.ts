import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/timetable/rooms - Get rooms for timetable selection
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

    // Only admins and teachers can access room information for timetables
    if (decoded.role !== 'ADMIN' && decoded.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const available = searchParams.get('available');
    const timeSlotId = searchParams.get('timeSlotId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    let whereClause: any = {
      isActive: true
    };

    if (type) {
      whereClause.type = type;
    }

    // Get both classrooms and special locations
    const [classrooms, specialLocations] = await Promise.all([
      prisma.classRoom.findMany({
        where: {
          isActive: true,
          ...whereClause
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
          roomNumber: true,
          floor: true,
          capacity: true,
          facilities: true,
          timetables: available === 'true' && timeSlotId && dayOfWeek ? {
            where: {
              timeSlotId: timeSlotId,
              dayOfWeek: parseInt(dayOfWeek),
              isActive: true
            }
          } : undefined
        }
      }),
      prisma.specialLocation.findMany({
        where: {
          isActive: true,
          ...whereClause
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
          type: true,
          floor: true,
          capacity: true,
          facilities: true,
          timetables: available === 'true' && timeSlotId && dayOfWeek ? {
            where: {
              timeSlotId: timeSlotId,
              dayOfWeek: parseInt(dayOfWeek),
              isActive: true
            }
          } : undefined
        }
      })
    ]);

    // Combine and format the results
    const rooms = [
      ...classrooms.map(room => ({
        id: room.id,
        name: room.name,
        nameAr: room.nameAr,
        number: room.roomNumber,
        type: 'classroom' as const,
        floor: room.floor,
        capacity: room.capacity,
        facilities: room.facilities,
        isAvailable: available === 'true' ? !room.timetables?.length : undefined
      })),
      ...specialLocations.map(room => ({
        id: room.id,
        name: room.name,
        nameAr: room.nameAr,
        number: null,
        type: room.type,
        floor: room.floor,
        capacity: room.capacity,
        facilities: room.facilities,
        isAvailable: available === 'true' ? !room.timetables?.length : undefined
      }))
    ];

    // Filter out rooms that are occupied if checking availability
    const filteredRooms = available === 'true' && timeSlotId && dayOfWeek
      ? rooms.filter((room: any) => !room.timetables || room.timetables.length === 0)
      : rooms;

    return NextResponse.json({
      success: true,
      data: filteredRooms.map((room: any) => ({
        id: room.id,
        name: room.name,
        nameAr: room.nameAr,
        number: room.number,
        type: room.type,
        floor: room.floor,
        capacity: room.capacity,
        facilities: room.facilities,
        isAvailable: room.isAvailable
      }))
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
