import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for teacher update
const updateTeacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().min(10, 'Valid phone number required').optional(),
  address: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  salary: z.number().optional(),
  joinDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;

    // Get teacher with relationships
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: 'TEACHER',
      },
      include: {
        teacher: {
          include: {
            teacherSubjects: {
              where: { isPrimary: true },
              include: { subject: true }
            }
          }
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const transformedTeacher = {
      id: teacher.id,
      user: {
        firstName: teacher.firstName || '',
        lastName: teacher.lastName || '',
        email: teacher.email || '',
        phoneNumber: teacher.phone || '',
        address: teacher.address || '',
        status: teacher.status || 'ACTIVE',
        isActive: teacher.status === 'ACTIVE', // For backwards compatibility
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      },
      employeeId: teacher.teacher?.employeeId || '',
      department: teacher.teacher?.department || '',
      subjects: teacher.teacher?.teacherSubjects?.map((ts: any) => ({
        id: ts.subject.id,
        name: ts.subject.name,
        nameAr: ts.subject.nameAr,
        code: ts.subject.code
      })) || [],
      qualification: teacher.teacher?.qualification || '',
      experience: teacher.teacher?.experience || 0,
      salary: teacher.teacher?.salary || 0,
      joinDate: teacher.teacher?.joinDate,
    };

    return NextResponse.json({
      success: true,
      data: transformedTeacher,
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = updateTeacherSchema.parse(body);

    // Check if teacher exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: teacherId,
        role: 'TEACHER'
      },
      include: {
        teacher: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if email already exists (if trying to update email)
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Check if employeeId already exists (if trying to update employeeId)
    if (validatedData.employeeId && validatedData.employeeId !== existingUser.teacher?.employeeId) {
      const employeeIdExists = await prisma.teacher.findUnique({
        where: { employeeId: validatedData.employeeId },
      });

      if (employeeIdExists) {
        return NextResponse.json(
          { success: false, error: 'Employee ID already exists' },
          { status: 400 }
        );
      }
    }

    // Update teacher with transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update user data
      const userData: any = {};
      if (validatedData.firstName !== undefined) userData.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined) userData.lastName = validatedData.lastName;
      if (validatedData.email !== undefined) userData.email = validatedData.email;
      if (validatedData.phoneNumber !== undefined) userData.phone = validatedData.phoneNumber;
      if (validatedData.address !== undefined) userData.address = validatedData.address;
      if (validatedData.status !== undefined) userData.status = validatedData.status;

      const user = Object.keys(userData).length > 0
        ? await tx.user.update({
            where: { id: teacherId },
            data: userData,
          })
        : existingUser;

      // Update teacher profile data
      const teacherData: any = {};
      if (validatedData.employeeId !== undefined) teacherData.employeeId = validatedData.employeeId;
      if (validatedData.department !== undefined) teacherData.department = validatedData.department;
      if (validatedData.qualification !== undefined) teacherData.qualification = validatedData.qualification;
      if (validatedData.experience !== undefined) teacherData.experience = validatedData.experience;
      if (validatedData.salary !== undefined) teacherData.salary = validatedData.salary;
      if (validatedData.joinDate !== undefined) teacherData.joinDate = new Date(validatedData.joinDate);

      const teacher = Object.keys(teacherData).length > 0
        ? await tx.teacher.update({
            where: { id: existingUser.teacher?.id },
            data: teacherData,
          })
        : existingUser.teacher;

      return { user, teacher };
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
      data: {
        id: result.user.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;

    // Check if teacher exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: teacherId,
        role: 'TEACHER'
      },
      include: {
        teacher: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Delete teacher with transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete teacher profile
      await tx.teacher.delete({
        where: { id: existingUser.teacher?.id },
      });

      // Delete user
      await tx.user.delete({
        where: { id: teacherId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}
