import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get authorization token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    // Get all users except the current user for chat purposes
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: decoded.userId
        },
        status: 'ACTIVE',
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(role && { role: role.toUpperCase() as any })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        // Include role-specific info for better display
        admin: {
          select: {
            id: true
          }
        },
        teacher: {
          select: {
            id: true,
            department: true,
            employeeId: true
          }
        },
        student: {
          select: {
            id: true,
            studentId: true,
            classRoom: {
              select: {
                name: true,
                nameAr: true
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
            children: {
              select: {
                relationship: true,
                student: {
                  select: {
                    studentId: true,
                    classRoom: {
                      select: {
                        name: true,
                        nameAr: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}