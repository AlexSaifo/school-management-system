import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

// PUT /api/academic/semesters/[id] - Update a semester
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) return authResult.response;

    const body = await request.json();
  let { name, nameAr, startDate, endDate, status, days, academicYearId, isActive } = body;

    // If academicYearId missing, fallback to active year
    if (!academicYearId) {
      const active = await prisma.academicYear.findFirst({ where: { isActive: true } });
      academicYearId = active?.id;
    }

    // Toggle active semester per year
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      const sem = await prisma.semester.findUnique({ where: { id: params.id } });
      if (!sem) return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
      const yearId = sem.academicYearId;
      if (isActive) {
        await prisma.$transaction([
          prisma.semester.updateMany({ data: { isActive: false } as any, where: { academicYearId: yearId } }),
          prisma.semester.update({ where: { id: params.id }, data: { isActive: true } as any })
        ]);
      } else {
        const activeCount = await prisma.semester.count({ where: { academicYearId: yearId, isActive: true } as any });
        if (activeCount <= 1) {
          return NextResponse.json({ error: 'At least one semester must remain active in the year' }, { status: 400 });
        }
        await prisma.semester.update({ where: { id: params.id }, data: { isActive: false } as any });
      }
      const updated = await prisma.semester.findUnique({ where: { id: params.id } });
      const res = NextResponse.json({ success: true, data: updated });
      if (isActive) {
        res.cookies.set('active_semester_id', params.id, { httpOnly: false, path: '/' });
      }
      return res;
    }

    // Build partial update
    const data: any = {};
    if (typeof name !== 'undefined') data.name = name;
    if (typeof nameAr !== 'undefined') data.nameAr = nameAr;
    if (typeof startDate !== 'undefined') data.startDate = new Date(startDate);
    if (typeof endDate !== 'undefined') data.endDate = new Date(endDate);
    if (typeof status !== 'undefined') data.status = status;
    if (typeof days !== 'undefined') data.days = days;
    if (typeof academicYearId !== 'undefined') {
      const year = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
      if (!year) return NextResponse.json({ error: 'Invalid academic year' }, { status: 400 });
      data.academicYearId = academicYearId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const semester = await prisma.semester.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json({ success: true, data: semester });
  } catch (error) {
    console.error('Error updating semester:', error);
    return NextResponse.json({ error: 'Failed to update semester' }, { status: 500 });
  }
}

// DELETE /api/academic/semesters/[id] - Delete a semester
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) return authResult.response;

    // Check if semester exists and get its details
    const semester = await prisma.semester.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { assignments: true, exams: true, timetables: true, classes: true, subjects: true }
        }
      }
    });

    if (!semester) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }

    if (semester.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active semester' },
        { status: 400 }
      );
    }

    // Check for associated data
    if (semester._count.assignments > 0 || semester._count.exams > 0 || 
        semester._count.timetables > 0 || semester._count.classes > 0 || semester._count.subjects > 0) {
      return NextResponse.json(
        { error: 'Cannot delete semester with associated assignments, exams, timetables, classes, or subjects' },
        { status: 400 }
      );
    }

    await prisma.semester.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester:', error);
    return NextResponse.json({ error: 'Failed to delete semester' }, { status: 500 });
  }
}
