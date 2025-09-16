import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/timetable/teachers - Get all teachers with their subjects
export async function GET(request: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins and teachers can access teacher timetable information
    if (decoded.role !== 'ADMIN' && decoded.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    let whereClause: any = {};

    if (subjectId) {
      whereClause = {
        teacherSubjects: {
          some: {
            subjectId: subjectId
          }
        }
      };
    }

    const teachers = await prisma.teacher.findMany({
      where: whereClause,
      select: {
        id: true,
        employeeId: true,
        department: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teacherSubjects: {
          select: {
            subject: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                code: true,
                color: true
              }
            },
            isPrimary: true
          }
        }
      },
      orderBy: [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } }
      ]
    });

    return NextResponse.json({
      success: true,
      data: teachers.map((teacher: any) => ({
        id: teacher.id,
        employeeId: teacher.employeeId,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        department: teacher.department,
        subjects: teacher.teacherSubjects.map((ts: any) => ({
          ...ts.subject,
          isPrimary: ts.isPrimary
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}
