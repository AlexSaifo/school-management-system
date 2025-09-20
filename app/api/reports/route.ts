import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const classRoomId = searchParams.get('classRoomId');
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const subjectId = searchParams.get('subjectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(endDate)
    } : undefined;

    switch (type) {
      case 'student-attendance':
        return await getStudentAttendanceReport(studentId!, dateFilter);
      case 'class-attendance':
        return await getClassAttendanceReport(classRoomId, dateFilter);
      case 'student-grades':
        return await getStudentGradesReport(studentId!, dateFilter);
      case 'class-grades':
        return await getClassGradesReport(classRoomId, subjectId, dateFilter);
      case 'teacher-performance':
        return await getTeacherPerformanceReport(teacherId!, dateFilter);
      case 'school-overview':
        return await getSchoolOverviewReport(dateFilter);
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getStudentAttendanceReport(studentId: string, dateFilter?: any) {
  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      ...(dateFilter && { date: dateFilter })
    },
    include: {
      classRoom: {
        include: {
          gradeLevel: true
        }
      },
      timetable: {
        include: {
          subject: true
        }
      },
      teacher: {
        include: {
          user: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });

  const totalDays = attendances.length;
  const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
  const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
  const lateDays = attendances.filter(a => a.status === 'LATE').length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return NextResponse.json({
    summary: {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    },
    details: attendances
  });
}

async function getClassAttendanceReport(classRoomId: string | null, dateFilter?: any) {
  const whereClause: any = {
    ...(classRoomId && { classRoomId }),
    ...(dateFilter && { date: dateFilter })
  };

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      student: {
        include: {
          user: true
        }
      },
      timetable: {
        include: {
          subject: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });

  const students = classRoomId ? await prisma.student.findMany({
    where: { classRoomId },
    include: {
      user: true
    }
  }) : await prisma.student.findMany({
    include: {
      user: true
    }
  });

  const studentStats = students.map(student => {
    const studentAttendances = attendances.filter(a => a.studentId === student.id);
    const total = studentAttendances.length;
    const present = studentAttendances.filter(a => a.status === 'PRESENT').length;
    const rate = total > 0 ? (present / total) * 100 : 0;

    return {
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      totalDays: total,
      presentDays: present,
      attendanceRate: Math.round(rate * 100) / 100
    };
  });

  const classTotal = attendances.length;
  const classPresent = attendances.filter(a => a.status === 'PRESENT').length;
  const classRate = classTotal > 0 ? (classPresent / classTotal) * 100 : 0;

  // Group attendances by month for trend data
  const monthlyTrend = attendances.reduce((acc: any[], attendance) => {
    const date = new Date(attendance.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    const existingMonth = acc.find(m => m.month === monthName);
    if (existingMonth) {
      existingMonth.total += 1;
      if (attendance.status === 'PRESENT') existingMonth.present += 1;
    } else {
      acc.push({
        month: monthName,
        total: 1,
        present: attendance.status === 'PRESENT' ? 1 : 0
      });
    }
    return acc;
  }, []).map(month => ({
    month: month.month,
    attendance: month.total > 0 ? Math.round((month.present / month.total) * 100 * 100) / 100 : 0
  }));

  return NextResponse.json({
    summary: {
      totalRecords: classTotal,
      presentRecords: classPresent,
      attendanceRate: Math.round(classRate * 100) / 100
    },
    details: attendances,
    monthlyTrend,
    studentStats
  });
}

async function getStudentGradesReport(studentId: string, dateFilter?: any) {
  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      ...(dateFilter && { examDate: dateFilter })
    },
    include: {
      subject: true
    },
    orderBy: { examDate: 'desc' }
  });

  const subjectStats = grades.reduce((acc, grade) => {
    const subjectId = grade.subjectId;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subjectName: grade.subject.name,
        grades: [],
        average: 0
      };
    }
    acc[subjectId].grades.push(grade);
    return acc;
  }, {} as Record<string, any>);

  Object.keys(subjectStats).forEach(subjectId => {
    const subject = subjectStats[subjectId];
    const totalMarks = subject.grades.reduce((sum: number, g: any) => sum + Number(g.marks), 0);
    subject.average = subject.grades.length > 0 ? totalMarks / subject.grades.length : 0;
    subject.average = Math.round(subject.average * 100) / 100;
  });

  const overallAverage = grades.length > 0
    ? grades.reduce((sum, g) => sum + Number(g.marks), 0) / grades.length
    : 0;

  const subjects = Object.values(subjectStats).map((subject: any) => ({
    name: subject.subjectName,
    average: subject.average
  }));

  return NextResponse.json({
    overallAverage: Math.round(overallAverage * 100) / 100,
    subjects,
    subjectStats,
    grades
  });
}

