import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await handleApiAuth(request, true); // Require admin access
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const gradeLevelId = searchParams.get('gradeLevelId') || undefined;
    const academicYearId = searchParams.get('academicYearId') || undefined;
    const onlyActive = searchParams.get('onlyActive') === 'true';

    const activeSemesterCookie = request.cookies.get('active_semester_id')?.value;

    let semesterFilter: { OR?: any[] } | null = null;

    if (activeSemesterCookie) {
      const activeSemester = await prisma.semester.findUnique({
        where: { id: activeSemesterCookie },
        select: { id: true, isActive: true, academicYearId: true }
      });

      if (activeSemester?.isActive) {
        semesterFilter = {
          OR: [
            { semesterId: activeSemester.id },
            {
              AND: [
                { semesterId: null },
                { academicYearId: activeSemester.academicYearId }
              ]
            }
          ]
        };
      }
    }

    if (!semesterFilter) {
      const fallbackSemester = await prisma.semester.findFirst({
        where: { isActive: true },
        select: { id: true, academicYearId: true }
      });

      if (fallbackSemester) {
        semesterFilter = {
          OR: [
            { semesterId: fallbackSemester.id },
            {
              AND: [
                { semesterId: null },
                { academicYearId: fallbackSemester.academicYearId }
              ]
            }
          ]
        };
      }
    }

    const whereClause: any = {};

    if (gradeLevelId) {
      whereClause.gradeLevelId = gradeLevelId;
    }

    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    }

    if (onlyActive) {
      whereClause.isActive = true;
    }

    const andFilters: any[] = [];

    if (semesterFilter) {
      andFilters.push(semesterFilter);
    }

    if (!academicYearId && !semesterFilter) {
      const activeAcademicYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true }
      });

      if (activeAcademicYear) {
        whereClause.academicYearId = activeAcademicYear.id;
      }
    }

    if (andFilters.length) {
      whereClause.AND = andFilters;
    }

    const classRooms = await prisma.classRoom.findMany({
      where: Object.keys(whereClause).length ? whereClause : undefined,
      include: {
        gradeLevel: true,
        academicYear: true,
        semester: true,
        students: {
          select: { id: true }
        },
        _count: {
          select: {
            students: true,
            timetables: true,
            attendances: true,
            assignments: true,
            exams: true
          }
        }
      },
      orderBy: [
        { gradeLevel: { level: 'asc' } },
        { sectionNumber: 'asc' }
      ]
    });

    return NextResponse.json({ classRooms });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await handleApiAuth(request, false);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      name,
      nameAr,
      section,
      sectionNumber,
      gradeLevelId,
      roomNumber,
      floor,
      capacity,
      facilities,
      isActive,
      academicYearId,
      semesterId
    } = body;

    // Validate required fields
    if (!section || !gradeLevelId || !roomNumber || !academicYearId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if classroom with same grade level and section already exists
    const existingClassRoom = await prisma.classRoom.findFirst({
      where: {
        gradeLevelId,
        sectionNumber: sectionNumber || 1,
        academicYearId
      }
    });

    if (existingClassRoom) {
      return NextResponse.json(
        { error: 'A classroom with this grade level and section number already exists for this academic year' },
        { status: 400 }
      );
    }

    // Check if room number is already taken
    const existingRoom = await prisma.classRoom.findFirst({
      where: {
        roomNumber,
        academicYearId
      }
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room number is already taken for this academic year' },
        { status: 400 }
      );
    }

    // Get grade level info to generate names if not provided
    const gradeLevel = await prisma.gradeLevel.findUnique({
      where: { id: gradeLevelId }
    });

    if (!gradeLevel) {
      return NextResponse.json(
        { error: 'Grade level not found' },
        { status: 404 }
      );
    }

    const classRoom = await prisma.classRoom.create({
      data: {
        name: name || `${gradeLevel.name} - Section ${section}`,
        nameAr: nameAr || `${gradeLevel.nameAr} - شعبة ${section}`,
        section,
        sectionNumber: sectionNumber || 1,
        gradeLevel: {
          connect: { id: gradeLevelId }
        },
        roomNumber,
        floor: floor || 1,
        capacity: capacity || 30,
        facilities: facilities || [],
        isActive: isActive !== undefined ? isActive : true,
        academicYear: {
          connect: { id: academicYearId }
        },
        ...(semesterId && {
          semester: {
            connect: { id: semesterId }
          }
        })
      },
      include: {
        gradeLevel: true,
        academicYear: true
      }
    });

    return NextResponse.json({ classRoom }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating classroom:', error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('gradeLevelId') && error.meta?.target?.includes('sectionNumber') && error.meta?.target?.includes('academicYearId')) {
        return NextResponse.json(
          { error: 'A classroom with this grade level and section number already exists for this academic year' },
          { status: 400 }
        );
      }
      if (error.meta?.target?.includes('roomNumber')) {
        return NextResponse.json(
          { error: 'This room number is already taken for this academic year' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
