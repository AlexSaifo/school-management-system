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

// POST /api/events/notify - Create event with notification
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and teachers can create events
    if (!['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      titleAr, 
      description, 
      descriptionAr, 
      eventDate, 
      eventTime, 
      location, 
      locationAr, 
      type, 
      targetRoles 
    } = body;

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        titleAr,
        description,
        descriptionAr,
        eventDate: new Date(eventDate),
        eventTime,
        location,
        locationAr,
        type: type || 'GENERAL',
        targetRoles: targetRoles || ['ALL'],
        createdById: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Create and broadcast notification
    const notification = notificationService.createEventNotification(
      event as any,
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

    console.log(`📅 Event notification sent to ${targetUsers.length} users: ${event.title}`);

    return NextResponse.json({
      success: true,
      event,
      notificationSent: true,
      targetUsers: targetUsers.length,
    });

  } catch (error) {
    console.error('Error creating event with notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}