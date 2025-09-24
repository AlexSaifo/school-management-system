import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request using our improved API auth handler
    const authResult = await handleApiAuth(request, true); // Require admin access
    if (!authResult.success) {
      return authResult.response;
    }

    const specialLocations = await prisma.specialLocation.findMany({
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }  // Changed from roomNumber to name since SpecialLocation doesn't have roomNumber
      ]
    });

    return NextResponse.json({ 
      success: true,
      data: specialLocations 
    });
  } catch (error) {
    console.error('Error fetching special locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request using our improved API auth handler
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      name,
      nameAr,
      type,
      floor,
      capacity,
      facilities,
      isActive,
      description,
      descriptionAr
    } = body;

    // Validate required fields
    if (!name || !nameAr || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the name is already taken
    const existingLocation = await prisma.specialLocation.findFirst({
      where: {
        name
      }
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: 'Special location with this name already exists' },
        { status: 400 }
      );
    }

    const specialLocation = await prisma.specialLocation.create({
      data: {
        name,
        nameAr,
        type,
        floor: floor || 1,
        capacity: capacity || 30,
        facilities: facilities || [],
        isActive: isActive !== undefined ? isActive : true,
        description
      }
    });

    return NextResponse.json({ specialLocation }, { status: 201 });
  } catch (error) {
    console.error('Error creating special location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
