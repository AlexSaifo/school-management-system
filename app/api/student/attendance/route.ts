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

    // Get student attendance
    const student = await prisma.student.findUnique({
      where: { userId: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: student.id
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        classRoom: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 100 // Limit to last 100 records
    });

    return NextResponse.json({
      success: true,
      attendance: attendance
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
