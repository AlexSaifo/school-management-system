import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header first, then cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only parents and admins can access this endpoint
    if (decoded.role !== 'PARENT' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get the parent
    const parent = await prisma.parent.findUnique({
      where: { userId: decoded.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 });
    }

    // Get parent's children
    let children;

    if (childId) {
      // Get specific child
      const childResult = await prisma.studentParent.findFirst({
        where: {
          parentId: parent.id,
          studentId: childId,
        },
        select: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              classRoom: {
                select: {
                  name: true,
                  nameAr: true,
                  gradeLevel: {
                    select: {
                      name: true,
                      nameAr: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!childResult?.student) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }

      children = [childResult.student];
    } else {
      // Get all children
      const childrenResult = await prisma.studentParent.findMany({
        where: { parentId: parent.id },
        select: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              classRoom: {
                select: {
                  name: true,
                  nameAr: true,
                  gradeLevel: {
                    select: {
                      name: true,
                      nameAr: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      children = childrenResult.map(cr => cr.student).filter(Boolean);
    }

    // Get attendance data for each child
    const childrenWithAttendance = await Promise.all(
      children.map(async (child) => {
        if (!child) return null;

        // Build attendance query
        let attendanceWhere: any = {
          studentId: child.id,
        };

        // Add date filters if provided
        if (startDate) {
          attendanceWhere.date = {
            ...attendanceWhere.date,
            gte: new Date(startDate),
          };
        }

        if (endDate) {
          attendanceWhere.date = {
            ...attendanceWhere.date,
            lte: new Date(endDate),
          };
        }

        // Get attendance records
        const attendanceRecords = await prisma.attendance.findMany({
          where: attendanceWhere,
          include: {
            teacher: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            timetable: {
              select: {
                subject: {
                  select: {
                    name: true,
                    nameAr: true,
                  },
                },
              },
            },
          },
          orderBy: { date: 'desc' },
        });

        // Calculate attendance statistics
        const totalRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
        const excusedCount = attendanceRecords.filter(r => r.status === 'EXCUSED').length;

        const attendanceRate = totalRecords > 0
          ? ((presentCount + excusedCount) / totalRecords * 100).toFixed(1)
          : '0.0';

        return {
          id: child.id,
          studentId: child.studentId,
          firstName: child.user.firstName,
          lastName: child.user.lastName,
          classRoom: child.classRoom,
          attendance: {
            records: attendanceRecords.map(record => ({
              id: record.id,
              date: record.date.toISOString().split('T')[0],
              status: record.status,
              remarks: record.remarks,
              subject: record.timetable?.subject,
              teacher: record.teacher?.user,
            })),
            statistics: {
              total: totalRecords,
              present: presentCount,
              absent: absentCount,
              late: lateCount,
              excused: excusedCount,
              attendanceRate: `${attendanceRate}%`,
            },
          },
        };
      })
    );

    return NextResponse.json({
      children: childrenWithAttendance.filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching parent attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}