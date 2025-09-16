import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = req.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'PARENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get parent and their children
    const parent = await prisma.parent.findUnique({
      where: { userId: decoded.userId },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: true,
                classRoom: true
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      children: parent.children.map((child: any) => ({
        ...child.student,
        relationship: child.relationship // Use relationship from junction table
      }))
    });

  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
