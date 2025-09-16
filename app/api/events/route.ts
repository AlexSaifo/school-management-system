import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Map user roles to target roles
    const getTargetRoleForUser = (userRole: string) => {
      switch (userRole) {
        case 'STUDENT':
          return 'STUDENTS';
        case 'TEACHER':
          return 'TEACHERS';
        case 'PARENT':
          return 'PARENTS';
        default:
          return null; // Admin doesn't need target role mapping
      }
    };

    const userTargetRole = getTargetRoleForUser(decoded.role);

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take: limit,
        where: {
          AND: [
            // Search condition (if provided)
            ...(searchParams.get('search') ? [{
              OR: [
                { title: { contains: searchParams.get('search')!, mode: 'insensitive' } },
                { description: { contains: searchParams.get('search')!, mode: 'insensitive' } },
                { location: { contains: searchParams.get('search')!, mode: 'insensitive' } },
                { titleAr: { contains: searchParams.get('search')!, mode: 'insensitive' } } as any,
                { descriptionAr: { contains: searchParams.get('search')!, mode: 'insensitive' } } as any,
                { locationAr: { contains: searchParams.get('search')!, mode: 'insensitive' } } as any,
              ],
            }] : []),
            
            // Type filter (if provided)
            ...(searchParams.get('type') ? [{ type: searchParams.get('type') as any }] : []),
            
            // Role-based filtering: Admin sees all, others see targeted events
            ...(decoded.role === 'ADMIN' ? [] : [{
              OR: [
                // Events targeted to ALL
                { targetRoles: { has: 'ALL' } } as any,
                // Events targeted to user's specific role
                ...(userTargetRole ? [{ targetRoles: { has: userTargetRole } } as any] : []),
              ],
            }]),
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { eventDate: 'asc' },
      }),
      prisma.event.count({
        where: {
          AND: [
            // Search condition (if provided)
            ...(searchParams.get('search') ? [{
              OR: [
                { title: { contains: searchParams.get('search')!, mode: 'insensitive' } },
                { description: { contains: searchParams.get('search')!, mode: 'insensitive' } },
                { location: { contains: searchParams.get('search')!, mode: 'insensitive' } },
                { titleAr: { contains: searchParams.get('search')!, mode: 'insensitive' } } as any,
                { descriptionAr: { contains: searchParams.get('search')!, mode: 'insensitive' } } as any,
                { locationAr: { contains: searchParams.get('search')!, mode: 'insensitive' } } as any,
              ],
            }] : []),
            
            // Type filter (if provided)
            ...(searchParams.get('type') ? [{ type: searchParams.get('type') as any }] : []),
            
            // Role-based filtering: Admin sees all, others see targeted events
            ...(decoded.role === 'ADMIN' ? [] : [{
              OR: [
                // Events targeted to ALL
                { targetRoles: { has: 'ALL' } } as any,
                // Events targeted to user's specific role
                ...(userTargetRole ? [{ targetRoles: { has: userTargetRole } } as any] : []),
              ],
            }]),
          ],
        },
      }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin only
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    const event = await prisma.event.create({
      data: {
        ...body,
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
        targetRoles: (body.targetRoles && body.targetRoles.length > 0) ? body.targetRoles : ['ALL'],
        createdById: decoded.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
