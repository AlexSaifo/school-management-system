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

// POST /api/announcements/notify - Create announcement with notification
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create announcements
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, targetRoles, priority, expiresAt } = body;

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetRoles: targetRoles || ['ALL'],
        priority: priority || 'NORMAL',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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
    const notification = notificationService.createAnnouncementNotification(
      announcement as any,
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

    console.log(`📢 Announcement notification sent to ${targetUsers.length} users: ${announcement.title}`);

    return NextResponse.json({
      success: true,
      announcement,
      notificationSent: true,
      targetUsers: targetUsers.length,
    });

  } catch (error) {
    console.error('Error creating announcement with notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}