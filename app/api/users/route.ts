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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { admin: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = role ? { role: role as any } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          admin: true,
          teacher: true,
          student: {
            include: { classRoom: true },
          },
          parent: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }: any) => user);

    return NextResponse.json({
      users: safeUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { admin: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userData, roleData } = body;

    const result = await prisma.$transaction(async (tx: any) => {
      // Create base user
      const newUser = await tx.user.create({
        data: userData,
      });

      // Create role-specific record
      switch (newUser.role) {
        case 'ADMIN':
          await tx.admin.create({
            data: {
              userId: newUser.id,
              permissions: roleData?.permissions || {},
            },
          });
          break;

        case 'TEACHER':
          await tx.teacher.create({
            data: {
              userId: newUser.id,
              ...roleData,
            },
          });
          break;

        case 'STUDENT':
          await tx.student.create({
            data: {
              userId: newUser.id,
              ...roleData,
            },
          });
          break;

        case 'PARENT':
          await tx.parent.create({
            data: {
              userId: newUser.id,
              ...roleData,
            },
          });
          break;
      }

      return newUser;
    });

    // Remove password from response
    const { password, ...safeUser } = result;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