async function getClassGradesReport(classRoomId: string | null, subjectId?: string | null, dateFilter?: any) {
  const whereClause: any = {
    ...(classRoomId && {
      student: {
        classRoomId
      }
    }),
    ...(subjectId && { subjectId }),
    ...(dateFilter && { examDate: dateFilter })
  };

  const grades = await prisma.grade.findMany({
    where: whereClause,
    include: {
      student: {
        include: {
          user: true
        }
      },
      subject: true
    },
    orderBy: { examDate: 'desc' }
  });

  const gradeDistributionObj = {
    '90-100': grades.filter(g => Number(g.marks) >= 90).length,
    '80-89': grades.filter(g => Number(g.marks) >= 80 && Number(g.marks) < 90).length,
    '70-79': grades.filter(g => Number(g.marks) >= 70 && Number(g.marks) < 80).length,
    '60-69': grades.filter(g => Number(g.marks) >= 60 && Number(g.marks) < 70).length,
    '0-59': grades.filter(g => Number(g.marks) < 60).length
  };

  // Transform to array format expected by frontend
  const totalGrades = grades.length;
  const gradeDistribution = Object.entries(gradeDistributionObj).map(([gradeRange, count]) => ({
    gradeRange,
    count,
    percentage: totalGrades > 0 ? Math.round((count / totalGrades) * 100 * 100) / 100 : 0
  }));

  const averageGrade = grades.length > 0
    ? grades.reduce((sum, g) => sum + Number(g.marks), 0) / grades.length
    : 0;

  // Calculate subject performance
  const subjectMap = new Map();
  grades.forEach(grade => {
    const subjectId = grade.subjectId;
    const subjectName = grade.subject.name;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subject: subjectName,
        grades: []
      });
    }
    subjectMap.get(subjectId).grades.push(grade);
  });

  const subjectPerformance = Array.from(subjectMap.entries()).map(([subjectId, data]) => {
    const average = data.grades.length > 0
      ? data.grades.reduce((sum: number, g: any) => sum + Number(g.marks), 0) / data.grades.length
      : 0;
    return {
      subject: data.subject,
      average: Math.round(average * 100) / 100
    };
  });

  return NextResponse.json({
    totalGrades: grades.length,
    averageGrade: Math.round(averageGrade * 100) / 100,
    gradeDistribution,
    subjectPerformance,
    grades
  });
}

async function getTeacherPerformanceReport(teacherId: string, dateFilter?: any) {
  // Get teacher's subjects
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: { teacherId },
    include: { subject: true }
  });

  // Get classes taught by teacher
  const timetables = await prisma.timetable.findMany({
    where: { teacherId },
    include: {
      classRoom: {
        include: {
          gradeLevel: true
        }
      },
      subject: true
    }
  });

  const uniqueClasses = Array.from(new Set(timetables.map(t => t.classRoomId)));

  // Get student performance in teacher's subjects
  const grades = await prisma.grade.findMany({
    where: {
      subjectId: { in: teacherSubjects.map(ts => ts.subjectId) },
      ...(dateFilter && { examDate: dateFilter })
    },
    include: {
      student: {
        include: {
          classRoom: {
            include: {
              gradeLevel: true
            }
          }
        }
      },
      subject: true
    }
  });

  const subjectPerformance = teacherSubjects.map(ts => {
    const subjectGrades = grades.filter(g => g.subjectId === ts.subjectId);
    const average = subjectGrades.length > 0
      ? subjectGrades.reduce((sum, g) => sum + Number(g.marks), 0) / subjectGrades.length
      : 0;

    return {
      subject: ts.subject.name,
      average: Math.round(average * 100) / 100
    };
  });

  return NextResponse.json({
    subjects: teacherSubjects.length,
    classes: uniqueClasses.length,
    subjectPerformance
  });
}

async function getSchoolOverviewReport(dateFilter?: any) {
  // Total counts
  const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.classRoom.count({ where: { isActive: true } })
  ]);

  // Recent attendance stats
  const recentAttendances = await prisma.attendance.findMany({
    where: {
      ...(dateFilter && { date: dateFilter })
    },
    take: 1000 // Limit for performance
  });

  const attendanceRate = recentAttendances.length > 0
    ? (recentAttendances.filter(a => a.status === 'PRESENT').length / recentAttendances.length) * 100
    : 0;

  // Recent grades
  const recentGrades = await prisma.grade.findMany({
    where: {
      ...(dateFilter && { examDate: dateFilter })
    },
    take: 1000
  });

  const averageGrade = recentGrades.length > 0
    ? recentGrades.reduce((sum, g) => sum + Number(g.marks), 0) / recentGrades.length
    : 0;

  return NextResponse.json({
    totals: {
      students: totalStudents,
      teachers: totalTeachers,
      classes: totalClasses
    },
    recentStats: {
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      averageGrade: Math.round(averageGrade * 100) / 100,
      totalAttendanceRecords: recentAttendances.length,
      totalGradeRecords: recentGrades.length
    }
  });
}