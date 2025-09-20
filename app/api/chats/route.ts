import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Get user's chats
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: decoded.userId,
            isActive: true
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            }
          },
          where: {
            isActive: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
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
        _count: {
          select: {
            messages: {
              where: {
                AND: [
                  {
                    senderId: {
                      not: decoded.userId
                    }
                  },
                  {
                    readReceipts: {
                      none: {
                        userId: decoded.userId
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ chats });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { participantIds, name, isGroup = false } = body;

    // Validate required fields
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ 
        error: 'Participant IDs are required' 
      }, { status: 400 });
    }

    // For direct chats, check if chat already exists between these two users
    if (!isGroup && participantIds.length === 1) {
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: {
                in: [decoded.userId, participantIds[0]]
              }
            }
          }
        }
      });

      if (existingChat) {
        return NextResponse.json({ 
          message: 'Chat already exists',
          chat: existingChat 
        });
      }
    }

    // Create new chat
    const chat = await prisma.chat.create({
      data: {
        name: isGroup ? name : null,
        isGroup,
        createdBy: decoded.userId,
        participants: {
          create: [
            // Add creator as participant
            {
              userId: decoded.userId
            },
            // Add other participants
            ...participantIds.map((userId: string) => ({
              userId
            }))
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Chat created successfully', 
      chat 
    });

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}