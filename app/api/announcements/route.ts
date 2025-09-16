import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

// Validation schema for announcement creation
const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  targetRoles: z.array(z.enum(['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS'])).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  expiresAt: z.string().optional(),
});

// Validation schema for bulk operations
const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete']),
  announcementIds: z.array(z.string()).min(1, 'At least one announcement ID is required'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filter parameters
    const priority = searchParams.get('priority');
    const isActive = searchParams.get('isActive');
    const targetRole = searchParams.get('targetRole');
    const search = searchParams.get('search') || '';
    const userRole = searchParams.get('userRole'); // For filtering based on user role

    // Build where clause
    const where: any = {};

    if (priority) {
      where.priority = priority;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // TODO: Update targetRole filtering after Prisma client regeneration
    // if (targetRole) {
    //   where.targetRoles = {
    //     has: targetRole
    //   };
    // }

    // Filter announcements based on user role (for non-admin users)
    if (userRole && userRole !== 'ADMIN') {
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
            return null;
        }
      };

      const userTargetRole = getTargetRoleForUser(userRole);

      where.OR = [
        // Announcements targeted to ALL
        { targetRoles: { has: 'ALL' } },
        // Announcements targeted to user's specific role
        ...(userTargetRole ? [{ targetRoles: { has: userTargetRole } }] : []),
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.announcement.count({ where });

    // Get announcements with creator info
    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform data for frontend
    const transformedAnnouncements = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      targetRoles: announcement.targetRoles || [],
      priority: announcement.priority,
      isActive: announcement.isActive,
      expiresAt: announcement.expiresAt,
      createdBy: {
        name: `${announcement.creator.firstName} ${announcement.creator.lastName}`,
        role: announcement.creator.role,
      },
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        announcements: transformedAnnouncements,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createAnnouncementSchema.parse(body);

    // Find the creator user
    const creator = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Only admins can create announcements
    if (creator.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        targetRoles: (validatedData.targetRoles && validatedData.targetRoles.length > 0) ? validatedData.targetRoles : ['ALL'],
        priority: validatedData.priority,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        createdById: creator.id,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        announcement: {
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          targetRoles: announcement.targetRoles || [],
          priority: announcement.priority,
          isActive: announcement.isActive,
          expiresAt: announcement.expiresAt,
          createdBy: {
            name: `${announcement.creator.firstName} ${announcement.creator.lastName}`,
            role: announcement.creator.role,
          },
          createdAt: announcement.createdAt,
          updatedAt: announcement.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { announcementIds, action } = body;

    if (!announcementIds || !Array.isArray(announcementIds)) {
      return NextResponse.json(
        { success: false, error: 'Announcement IDs are required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Only admins can perform bulk actions
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'activate':
        updateData.isActive = true;
        break;
      case 'deactivate':
        updateData.isActive = false;
        break;
      case 'delete':
        // Delete announcements
        await prisma.announcement.deleteMany({
          where: {
            id: { in: announcementIds },
          },
        });
        return NextResponse.json({
          success: true,
          message: 'Announcements deleted successfully',
        });
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update announcements
    await prisma.announcement.updateMany({
      where: {
        id: { in: announcementIds },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Announcements ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error updating announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update announcements' },
      { status: 500 }
    );
  }
}