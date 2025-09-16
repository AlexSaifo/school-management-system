import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyToken(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const specialLocation = await prisma.specialLocation.findUnique({
      where: { id: params.id }
    });

    if (!specialLocation) {
      return NextResponse.json(
        { error: 'Special location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ specialLocation });
  } catch (error) {
    console.error('Error fetching special location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyToken(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nameAr,
      type,
      roomNumber,
      floor,
      capacity,
      facilities,
      isActive,
      description,
      descriptionAr
    } = body;

    // Check if special location exists
    const existingLocation = await prisma.specialLocation.findUnique({
      where: { id: params.id }
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Special location not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (type !== undefined) updateData.type = type;
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
    if (floor !== undefined) updateData.floor = floor;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (facilities !== undefined) updateData.facilities = facilities;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (description !== undefined) updateData.description = description;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;

    const specialLocation = await prisma.specialLocation.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({ specialLocation });
  } catch (error) {
    console.error('Error updating special location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyToken(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if special location exists
    const specialLocation = await prisma.specialLocation.findUnique({
      where: { id: params.id },
      include: {
        timetables: true
      }
    });

    if (!specialLocation) {
      return NextResponse.json(
        { error: 'Special location not found' },
        { status: 404 }
      );
    }

    // Check if location has any associated timetable entries
    if (specialLocation.timetables.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete special location with timetable entries' },
        { status: 400 }
      );
    }

    await prisma.specialLocation.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting special location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
