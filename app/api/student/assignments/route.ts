import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { userId: decoded.userId },
      include: {
        user: true,
        classRoom: {
          include: {
            assignments: {
              where: {
                isActive: true,
                dueDate: {
                  gte: new Date()
                }
              },
              include: {
                subject: true,
                teacher: {
                  include: {
                    user: true
                  }
                }
              },
              orderBy: {
                dueDate: 'asc'
              },
              take: 10
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assignments: student.classRoom?.assignments || []
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
