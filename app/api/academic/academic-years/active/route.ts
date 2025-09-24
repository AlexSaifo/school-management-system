import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

// GET /api/academic/academic-years/active - Get active academic year
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await handleApiAuth(request, false);
    if (!authResult.success) {
      return authResult.response;
    }

    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        semesters: true,
        _count: {
          select: { classes: true }
        }
      }
    });

    if (!activeYear) {
      return NextResponse.json(
        { error: 'No active academic year found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activeYear
    });
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active academic year' },
      { status: 500 }
    );
  }
}