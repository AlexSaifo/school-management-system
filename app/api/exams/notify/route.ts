import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notification-service';
import jwt from 'jsonwebtoken';

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// POST /api/exams/notify - Create exam with notification
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers and admins can create exams
    if (!['TEACHER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      classRoomId, 
      subjectId, 
      teacherId,
      examDate, 
      duration, 
      totalMarks, 
      instructions 
    } = body;

    // Use current user as teacher if not specified
    const finalTeacherId = teacherId || (user.role === 'TEACHER' ? user.id : undefined);

    if (!finalTeacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 });
    }

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        classRoomId,
        subjectId,
        teacherId: finalTeacherId,
        examDate: new Date(examDate),
        duration,
        totalMarks,
        instructions,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        },
        classRoom: {
          select: {
            id: true,
            name: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        }
      }
    });

    // Create and broadcast notification
    const notification = notificationService.createExamNotification(
      exam as any,
      user
    );

    // Get target users and broadcast
    const targetUsers = await notificationService.getTargetUsers(notification, prisma);
    
    if (global.socketNotifications) {
      global.socketNotifications.broadcastNotification(notification);
      
      // Update unread counts for target users
      targetUsers.forEach(userId => {
        global.socketNotifications?.updateUnreadCount(userId, 1);
      });
    }

    console.log(`📊 Exam notification sent to ${targetUsers.length} users: ${exam.title}`);

    return NextResponse.json({
      success: true,
      exam,
      notificationSent: true,
      targetUsers: targetUsers.length,
    });

  } catch (error) {
    console.error('Error creating exam with notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/exams/notify/results - Handle grade published notification
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can publish grades
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { examResultId } = body;

    if (!examResultId) {
      return NextResponse.json({ error: 'Exam result ID required' }, { status: 400 });
    }

    // Get exam result details
    const examResult = await prisma.examResult.findUnique({
      where: { id: examResultId },
      include: {
        exam: {
          include: {
            classRoom: {
              select: {
                id: true,
                name: true
              }
            },
            subject: {
              select: {
                name: true
              }
            }
          }
        },
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!examResult) {
      return NextResponse.json({ error: 'Exam result not found' }, { status: 404 });
    }

    // Create grade published notification
    const gradeData = {
      studentId: examResult.student.userId,
      studentName: `${examResult.student.user.firstName} ${examResult.student.user.lastName}`,
      examId: examResult.examId,
      title: examResult.exam.title,
      marksObtained: Number(examResult.marksObtained),
      totalMarks: Number(examResult.exam.totalMarks),
      grade: examResult.grade || undefined,
      classRoomId: examResult.exam.classRoomId,
      className: examResult.exam.classRoom.name,
      subjectName: examResult.exam.subject.name,
    };

    const notification = notificationService.createGradePublishedNotification(
      gradeData,
      user
    );

    // Send notification to student and their parents
    const targetUsers = await notificationService.getTargetUsers(notification, prisma);
    
    if (global.socketNotifications) {
      targetUsers.forEach(userId => {
        global.socketNotifications?.sendNotificationToUser(userId, notification);
        global.socketNotifications?.updateUnreadCount(userId, 1);
      });
    }

    console.log(`📋 Grade published notification sent to ${targetUsers.length} users: ${examResult.exam.title}`);

    return NextResponse.json({
      success: true,
      notificationSent: true,
      targetUsers: targetUsers.length,
    });

  } catch (error) {
    console.error('Error sending grade published notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}