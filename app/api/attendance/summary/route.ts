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

    // Only admin can access this endpoint
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Create date range for the selected date (start of day to end of day)
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    // Get all active grades with their classrooms and attendance data
    const grades = await prisma.gradeLevel.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
      include: {
        classRooms: {
          where: { isActive: true },
          orderBy: { sectionNumber: 'asc' },
          include: {
            students: {
              include: {
                attendances: {
                  where: {
                    date: {
                      gte: startOfDay,
                      lte: endOfDay,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate attendance statistics for each grade and classroom
    const attendanceSummary = grades.map(grade => {
      const gradeStats = {
        id: grade.id,
        name: grade.name,
        nameAr: grade.nameAr,
        level: grade.level,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
        classrooms: [] as any[],
      };

      grade.classRooms.forEach(classroom => {
        const classroomStats = {
          id: classroom.id,
          name: classroom.name,
          nameAr: classroom.nameAr,
          section: classroom.section,
          roomNumber: classroom.roomNumber,
          totalStudents: classroom.students.length,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          attendanceRate: 0,
        };

        classroom.students.forEach(student => {
          if (student.attendances.length > 0) {
            const attendance = student.attendances[0];
            switch (attendance.status) {
              case 'PRESENT':
                classroomStats.presentCount++;
                break;
              case 'ABSENT':
                classroomStats.absentCount++;
                break;
              case 'LATE':
                classroomStats.lateCount++;
                break;
              case 'EXCUSED':
                classroomStats.excusedCount++;
                break;
            }
          } else {
            // No attendance record - count as absent
            classroomStats.absentCount++;
          }
        });

        // Calculate attendance rate
        if (classroomStats.totalStudents > 0) {
          classroomStats.attendanceRate = Math.round(
            ((classroomStats.presentCount + classroomStats.lateCount + classroomStats.excusedCount) /
             classroomStats.totalStudents) * 100
          );
        }

        // Add to grade totals
        gradeStats.totalStudents += classroomStats.totalStudents;
        gradeStats.presentCount += classroomStats.presentCount;
        gradeStats.absentCount += classroomStats.absentCount;
        gradeStats.lateCount += classroomStats.lateCount;
        gradeStats.excusedCount += classroomStats.excusedCount;

        gradeStats.classrooms.push(classroomStats);
      });

      // Calculate grade attendance rate
      if (gradeStats.totalStudents > 0) {
        gradeStats.attendanceRate = Math.round(
          ((gradeStats.presentCount + gradeStats.lateCount + gradeStats.excusedCount) /
           gradeStats.totalStudents) * 100
        );
      }

      return gradeStats;
    });

    // Calculate overall statistics
    const overallStats = {
      totalStudents: attendanceSummary.reduce((sum, grade) => sum + grade.totalStudents, 0),
      totalPresent: attendanceSummary.reduce((sum, grade) => sum + grade.presentCount, 0),
      totalAbsent: attendanceSummary.reduce((sum, grade) => sum + grade.absentCount, 0),
      totalLate: attendanceSummary.reduce((sum, grade) => sum + grade.lateCount, 0),
      totalExcused: attendanceSummary.reduce((sum, grade) => sum + grade.excusedCount, 0),
      overallAttendanceRate: 0,
    };

    if (overallStats.totalStudents > 0) {
      overallStats.overallAttendanceRate = Math.round(
        ((overallStats.totalPresent + overallStats.totalLate + overallStats.totalExcused) /
         overallStats.totalStudents) * 100
      );
    }

    return NextResponse.json({
      date,
      overallStats,
      grades: attendanceSummary,
    });

  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}