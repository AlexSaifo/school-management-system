import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';
import { PrismaClient, EventType } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to map event type to display type
function getEventTypeColor(type: EventType): 'primary' | 'secondary' | 'success' | 'warning' | 'error' {
  switch (type) {
    case 'ACADEMIC':
      return 'primary';
    case 'SPORTS':
      return 'success';
    case 'CULTURAL':
      return 'secondary';
    case 'MEETING':
      return 'warning';
    case 'HOLIDAY':
      return 'error';
    case 'EXAM':
      return 'warning';
    case 'GENERAL':
    default:
      return 'primary';
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyTokenEdge(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user role from decoded token
    const userRole = decoded.role;

    // Build where clause - show recent events (last 10)
    const where: any = {};

    // If not admin, filter events by target roles
    if (userRole !== 'ADMIN') {
      where.OR = [
        // Events targeted to ALL
        { targetRoles: { has: 'ALL' } },
        // Events targeted to user's specific role
        { targetRoles: { has: userRole === 'STUDENT' ? 'STUDENTS' : userRole === 'PARENT' ? 'PARENTS' : userRole === 'TEACHER' ? 'TEACHERS' : userRole } },
      ];
    }

    // Fetch recent events from database
    const events = await prisma.event.findMany({
      where,
      orderBy: {
        createdAt: 'desc' // Most recent first
      },
      take: 10, // Get last 10 events
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Transform the data to match the frontend interface
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate.toISOString(),
      eventTime: event.eventTime,
      location: event.location,
      type: event.type,
      typeColor: getEventTypeColor(event.type),
      createdAt: event.createdAt.toISOString(),
      author: `${event.creator.firstName} ${event.creator.lastName}`,
    }));

    return NextResponse.json({
      events: formattedEvents,
      success: true
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}