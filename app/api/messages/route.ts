import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    // Get authorization token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, content, messageType = 'TEXT', replyToId, attachments = [] } = body;

    // Validate required fields
    if (!chatId || (!content && attachments.length === 0)) {
      return NextResponse.json({ 
        error: 'Chat ID and content or attachments are required' 
      }, { status: 400 });
    }

    // Verify user is participant in this chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: decoded.userId,
        isActive: true
      }
    });

    if (!chatParticipant) {
      return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: decoded.userId,
        content,
        messageType,
        replyToId,
        attachments: {
          create: attachments.map((att: any) => ({
            fileName: att.fileName,
            originalName: att.originalName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            fileUrl: att.fileUrl,
            thumbnailUrl: att.thumbnailUrl,
            duration: att.duration
          }))
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true
          }
        },
        attachments: true,
        replyTo: {
          include: {
            sender: {
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

    // Create notification for chat message
    try {
      // Get chat details and participants
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          name: true,
          isGroup: true,
          participants: {
            where: { isActive: true },
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (chat) {
        // Get sender details
        const sender = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (sender) {
          // Create notification for each participant except the sender
          const targetUsers = chat.participants
            .filter(p => p.userId !== decoded.userId)
            .map(p => p.userId);

          if (targetUsers.length > 0) {
            const chatNotification = notificationService.createChatMessageNotification(
              {
                chatId,
                messageId: message.id,
                senderId: sender.id,
                senderName: `${sender.firstName} ${sender.lastName}`,
                chatType: chat.isGroup ? 'GROUP' : 'DIRECT',
                chatName: chat.name || undefined,
                messagePreview: content || `${messageType.toLowerCase()} message`
              },
              sender
            );

            // Set target users
            chatNotification.targetUsers = targetUsers;

            // Broadcast notification
            if (global.socketNotifications) {
              global.socketNotifications.broadcastNotification(chatNotification);
              
              // Update unread counts for target users
              targetUsers.forEach(userId => {
                global.socketNotifications?.updateUnreadCount(userId, 1);
              });
            }

          }
        }
      }
    } catch (notificationError) {
      console.error('Error creating chat notification:', notificationError);
      // Don't fail the message sending if notification fails
    }

    // Update chat's last message info
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: content || `${messageType.toLowerCase()} message`,
        lastMessageAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Message sent successfully', 
      data: message 
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}