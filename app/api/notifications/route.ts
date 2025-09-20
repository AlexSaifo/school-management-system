import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notification-service';
import { NotificationFilter, CreateNotificationRequest } from '@/types/notifications';
import jwt from 'jsonwebtoken';

// Declare global types for socket functions
declare global {
  var socketNotifications: {
    broadcastNotification: (notification: any) => void;
    sendNotificationToUser: (userId: string, notification: any) => void;
    updateUnreadCount: (userId: string, count: number) => void;
    userSockets: Map<string, any>;
    io: any;
  } | undefined;
}

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
      where: { id: decoded.userId },
      include: {
        student: true,
        teacher: true,
        parent: true,
        admin: true,
      }
    });

    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET /api/notifications - Get user's notifications with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type')?.split(',');
    const priority = searchParams.get('priority')?.split(',');
    const isRead = searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In a real implementation, you would have a notifications table
    // For now, we'll return an empty response structure
    const notifications: any[] = [];
    const total = 0;
    const unreadCount = 0;

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create and broadcast a new notification
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and teachers can create custom notifications
    if (!['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as CreateNotificationRequest;
    
    // Create notification
    const notification = notificationService.createCustomNotification(body, user);

    // Get target users
    const targetUsers = await notificationService.getTargetUsers(notification, prisma);

    // Broadcast notification if socket system is available
    if (global.socketNotifications) {
      global.socketNotifications.broadcastNotification(notification);
      
      // Update unread counts for target users
      targetUsers.forEach(userId => {
        // In a real implementation, you would query the actual unread count from database
        global.socketNotifications?.updateUnreadCount(userId, 1);
      });
    }

    return NextResponse.json({
      success: true,
      notification,
      targetUsers: targetUsers.length,
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.pathname.split('/').slice(-2, -1)[0];

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // In a real implementation, you would update the database
    // For now, we'll just broadcast the read status via socket
    if (global.socketNotifications) {
      global.socketNotifications.io.emit('notification-read', {
        notificationId,
        readBy: user.id,
        readAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}