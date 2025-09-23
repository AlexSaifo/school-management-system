import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

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

    const classRoom = await prisma.classRoom.findUnique({
      where: { id: params.id },
      include: {
        gradeLevel: true,
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!classRoom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ classRoom });
  } catch (error) {
    console.error('Error fetching classroom:', error);
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
      isActive
    } = body;

    // Check if classroom exists
    const existingClassRoom = await prisma.classRoom.findUnique({
      where: { id: params.id }
    });

    if (!existingClassRoom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    // Check if another classroom with same grade level and section exists
    if (gradeLevelId && section) {
      const duplicateClassRoom = await prisma.classRoom.findFirst({
        where: {
          gradeLevelId,
          section,
          academicYearId: existingClassRoom.academicYearId,
          NOT: { id: params.id }
        }
      });

      if (duplicateClassRoom) {
        return NextResponse.json(
          { error: 'A classroom with this grade level and section already exists for this academic year' },
          { status: 400 }
        );
      }
    }

    // Check if room number is already taken by another classroom
    if (roomNumber) {
      const duplicateRoom = await prisma.classRoom.findFirst({
        where: {
          roomNumber,
          academicYearId: existingClassRoom.academicYearId,
          NOT: { id: params.id }
        }
      });

      if (duplicateRoom) {
        return NextResponse.json(
          { error: 'Room number is already taken for this academic year' },
          { status: 400 }
        );
      }
    }

    // Get grade level info to generate names if needed
    let gradeLevel = null;
    if (gradeLevelId) {
      gradeLevel = await prisma.gradeLevel.findUnique({
        where: { id: gradeLevelId }
      });

      if (!gradeLevel) {
        return NextResponse.json(
          { error: 'Grade level not found' },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (section !== undefined) updateData.section = section;
    if (sectionNumber !== undefined) updateData.sectionNumber = sectionNumber;
    if (gradeLevelId !== undefined) updateData.gradeLevelId = gradeLevelId;
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
    if (floor !== undefined) updateData.floor = floor;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (facilities !== undefined) updateData.facilities = facilities;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Auto-generate names if grade level or section changed but names not provided
    if (gradeLevel && section && !name) {
      updateData.name = `${gradeLevel.name} - Section ${section}`;
    }
    if (gradeLevel && section && !nameAr) {
      updateData.nameAr = `${gradeLevel.nameAr} - شعبة ${section}`;
    }

    const classRoom = await prisma.classRoom.update({
      where: { id: params.id },
      data: updateData,
      include: {
        gradeLevel: true
      }
    });

    return NextResponse.json({ classRoom });
  } catch (error) {
    console.error('Error updating classroom:', error);
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
    // Authenticate the request
    const authResult = await handleApiAuth(request, false);
    if (!authResult.success) {
      return authResult.response;
    }

    // Check if classroom exists
    const classRoom = await prisma.classRoom.findUnique({
      where: { id: params.id },
      include: {
        students: true,
        timetables: true,
        attendances: true,
        assignments: true,
        exams: true
      }
    });

    if (!classRoom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    // Check if classroom has any associated data
    if (classRoom.students.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete classroom with enrolled students' },
        { status: 400 }
      );
    }

    if (classRoom.timetables.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete classroom with timetable entries' },
        { status: 400 }
      );
    }

    if (classRoom.attendances.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete classroom with attendance records' },
        { status: 400 }
      );
    }

    if (classRoom.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete classroom with assignments' },
        { status: 400 }
      );
    }

    if (classRoom.exams.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete classroom with exams' },
        { status: 400 }
      );
    }

    await prisma.classRoom.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
