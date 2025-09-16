import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    // Fetch real statistics from database
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalParents,
      totalAdmins,
      activeClasses,
      totalAssignments,
      pendingAssignments,
      upcomingExams,
      totalSubjects,
      attendanceToday,
      recentEnrollments
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Students count
      prisma.student.count(),
      
      // Teachers count
      prisma.teacher.count(),
      
      // Parents count
      prisma.parent.count(),
      
      // Admins count
      prisma.admin.count(),
      
      // Active classes count
      prisma.classRoom.count({
        where: { isActive: true }
      }),
      
      // Total assignments
      prisma.assignment.count(),
      
      // Pending assignments (due in next 7 days)
      prisma.assignment.count({
        where: {
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Upcoming exams (next 30 days)
      prisma.exam.count({
        where: {
          examDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total subjects
      prisma.subject.count(),
      
      // Today's attendance records
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Recent enrollments (this month)
      prisma.student.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    // Calculate attendance rate for today
    const totalStudentsForAttendance = totalStudents > 0 ? totalStudents : 1;
    const attendanceRate = ((attendanceToday / totalStudentsForAttendance) * 100).toFixed(1);

    const stats = {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalParents,
      totalAdmins,
      activeClasses,
      totalAssignments,
      pendingAssignments,
      upcomingExams,
      totalSubjects,
      attendanceToday,
      attendanceRate: parseFloat(attendanceRate),
      recentEnrollments,
      academicYear: "2024-2025" // You can make this dynamic based on your needs
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
