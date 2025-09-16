import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');
    const subjectId = searchParams.get('subjectId');
    const date = searchParams.get('date');

    if (!classroomId) {
      return NextResponse.json(
        { error: 'Classroom ID is required' },
        { status: 400 }
      );
    }

    // Get students in the classroom
    const students = await prisma.student.findMany({
      where: {
        classRoomId: classroomId,
        user: { status: 'ACTIVE' },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    let attendanceData = [];

    // If subject and date are provided, get existing attendance records
    if (subjectId && date) {
      // Find the timetable entry for this subject/classroom
      const timetableEntry = await prisma.timetable.findFirst({
        where: {
          classRoomId: classroomId,
          subjectId: subjectId,
          isActive: true,
        },
      });

      if (timetableEntry) {
        // Get existing attendance records for this timetable entry and date
        const existingAttendance = await prisma.$queryRaw`
          SELECT id, "studentId", status, remarks
          FROM attendances
          WHERE "timetableId" = ${timetableEntry.id}
          AND date = ${new Date(date)}
        ` as Array<{
          id: string;
          studentId: string;
          status: string;
          remarks: string | null;
        }>;

        // Create a map for quick lookup
        const attendanceMap = new Map(
          existingAttendance.map(att => [att.studentId, att])
        );

        // Combine student data with attendance data
        attendanceData = students.map(student => ({
          id: student.id,
          studentId: student.studentId,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          rollNumber: student.rollNumber,
          attendance: attendanceMap.get(student.id) || null,
        }));
      } else {
        // No timetable entry found, return students without attendance
        attendanceData = students.map(student => ({
          id: student.id,
          studentId: student.studentId,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          rollNumber: student.rollNumber,
          attendance: null,
        }));
      }
    } else {
      // Return students without attendance data
      attendanceData = students.map(student => ({
        id: student.id,
        studentId: student.studentId,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        rollNumber: student.rollNumber,
        attendance: null,
      }));
    }

    return NextResponse.json(attendanceData);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for marking attendance
export async function POST(request: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is a teacher or admin
    let teacher;
    if (decoded.role === 'ADMIN') {
      // For admin, we don't need a specific teacher - they can mark attendance for any subject
      teacher = null;
    } else if (decoded.role === 'TEACHER') {
      teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { classroomId, subjectId, date, attendanceRecords } = body;

    if (!classroomId || !subjectId || !date || !attendanceRecords) {
      return NextResponse.json(
        { error: 'Classroom ID, Subject ID, date, and attendance records are required' },
        { status: 400 }
      );
    }

    // Find the timetable entry
    const timetableEntry = await prisma.timetable.findFirst({
      where: {
        classRoomId: classroomId,
        subjectId: subjectId,
        ...(teacher && { teacherId: teacher.id }), // Only filter by teacher if not admin
        isActive: true,
      },
    });

    if (!timetableEntry) {
      return NextResponse.json(
        { error: 'No timetable entry found for this subject and classroom' },
        { status: 404 }
      );
    }

    const attendanceDate = new Date(date);

    // Process attendance records
    const results = [];
    for (const record of attendanceRecords) {
      const { studentId, status, remarks } = record;

      // Check if attendance already exists using raw SQL
      const existingAttendance = await prisma.$queryRaw`
        SELECT id FROM attendances
        WHERE "studentId" = ${studentId}
        AND "timetableId" = ${timetableEntry.id}
        AND date = ${attendanceDate}
      ` as Array<{ id: string }>;

      if (existingAttendance.length > 0) {
        // Update existing attendance using raw SQL
        await prisma.$executeRaw`
          UPDATE attendances
          SET status = ${status}::"AttendanceStatus", remarks = ${remarks || null}, "teacherId" = ${timetableEntry.teacherId}
          WHERE id = ${existingAttendance[0].id}
        `;
        results.push({ id: existingAttendance[0].id, action: 'updated' });
      } else {
        // Create new attendance using raw SQL
        const newAttendance = await prisma.$queryRaw`
          INSERT INTO attendances (id, "studentId", "teacherId", "classRoomId", "timetableId", date, status, remarks, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${studentId}, ${timetableEntry.teacherId}, ${classroomId}, ${timetableEntry.id}, ${attendanceDate}, ${status}::"AttendanceStatus", ${remarks || null}, NOW(), NOW())
          RETURNING id
        ` as Array<{ id: string }>;
        results.push({ id: newAttendance[0].id, action: 'created' });
      }
    }

    return NextResponse.json({
      message: 'Attendance marked successfully',
      records: results.length,
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
