import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

// POST /api/academic/semesters - Create a semester
export async function POST(request: NextRequest) {
  try {
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) return authResult.response;

    const body = await request.json();
    let { name, nameAr, startDate, endDate, status, days, academicYearId } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Name and dates are required' }, { status: 400 });
    }

    // If no academicYearId passed, fallback to active year
    if (!academicYearId) {
      const active = await prisma.academicYear.findFirst({ where: { isActive: true } });
      if (!active) {
        return NextResponse.json({ error: 'No active academic year set' }, { status: 400 });
      }
      academicYearId = active.id;
    }

    // Ensure the academic year exists
    const year = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!year) {
      return NextResponse.json({ error: 'Invalid academic year' }, { status: 400 });
    }

    const semester = await prisma.semester.create({
      data: {
        name,
        nameAr,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'PLANNING',
        days: days ?? 90,
        academicYearId
      }
    });

    return NextResponse.json({ success: true, data: semester }, { status: 201 });
  } catch (error) {
    console.error('Error creating semester:', error);
    return NextResponse.json({ error: 'Failed to create semester' }, { status: 500 });
  }
}
