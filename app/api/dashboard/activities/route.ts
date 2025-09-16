import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if prisma client is properly initialized
    if (!prisma || typeof prisma.assignment?.findMany !== 'function') {
      console.error('Prisma client is not properly initialized');
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch recent activities with safe error handling
    const [
      recentAssignments,
      upcomingExams,
      recentEvents,
      lowAttendanceClasses
    ] = await Promise.all([
      // Recent assignments (last 7 days)
      (async () => {
        try {
          if (prisma.assignment && typeof prisma.assignment.findMany === 'function') {
            return await prisma.assignment.findMany({
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                subject: { select: { name: true } },
                classRoom: { select: { name: true } } // Updated from class to classRoom
              },
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            });
          }
          return [];
        } catch (error) {
          console.error('Error fetching assignments:', error);
          return [];
        }
      })(),
      
      // Upcoming exams (next 14 days)
      (async () => {
        try {
          if (prisma.exam && typeof prisma.exam.findMany === 'function') {
            return await prisma.exam.findMany({
              take: 5,
              orderBy: { examDate: 'asc' },
              include: {
                subject: { select: { name: true } },
                classRoom: { select: { name: true } } // Updated from class to classRoom
              },
              where: {
                examDate: {
                  gte: new Date(),
                  lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                }
              }
            });
          }
          return [];
        } catch (error) {
          console.error('Error fetching exams:', error);
          return [];
        }
      })(),
      
      // Recent events
      (async () => {
        try {
          if (prisma.event && typeof prisma.event.findMany === 'function') {
            return await prisma.event.findMany({
              take: 3,
              orderBy: { createdAt: 'desc' },
              where: {
                eventDate: {
                  gte: new Date()
                }
              }
            });
          }
          return [];
        } catch (error) {
          console.error('Error fetching events:', error);
          return [];
        }
      })(),
      
      // Classes with low attendance (less than 70% this week)
      (async () => {
        try {
          // First check if the classRoom model exists
          if (prisma.classRoom && typeof prisma.classRoom.findMany === 'function') {
            return await prisma.classRoom.findMany({
              take: 3,
              include: {
                _count: {
                  select: {
                    students: true,
                    attendances: {
                      where: {
                        date: {
                          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                      }
                    }
                  }
                }
              }
            });
          }
          console.log('ClassRoom model or findMany method not available');
          return []; // Return empty array if model doesn't exist
        } catch (error) {
          console.error('Error fetching classroom attendance:', error);
          return []; // Return empty array on error
        }
      })()
    ]);

    // Process low attendance classes
    const processedLowAttendanceClasses = Array.isArray(lowAttendanceClasses) 
      ? lowAttendanceClasses
          .map((cls: any) => {
            try {
              if (!cls || !cls._count) return null;
              
              const totalStudents = cls._count.students || 0;
              const attendanceCount = cls._count.attendances || 0;
              const attendanceRate = totalStudents > 0 ? (attendanceCount / (totalStudents * 7)) * 100 : 0;
              
              return {
                id: cls.id || 'unknown',
                name: cls.name || 'Unknown Class',
                attendanceRate: Math.round(attendanceRate),
                totalStudents
              };
            } catch (err) {
              console.error('Error processing classroom data:', err);
              return null;
            }
          })
          .filter((cls: any) => cls && cls.attendanceRate < 70)
          .sort((a: any, b: any) => a.attendanceRate - b.attendanceRate)
      : [];

    const activities = {
      recentAssignments: Array.isArray(recentAssignments) 
        ? recentAssignments.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            subject: assignment.subject?.name || 'Unknown Subject',
            class: assignment.classRoom?.name || 'Unknown Class', // Updated from class to classRoom
            dueDate: assignment.dueDate,
            createdAt: assignment.createdAt
          }))
        : [],
      upcomingExams: Array.isArray(upcomingExams)
        ? upcomingExams.map((exam: any) => ({
            id: exam.id,
            title: exam.title,
            subject: exam.subject?.name || 'Unknown Subject',
            class: exam.classRoom?.name || 'Unknown Class', // Updated from class to classRoom
            examDate: exam.examDate,
            duration: exam.duration
          }))
        : [],
      recentEvents: Array.isArray(recentEvents)
        ? recentEvents.map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: event.eventDate,
            location: event.location
          }))
        : [],
      lowAttendanceClasses: Array.isArray(lowAttendanceClasses) 
        ? processedLowAttendanceClasses 
        : []
    };

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    // Return empty data structure instead of error to prevent UI from breaking
    return NextResponse.json({ 
      activities: {
        recentAssignments: [],
        upcomingExams: [],
        recentEvents: [],
        lowAttendanceClasses: []
      },
      error: 'Database connection error. Please check that the database server is running.'
    });
  }
}
