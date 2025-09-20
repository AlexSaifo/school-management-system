import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
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

    const { chatId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

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

    // Get messages for this chat
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: {
          chatId
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
          },
          readReceipts: {
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.message.count({
        where: {
          chatId
        }
      })
    ]);

    // Mark messages as read
    await prisma.messageReadReceipt.createMany({
      data: messages
        .filter(msg => msg.senderId !== decoded.userId)
        .map(msg => ({
          messageId: msg.id,
          userId: decoded.userId
        })),
      skipDuplicates: true
    });

    // Update last read timestamp for user in this chat
    await prisma.chatParticipant.updateMany({
      where: {
        chatId,
        userId: decoded.userId
      },
      data: {
        lastReadAt: new Date()
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}