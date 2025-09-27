import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

// GET /api/academic/academic-years/[id] - Get single academic year
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const authResult = await handleApiAuth(request, false);
    if (!authResult.success) {
      return authResult.response;
    }

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: params.id },
      include: {
        semesters: true,
        _count: {
          select: { classes: true }
        }
      }
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: academicYear
    });
  } catch (error) {
    console.error('Error fetching academic year:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic year' },
      { status: 500 }
    );
  }
}

// PUT /api/academic/academic-years/[id] - Update academic year
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request (admin only)
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();

    // Special-case: toggle isActive only
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      const nextActive = Boolean(body.isActive);
      if (nextActive) {
        // Ensure a single active year: deactivate others, activate this one
        await prisma.$transaction([
          prisma.academicYear.updateMany({
            data: { isActive: false },
            where: { NOT: { id: params.id } }
          }),
          prisma.academicYear.update({
            where: { id: params.id },
            data: { isActive: true }
          })
        ]);
      } else {
        // Prevent deactivating the last active year
        const activeCount = await prisma.academicYear.count({ where: { isActive: true } });
        if (activeCount <= 1) {
          return NextResponse.json(
            { error: 'At least one academic year must remain active' },
            { status: 400 }
          );
        }
        await prisma.academicYear.update({ where: { id: params.id }, data: { isActive: false } });
      }

      const updated = await prisma.academicYear.findUnique({
        where: { id: params.id },
        include: { semesters: true, _count: { select: { classes: true } } }
      });
      const res = NextResponse.json({ success: true, data: updated });
      // If activating, set cookie for client-side filtering; if deactivating, preserve current cookie
      if (nextActive) {
        res.cookies.set('active_academic_year_id', params.id, { httpOnly: false, path: '/' });
      }
      return res;
    }

    const {
      name,
      nameAr,
      startDate,
      endDate,
      status,
      totalDays,
      color
    } = body;

    // If name provided, ensure uniqueness against others
    if (name) {
      const existingYear = await prisma.academicYear.findFirst({
        where: {
          name,
          id: { not: params.id }
        }
      });
      if (existingYear) {
        return NextResponse.json(
          { error: 'Academic year with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Build partial update data
    const data: any = {};
    if (typeof name !== 'undefined') data.name = name;
    if (typeof nameAr !== 'undefined') data.nameAr = nameAr;
    if (typeof startDate !== 'undefined') data.startDate = new Date(startDate);
    if (typeof endDate !== 'undefined') data.endDate = new Date(endDate);
    if (typeof status !== 'undefined') data.status = status;
    if (typeof totalDays !== 'undefined') data.totalDays = totalDays;
    if (typeof color !== 'undefined') data.color = color;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id: params.id },
      data,
      include: {
        semesters: true
      }
    });

    return NextResponse.json({
      success: true,
      data: academicYear
    });
  } catch (error) {
    console.error('Error updating academic year:', error);
    return NextResponse.json(
      { error: 'Failed to update academic year' },
      { status: 500 }
    );
  }
}

// DELETE /api/academic/academic-years/[id] - Delete academic year
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request (admin only)
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) {
      return authResult.response;
    }

    // Check if academic year has associated classes
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { classes: true, semesters: true }
        },
        semesters: {
          include: {
            _count: {
              select: { assignments: true, exams: true, timetables: true, classes: true, subjects: true }
            }
          }
        }
      }
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    if (academicYear.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active academic year' },
        { status: 400 }
      );
    }

    if (academicYear._count.classes > 0) {
      return NextResponse.json(
        { error: 'Cannot delete academic year with associated classes' },
        { status: 400 }
      );
    }

    // Check if any semester has associated data
    const semesterWithData = academicYear.semesters.find(semester => 
      semester._count.assignments > 0 || semester._count.exams > 0 || 
      semester._count.timetables > 0 || semester._count.classes > 0 || semester._count.subjects > 0
    );

    if (semesterWithData) {
      return NextResponse.json(
        { error: 'Cannot delete academic year with semesters that have associated assignments, exams, timetables, classes, or subjects' },
        { status: 400 }
      );
    }

    if (academicYear.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active academic year' },
        { status: 400 }
      );
    }

    // Delete the academic year (this will cascade to semesters)
    await prisma.academicYear.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Academic year deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json(
      { error: 'Failed to delete academic year' },
      { status: 500 }
    );
  }
}