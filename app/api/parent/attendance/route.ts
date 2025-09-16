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

    if (decoded.role !== 'PARENT') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get parent and verify they have access to this student
    const parent = await prisma.parent.findUnique({
      where: { userId: decoded.userId },
      include: {
        children: {
          where: studentId ? { studentId: studentId } : undefined,
          include: {
            student: {
              include: {
                user: true,
                classRoom: {
                  include: {
                    gradeLevel: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent || parent.children.length === 0) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    const student = parent.children[0].student;

    // Build attendance query using raw SQL to handle timetableId
    let whereConditions = [`a."studentId" = '${student.id}'`];

    if (subjectId) {
      // Find timetable entries for this subject
      const timetableEntries = await prisma.timetable.findMany({
        where: {
          classRoomId: student.classRoomId!,
          subjectId: subjectId,
          isActive: true,
        },
        select: { id: true },
      });

      if (timetableEntries.length > 0) {
        const timetableIds = timetableEntries.map(t => `'${t.id}'`).join(',');
        whereConditions.push(`a."timetableId" IN (${timetableIds})`);
      }
    }

    if (startDate && endDate) {
      whereConditions.push(`a.date >= '${startDate}' AND a.date <= '${endDate}'`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Construct the full SQL query
    const sqlQuery = `
      SELECT
        a.id,
        a.date,
        a.status,
        a.remarks,
        s.id as subject_id,
        s.name as subject_name,
        s."nameAr" as subject_name_ar,
        s.code as subject_code,
        ts.id as timeslot_id,
        ts.name as timeslot_name,
        ts."nameAr" as timeslot_name_ar,
        ts."startTime" as timeslot_start,
        ts."endTime" as timeslot_end,
        u_teacher."firstName" as teacher_first_name,
        u_teacher."lastName" as teacher_last_name
      FROM attendances a
      LEFT JOIN timetables t ON a."timetableId" = t.id
      LEFT JOIN subjects s ON t."subjectId" = s.id
      LEFT JOIN time_slots ts ON t."timeSlotId" = ts.id
      LEFT JOIN teachers teacher ON t."teacherId" = teacher.id
      LEFT JOIN users u_teacher ON teacher."userId" = u_teacher.id
      WHERE ${whereClause}
      ORDER BY a.date DESC
    `;

    // Get attendance records using raw SQL
    const attendanceRecords = await prisma.$queryRawUnsafe(sqlQuery) as Array<{
      id: string;
      date: Date;
      status: string;
      remarks: string | null;
      subject_id: string | null;
      subject_name: string | null;
      subject_name_ar: string | null;
      subject_code: string | null;
      timeslot_id: string | null;
      timeslot_name: string | null;
      timeslot_name_ar: string | null;
      timeslot_start: string | null;
      timeslot_end: string | null;
      teacher_first_name: string | null;
      teacher_last_name: string | null;
    }>;

    // Format the response
    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      remarks: record.remarks,
      subject: record.subject_id ? {
        id: record.subject_id,
        name: record.subject_name,
        nameAr: record.subject_name_ar,
        code: record.subject_code,
      } : null,
      timeSlot: record.timeslot_id ? {
        id: record.timeslot_id,
        name: record.timeslot_name,
        nameAr: record.timeslot_name_ar,
        startTime: record.timeslot_start,
        endTime: record.timeslot_end,
      } : null,
      teacher: record.teacher_first_name ? {
        firstName: record.teacher_first_name,
        lastName: record.teacher_last_name,
      } : null,
    }));

    // Calculate attendance statistics
    const totalRecords = formattedRecords.length;
    const presentCount = formattedRecords.filter(r => r.status === 'PRESENT').length;
    const absentCount = formattedRecords.filter(r => r.status === 'ABSENT').length;
    const lateCount = formattedRecords.filter(r => r.status === 'LATE').length;
    const excusedCount = formattedRecords.filter(r => r.status === 'EXCUSED').length;

    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    return NextResponse.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        classRoom: student.classRoom ? {
          name: student.classRoom.name,
          nameAr: student.classRoom.nameAr,
          gradeLevel: student.classRoom.gradeLevel ? {
            name: student.classRoom.gradeLevel.name,
            nameAr: student.classRoom.gradeLevel.nameAr,
          } : null,
        } : null,
      },
      attendance: {
        records: formattedRecords,
        statistics: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        },
      },
    });
  } catch (error) {
    console.error('Error fetching parent attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}