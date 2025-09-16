import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

// Validation schema for announcement update
const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  targetRoles: z.array(z.enum(['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS'])).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
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

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

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
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAnnouncementSchema.parse(body);

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

    // Find the announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check permissions: only admin can update
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.targetRoles !== undefined) {
      updateData.targetRoles = (validatedData.targetRoles && validatedData.targetRoles.length > 0) ? validatedData.targetRoles : ['ALL'];
    }
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null;
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
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
          id: updatedAnnouncement.id,
          title: updatedAnnouncement.title,
          content: updatedAnnouncement.content,
          targetRoles: updatedAnnouncement.targetRoles || [],
          priority: updatedAnnouncement.priority,
          isActive: updatedAnnouncement.isActive,
          expiresAt: updatedAnnouncement.expiresAt,
          createdBy: {
            name: `${updatedAnnouncement.creator.firstName} ${updatedAnnouncement.creator.lastName}`,
            role: updatedAnnouncement.creator.role,
          },
          createdAt: updatedAnnouncement.createdAt,
          updatedAt: updatedAnnouncement.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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

    // Find the announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check permissions: only admin can delete
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await prisma.announcement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}