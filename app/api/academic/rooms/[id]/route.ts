import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenEdge } from '@/lib/auth-edge';

// GET /api/academic/rooms/[id] - Get specific special location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const specialLocation = await prisma.specialLocation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        nameAr: true,
        type: true,
        floor: true,
        capacity: true,
        facilities: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!specialLocation) {
      return NextResponse.json({ error: 'Special location not found' }, { status: 404 });
    }

    return NextResponse.json({ specialLocation });
  } catch (error) {
    console.error('Error fetching special location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/academic/rooms/[id] - Update special location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      nameAr, 
      type, 
      capacity, 
      floor, 
      facilities,
      isActive 
    } = body;

    // Check if the new name conflicts with existing ones (if being changed)
    if (name) {
      const existingLocation = await prisma.specialLocation.findFirst({
        where: { 
          name,
          id: { not: params.id }
        }
      });

      if (existingLocation) {
        return NextResponse.json({ 
          error: 'Special location with this name already exists' 
        }, { status: 409 });
      }
    }

    const specialLocation = await prisma.specialLocation.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(nameAr && { nameAr }),
        ...(type && { type }),
        ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
        ...(floor !== undefined && { floor: floor ? parseInt(floor) : null }),
        ...(facilities && { facilities }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ specialLocation });
  } catch (error) {
    console.error('Error updating special location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/academic/rooms/[id] - Delete special location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Soft delete by setting isActive to false instead of hard delete
    await prisma.specialLocation.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Special location deleted successfully' });
  } catch (error) {
    console.error('Error deleting special location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
