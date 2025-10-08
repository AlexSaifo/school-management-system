import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

// GET /api/academic/classes - Get all classrooms with grade levels
export async function GET(request: NextRequest) {
  try {
    // Authenticate (no longer forcing admin only)
    const authResult = await handleApiAuth(request, false);
    if (!authResult.success) {
      return authResult.response!;
    }

    const role = authResult.auth!.role;
    const userId = authResult.auth!.userId;

    const { searchParams } = new URL(request.url);
    const gradeLevel = searchParams.get('gradeLevel');

    // Build base where clause
    let whereClause: any = { isActive: true };

    if (gradeLevel) {
      const grade = await prisma.gradeLevel.findFirst({
        where: { level: parseInt(gradeLevel) }
      });
      if (grade) {
        whereClause.gradeLevelId = grade.id;
      }
    }

    // Role-specific filtering
    if (role === 'ADMIN') {
      // no extra filters
    } else if (role === 'TEACHER') {
      // Get teacher id
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
      }
      // Restrict to classes where teacher is classTeacher OR has timetable entries
      whereClause = {
        ...whereClause,
        OR: [
          { classTeacherId: teacher.id },
          { timetables: { some: { teacherId: teacher.id } } }
        ]
      };
    } else if (role === 'STUDENT') {
      // Students may need their own single classroom (optional for now)
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { classRoomId: true }
      });
      if (!student?.classRoomId) {
        return NextResponse.json({ success: true, classRooms: [], data: [] });
      }
      whereClause = { ...whereClause, id: student.classRoomId };
    } else {
      // Parents currently not authorized
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const classRooms = await prisma.classRoom.findMany({
      where: whereClause,
      include: {
        gradeLevel: { select: { id: true, level: true, nameAr: true } },
        students: { select: { id: true } },
        academicYear: true,
        _count: { select: { students: true } }
      },
      orderBy: [
        { gradeLevel: { level: 'asc' } },
        { sectionNumber: 'asc' }
      ]
    });

    const mapped = classRooms.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      nameAr: cls.nameAr,
      section: cls.section,
      sectionNumber: cls.sectionNumber,
      roomNumber: cls.roomNumber,
      floor: cls.floor,
      capacity: cls.capacity,
      facilities: cls.facilities,
      isActive: cls.isActive,
      academicYear: cls.academicYear,
      gradeLevel: cls.gradeLevel,
      studentCount: cls._count.students
    }));

    return NextResponse.json({ success: true, classRooms: mapped, data: mapped });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
