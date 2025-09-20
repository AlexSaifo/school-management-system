import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/students - Get students by classroom or all students
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                 request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const classRoomId = searchParams.get('classRoomId');

    let whereClause: any = {};
    
    if (classRoomId) {
      whereClause.classRoomId = classRoomId;
    }

    // Role-based access control
    if (user.role === 'STUDENT') {
      // Students can only see themselves
      whereClause.userId = user.id;
    } else if (user.role === 'PARENT') {
      // Parents can only see their children
      const parentRecord = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: { children: true }
      });
      
      if (parentRecord) {
        whereClause.id = {
          in: parentRecord.children.map(child => child.id)
        };
      } else {
        whereClause.id = 'no-access'; // No children found
      }
    }
    // TEACHER and ADMIN can see students based on filters

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        classRoom: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        }
      },
      orderBy: [
        { rollNumber: 'asc' },
        { user: { firstName: 'asc' } }
      ]
    });

    return NextResponse.json({ 
      students,
      count: students.length 
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}