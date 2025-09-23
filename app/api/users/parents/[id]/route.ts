import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import CryptoJS from 'crypto-js';

// AES encryption utilities
const SECRET_KEY = process.env.AES_SECRET_KEY || 'your-secret-key-here';

const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

// Validation schema for parent update
const updateParentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().min(10, 'Valid phone number required').optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  studentRelations: z.array(z.object({
    studentId: z.string(),
    relationship: z.string().min(1, 'Relationship is required')
  })).optional(), // Array of student relationships with types
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;

    // Get parent with relationships
    const parent = await prisma.user.findFirst({
      where: {
        id: parentId,
        role: 'PARENT',
      },
      include: {
        parent: {
          include: {
            children: {
              include: {
                student: {
                  include: {
                    user: true,
                    classRoom: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const transformedParent = {
      id: parent.id,
      user: {
        firstName: parent.firstName || '',
        lastName: parent.lastName || '',
        email: parent.email || '',
        phoneNumber: parent.phone || '',
        address: parent.address || '',
        status: parent.status || 'ACTIVE',
        isActive: parent.status === 'ACTIVE', // For backwards compatibility
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
      },
      occupation: parent.parent?.occupation || '',
      children: parent.parent?.children.map((sp: any) => ({
        id: sp.student.id,
        name: `${sp.student.user.firstName} ${sp.student.user.lastName}`,
        studentId: sp.student.studentId,
        class: sp.student.classRoom?.name || '',
        grade: sp.student.classRoom?.gradeLevel?.name || '',
      })) || [],
    };

    return NextResponse.json({
      success: true,
      data: transformedParent,
    });
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parent' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = updateParentSchema.parse(body);

    // Check if parent exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: parentId,
        role: 'PARENT'
      },
      include: {
        parent: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Parent not found' },
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

    // Update parent with transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update user data
      const userData: any = {};
      if (validatedData.firstName !== undefined) userData.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined) userData.lastName = validatedData.lastName;
      if (validatedData.email !== undefined) userData.email = validatedData.email;
      if (validatedData.phoneNumber !== undefined) userData.phone = validatedData.phoneNumber;
      if (validatedData.address !== undefined) userData.address = validatedData.address;
      if (validatedData.status !== undefined) userData.status = validatedData.status;
      if (validatedData.password !== undefined) userData.password = encryptPassword(validatedData.password);

      const user = Object.keys(userData).length > 0
        ? await tx.user.update({
            where: { id: parentId },
            data: userData,
          })
        : existingUser;

      // Update parent profile data (remove relationship field)
      const parentData: any = {};
      if (validatedData.occupation !== undefined) parentData.occupation = validatedData.occupation;

      const parent = Object.keys(parentData).length > 0
        ? await tx.parent.update({
            where: { id: existingUser.parent?.id },
            data: parentData,
          })
        : existingUser.parent;

      // Update parent-student relationships if student relations provided
      if (validatedData.studentRelations && validatedData.studentRelations.length > 0) {
        // Delete existing relationships
        await tx.studentParent.deleteMany({
          where: { parentId: existingUser.parent?.id },
        });

        // Create new relationships with relationship types
        const studentRelations = await Promise.all(
          validatedData.studentRelations.map(async (relation: any) => {
            // Find the student record by userId to get the actual studentId
            const studentRecord = await tx.student.findUnique({
              where: { userId: relation.studentId },
            });

            if (!studentRecord) {
              throw new Error(`Student with user ID ${relation.studentId} not found`);
            }

            return tx.studentParent.create({
              data: {
                studentId: studentRecord.id, // Use the actual student ID, not user ID
                parentId: existingUser.parent?.id,
                relationship: relation.relationship,
              },
            });
          })
        );

        return { user, parent, studentRelations };
      }

      return { user, parent };
    });

    return NextResponse.json({
      success: true,
      message: 'Parent updated successfully',
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

    console.error('Error updating parent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update parent' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;

    // Check if parent exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: parentId,
        role: 'PARENT'
      },
      include: {
        parent: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Delete parent with transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete parent-student relationships
      await tx.studentParent.deleteMany({
        where: { parentId: existingUser.parent?.id },
      });

      // Delete parent profile
      await tx.parent.delete({
        where: { id: existingUser.parent?.id },
      });

      // Delete user
      await tx.user.delete({
        where: { id: parentId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Parent deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting parent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete parent' },
      { status: 500 }
    );
  }
}
