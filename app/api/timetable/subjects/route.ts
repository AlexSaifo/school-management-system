import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/timetable/subjects - Get all subjects
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

    // Only admins and teachers can access subject information for timetables
    if (decoded.role !== 'ADMIN' && decoded.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const gradeLevel = searchParams.get('gradeLevel');

    if (gradeLevel) {
      // Get subjects for specific grade level
      const grade = await prisma.gradeLevel.findFirst({
        where: { level: parseInt(gradeLevel) }
      });

      if (!grade) {
        return NextResponse.json({ error: 'Grade level not found' }, { status: 404 });
      }

      const subjects = await prisma.subject.findMany({
        where: {
          gradeSubjects: {
            some: {
              gradeLevelId: grade.id
            }
          }
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
          code: true,
          color: true,
          description: true,
          gradeSubjects: {
            where: {
              gradeLevelId: grade.id
            },
            select: {
              weeklyHours: true,
              isRequired: true
            }
          },
          teacherSubjects: {
            select: {
              teacher: {
                select: {
                  id: true,
                  employeeId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: subjects.map((subject: any) => ({
          ...subject,
          weeklyHours: subject.gradeSubjects[0]?.weeklyHours || 0,
          isRequired: subject.gradeSubjects[0]?.isRequired || false,
          teachers: subject.teacherSubjects.map((ts: any) => ({
            id: ts.teacher.id,
            employeeId: ts.teacher.employeeId,
            name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`
          }))
        }))
      });
    } else {
      // Get all subjects
      const subjects = await prisma.subject.findMany({
        select: {
          id: true,
          name: true,
          nameAr: true,
          code: true,
          color: true,
          description: true,
          isActive: true,
          teacherSubjects: {
            select: {
              teacher: {
                select: {
                  id: true,
                  employeeId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          }
        },
        where: {
          isActive: true
        }
      });

      return NextResponse.json({
        success: true,
        data: subjects.map((subject: any) => ({
          ...subject,
          teachers: subject.teacherSubjects.map((ts: any) => ({
            id: ts.teacher.id,
            employeeId: ts.teacher.employeeId,
            name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`
          }))
        }))
      });
    }
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST /api/timetable/subjects - Create new subject
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameAr, code, description, color } = body;

    if (!name || !nameAr || !code) {
      return NextResponse.json(
        { success: false, error: 'Name, Arabic name, and code are required' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        nameAr,
        code,
        description,
        color,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}
