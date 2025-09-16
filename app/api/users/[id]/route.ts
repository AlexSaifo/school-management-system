import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { userData, roleData } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        admin: true,
        teacher: true,
        student: true,
        parent: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions: admin can edit anyone, others can only edit themselves
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (currentUser?.role !== 'ADMIN' && decoded.userId !== params.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Update base user
      const updatedUser = await tx.user.update({
        where: { id: params.id },
        data: userData,
      });

      // Update role-specific data if provided
      if (roleData) {
        switch (existingUser.role) {
          case 'ADMIN':
            if (existingUser.admin) {
              await tx.admin.update({
                where: { id: existingUser.admin.id },
                data: roleData,
              });
            }
            break;

          case 'TEACHER':
            if (existingUser.teacher) {
              await tx.teacher.update({
                where: { id: existingUser.teacher.id },
                data: roleData,
              });
            }
            break;

          case 'STUDENT':
            if (existingUser.student) {
              await tx.student.update({
                where: { id: existingUser.student.id },
                data: roleData,
              });
            }
            break;

          case 'PARENT':
            if (existingUser.parent) {
              await tx.parent.update({
                where: { id: existingUser.parent.id },
                data: roleData,
              });
            }
            break;
        }
      }

      return updatedUser;
    });

    // Remove password from response
    const { password, ...safeUser } = result;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow deleting yourself
    if (decoded.userId === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete user (cascade will handle role-specific records)
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
