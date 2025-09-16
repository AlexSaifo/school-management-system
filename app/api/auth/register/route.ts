import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { userSchema, teacherSchema, studentSchema, parentSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate basic user data
    const validatedUserData = userSchema.parse(body.user);
    const { password, ...userDataWithoutPassword } = validatedUserData;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with role-specific data
    const result = await prisma.$transaction(async (tx: any) => {
      // Create base user
      const user = await tx.user.create({
        data: {
          ...userDataWithoutPassword,
          password: hashedPassword,
        },
      });

      // Create role-specific record
      switch (user.role) {
        case 'ADMIN':
          await tx.admin.create({
            data: {
              userId: user.id,
              permissions: body.adminData?.permissions || {
                canManageUsers: true,
                canManageClasses: true,
                canViewReports: true,
                canManageSystem: true,
              },
            },
          });
          break;

        case 'TEACHER':
          const teacherData = teacherSchema.parse(body.teacherData);
          await tx.teacher.create({
            data: {
              userId: user.id,
              ...teacherData,
            },
          });
          break;

        case 'STUDENT':
          const studentData = studentSchema.parse(body.studentData);
          await tx.student.create({
            data: {
              userId: user.id,
              ...studentData,
            },
          });
          break;

        case 'PARENT':
          const parentData = parentSchema.parse(body.parentData);
          await tx.parent.create({
            data: {
              userId: user.id,
              ...parentData,
            },
          });
          break;

        default:
          throw new Error('Invalid role specified');
      }

      return user;
    });

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = result;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
