import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';
import { PrismaClient, Priority } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to map priority to announcement type
function getAnnouncementType(priority: Priority): 'info' | 'warning' | 'success' | 'error' {
  switch (priority) {
    case 'HIGH':
      return 'error';
    case 'URGENT':
      return 'error';
    case 'NORMAL':
      return 'info';
    case 'LOW':
      return 'success';
    default:
      return 'info';
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

    // Build where clause based on user role
    const where: any = {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    // If not admin, filter announcements by target roles
    if (userRole !== 'ADMIN') {
      where.OR = [
        // Announcements targeted to ALL
        { targetRoles: { has: 'ALL' } },
        // Announcements targeted to user's specific role
        { targetRoles: { has: userRole === 'STUDENT' ? 'STUDENTS' : userRole === 'PARENT' ? 'PARENTS' : userRole === 'TEACHER' ? 'TEACHERS' : userRole } },
      ];
    }

    // Fetch real announcements from database
    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 10, // Get latest 10 announcements
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
    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: getAnnouncementType(announcement.priority),
      createdAt: announcement.createdAt.toISOString(),
      author: `${announcement.creator.firstName} ${announcement.creator.lastName}`,
      priority: announcement.priority.toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
    }));

    return NextResponse.json({
      announcements: formattedAnnouncements,
      success: true
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
