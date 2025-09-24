import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenEdge } from '@/lib/auth-edge';

// GET /api/academic/rooms - Get all special locations
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let whereClause: any = {
      isActive: true
    };

    if (type) {
      whereClause.type = type;
    }

    const specialLocations = await prisma.specialLocation.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { floor: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ specialLocations });
  } catch (error) {
    console.error('Error fetching special locations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/academic/rooms - Create new special location
export async function POST(request: NextRequest) {
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
      facilities
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({
        error: 'Name and type are required'
      }, { status: 400 });
    }

    // Check if special location with same name already exists
    const existingLocation = await prisma.specialLocation.findFirst({
      where: { 
        name
      }
    });

    if (existingLocation) {
      return NextResponse.json({ 
        error: 'Special location with this name already exists' 
      }, { status: 409 });
    }

    const specialLocation = await prisma.specialLocation.create({
      data: {
        name,
        nameAr,
        type,
        capacity: capacity ? parseInt(capacity) : 0,
        floor: floor ? parseInt(floor) : 0,
        facilities: facilities || []
      }
    });

    return NextResponse.json({ specialLocation });
  } catch (error) {
    console.error('Error creating special location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
