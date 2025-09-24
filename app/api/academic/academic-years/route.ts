import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

// GET /api/academic/academic-years - List all academic years
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await handleApiAuth(request, true); // Require admin access
    if (!authResult.success) {
      return authResult.response;
    }

    const academicYears = await prisma.academicYear.findMany({
      include: {
        semesters: true,
        _count: {
          select: { classes: true }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: academicYears
    });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic years' },
      { status: 500 }
    );
  }
}

// POST /api/academic/academic-years - Create new academic year
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request (admin only)
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      name,
      nameAr,
      startDate,
      endDate,
      status,
      totalDays,
      color
    } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Check if academic year with this name already exists
    const existingYear = await prisma.academicYear.findUnique({
      where: { name }
    });

    if (existingYear) {
      return NextResponse.json(
        { error: 'Academic year with this name already exists' },
        { status: 400 }
      );
    }

    // Create the academic year
    const academicYear = await prisma.academicYear.create({
      data: {
        name,
        nameAr,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'PLANNING',
        totalDays: totalDays || 180,
        color: color || '#1976d2'
      },
      include: {
        semesters: true
      }
    });

    return NextResponse.json({
      success: true,
      data: academicYear
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating academic year:', error);
    return NextResponse.json(
      { error: 'Failed to create academic year' },
      { status: 500 }
    );
  }
}