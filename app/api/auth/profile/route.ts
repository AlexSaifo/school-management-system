import { NextRequest, NextResponse } from 'next/server';
import { handleApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Use the unified authentication handler
    const authResult = await handleApiAuth(request);
    
    if (!authResult.success) {
      return authResult.response!;
    }

    const { userId } = authResult.auth!;

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true,
        teacher: true,
        student: {
          include: {
            classRoom: {
              include: {
                gradeLevel: true,
              },
            },
            parents: {
              include: {
                parent: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        parent: {
          include: {
            children: {
              include: {
                student: {
                  include: {
                    user: true,
                    classRoom: {
                      include: {
                        gradeLevel: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is still active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
