import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';
import jwt from 'jsonwebtoken';

// Initialize notification service with Prisma client
const notificationService = new NotificationService(prisma);

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

// POST /api/assignments/notify - Create assignment with notification
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can create assignments
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      classRoomId, 
      subjectId, 
      dueDate, 
      totalMarks, 
      instructions, 
      attachments 
    } = body;

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        classRoomId,
        subjectId,
        teacherId: user.id,
        dueDate: new Date(dueDate),
        totalMarks,
        instructions,
        attachments,
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
    const notification = notificationService.createAssignmentNotification(
      assignment as any,
      user
    );

    // Get target users and broadcast
    const targetUsers = await notificationService.getTargetUsers(notification, prisma);
    
    if (global.socketNotifications) {
      global.socketNotifications.broadcastNotification(notification);
      
      // Update unread counts for target users
      targetUsers.forEach((userId: string) => {
        global.socketNotifications?.updateUnreadCount(userId, 1);
      });
    }

    console.log(`📝 Assignment notification sent to ${targetUsers.length} users: ${assignment.title}`);

    return NextResponse.json({
      success: true,
      assignment,
      notificationSent: true,
      targetUsers: targetUsers.length,
    });

  } catch (error) {
    console.error('Error creating assignment with notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/assignments/notify/submission - Handle assignment submission notification
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, submissionId } = body;

    if (!assignmentId || !submissionId) {
      return NextResponse.json({ error: 'Assignment ID and Submission ID required' }, { status: 400 });
    }

    // Get submission details
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
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

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Create and send notification to teacher
    const notification = notificationService.createAssignmentSubmissionNotification(
      submission as any,
      user
    );

    // Send notification to the assignment's teacher
    const teacherId = submission.assignment.teacherId;
    
    if (global.socketNotifications) {
      global.socketNotifications.sendNotificationToUser(teacherId, notification);
      global.socketNotifications.updateUnreadCount(teacherId, 1);
    }

    console.log(`📤 Assignment submission notification sent to teacher: ${submission.assignment.title}`);

    return NextResponse.json({
      success: true,
      notificationSent: true,
    });

  } catch (error) {
    console.error('Error sending assignment submission notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}