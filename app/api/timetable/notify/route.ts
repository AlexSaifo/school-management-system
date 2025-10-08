import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';
import { NotificationType } from '@/types/notifications';
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

// POST /api/timetable/notify - Send timetable update notification
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and teachers can send timetable notifications
    if (!['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      classRoomIds,
      updateType,
      affectedDate,
      affectedTimeSlot,
      oldValue,
      newValue,
      message,
      messageAr
    } = body;

    if (!classRoomIds || !Array.isArray(classRoomIds) || classRoomIds.length === 0) {
      return NextResponse.json({ error: 'Class room IDs required' }, { status: 400 });
    }

    const validUpdateTypes = ['SCHEDULE_CHANGE', 'NEW_SCHEDULE', 'TEACHER_CHANGE', 'LOCATION_CHANGE'];
    if (!validUpdateTypes.includes(updateType)) {
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    // Get classroom details
    const classRooms = await prisma.classRoom.findMany({
      where: {
        id: { in: classRoomIds }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (classRooms.length === 0) {
      return NextResponse.json({ error: 'No valid classrooms found' }, { status: 404 });
    }

    let totalTargetUsers = 0;

    // Send notification for each classroom
    for (const classRoom of classRooms) {
      const notification = notificationService.createTimetableUpdateNotification(
        classRoom,
        updateType as any,
        user,
        {
          affectedDate,
          affectedTimeSlot,
          oldValue,
          newValue
        }
      );

      // Override message if provided
      if (message) {
        notification.message = message;
      }
      if (messageAr) {
        notification.messageAr = messageAr;
      }

      // Get target users for this classroom
      const targetUsers = await notificationService.getTargetUsers(notification, prisma);
      totalTargetUsers += targetUsers.length;

      if (global.socketNotifications) {
        global.socketNotifications.broadcastNotification(notification);
        
        // Update unread counts for target users
        targetUsers.forEach((userId: string) => {
          global.socketNotifications?.updateUnreadCount(userId, 1);
        });
      }
    }

    console.log(`📅 Timetable update notification sent to ${totalTargetUsers} users for ${classRooms.length} classrooms`);

    return NextResponse.json({
      success: true,
      notificationSent: true,
      affectedClassrooms: classRooms.length,
      totalTargetUsers,
    });

  } catch (error) {
    console.error('Error sending timetable update notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/timetable/notify/bulk - Send bulk timetable update for multiple changes
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can send bulk timetable notifications
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title,
      titleAr,
      message,
      messageAr,
      targetRoles,
      targetClassRoomIds,
      priority 
    } = body;

    // Create a custom notification for bulk timetable updates
    const notification = notificationService.createCustomNotification({
      type: NotificationType.TIMETABLE_UPDATE,
      title: title || 'Timetable Updates',
      titleAr: titleAr || 'تحديثات الجدول الدراسي',
      message: message || 'The school timetable has been updated. Please check for changes.',
      messageAr: messageAr || 'تم تحديث الجدول الدراسي. يرجى التحقق من التغييرات.',
      priority: priority || 'NORMAL',
      targetRoles: targetRoles || ['STUDENTS', 'PARENTS', 'TEACHERS'],
      targetClasses: targetClassRoomIds,
      metadata: {
        updateType: 'BULK_UPDATE',
        affectedClassrooms: targetClassRoomIds?.length || 0,
      }
    }, user);

    // Get target users and broadcast
    const targetUsers = await notificationService.getTargetUsers(notification, prisma);
    
    if (global.socketNotifications) {
      global.socketNotifications.broadcastNotification(notification);
      
      // Update unread counts for target users
      targetUsers.forEach((userId: string) => {
        global.socketNotifications?.updateUnreadCount(userId, 1);
      });
    }

    console.log(`📅 Bulk timetable update notification sent to ${targetUsers.length} users`);

    return NextResponse.json({
      success: true,
      notificationSent: true,
      targetUsers: targetUsers.length,
    });

  } catch (error) {
    console.error('Error sending bulk timetable update notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}