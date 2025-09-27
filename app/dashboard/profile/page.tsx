import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import ProfileClient from './ProfileClient';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUserProfile() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      redirect('/');
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      redirect('/');
    }

    const { userId } = decoded;

    // Get user data from database (same as API route)
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
      redirect('/');
    }

    // Check if user is still active
    if (user.status !== 'ACTIVE') {
      redirect('/');
    }

    // Remove password from response and convert dates to strings
    const userWithoutPassword = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return userWithoutPassword;
  } catch (error) {
    console.error('Error fetching profile:', error);
    redirect('/');
  }
}

export default async function ProfilePage() {
  const user = await getUserProfile();

  return <ProfileClient initialUser={user} />;
}
