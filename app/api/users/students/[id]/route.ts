import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for student update
const updateStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  studentId: z.string().optional(),
  classRoomId: z.string().optional(),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  admissionDate: z.string().optional(),
  parentRelations: z.array(z.object({
    parentId: z.string(),
    relationship: z.string().min(1, 'Relationship is required')
  })).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // Get student with relationships
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
      },
      include: {
        student: {
          include: {
            classRoom: {
              include: {
                gradeLevel: true
              }
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
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const transformedStudent = {
      id: student.id,
      user: {
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        phone: student.phone || '', // Using correct field from schema
        address: student.address || '',
        status: student.status || 'ACTIVE',
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
      studentId: student.student?.studentId || '',
      rollNumber: student.student?.rollNumber || '',
      student: {
        classRoomId: student.student?.classRoomId || '',
        rollNumber: student.student?.rollNumber || '',
        dateOfBirth: student.student?.dateOfBirth,
        bloodGroup: student.student?.bloodGroup || '',
        emergencyContact: student.student?.emergencyContact || '',
        admissionDate: student.student?.admissionDate,
      },
      // For backward compatibility
      class: student.student?.classRoom?.name || '',
      classId: student.student?.classRoomId || '',
      grade: student.student?.classRoom?.gradeLevel?.name || '',
      gradeAr: student.student?.classRoom?.gradeLevel?.nameAr || '',
      section: student.student?.classRoom?.section || '',
      dateOfBirth: student.student?.dateOfBirth,
      admissionDate: student.student?.admissionDate,
      bloodGroup: student.student?.bloodGroup,
      emergencyContact: student.student?.emergencyContact,
      parents: student.student?.parents.map((sp: any) => ({
        id: sp.parent.userId, // Use userId instead of parent.id
        name: `${sp.parent.user.firstName} ${sp.parent.user.lastName}`,
        email: sp.parent.user.email,
        relationship: sp.relationship, // Use relationship from junction table
      })) || [],
    };

    return NextResponse.json({
      success: true,
      data: transformedStudent,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: studentId,
        role: 'STUDENT'
      },
      include: {
        student: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
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

    // Check if studentId already exists (if trying to update studentId)
    if (validatedData.studentId && validatedData.studentId !== existingUser.student?.studentId) {
      const studentIdExists = await prisma.student.findUnique({
        where: { studentId: validatedData.studentId },
      });

      if (studentIdExists) {
        return NextResponse.json(
          { success: false, error: 'Student ID already exists' },
          { status: 400 }
        );
      }
    }

    // Update student with transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update user data
      const userData: any = {};
      if (validatedData.firstName !== undefined) userData.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined) userData.lastName = validatedData.lastName;
      if (validatedData.email !== undefined) userData.email = validatedData.email;
      if (validatedData.phoneNumber !== undefined) userData.phone = validatedData.phoneNumber; // Fixed field name
      if (validatedData.address !== undefined) userData.address = validatedData.address;
      if (validatedData.status !== undefined) userData.status = validatedData.status;

      const user = Object.keys(userData).length > 0
        ? await tx.user.update({
            where: { id: studentId },
            data: userData,
          })
        : existingUser;

      // Update student profile data
      const studentData: any = {};
      if (validatedData.studentId !== undefined) studentData.studentId = validatedData.studentId;
      if (validatedData.classRoomId !== undefined) studentData.classRoomId = validatedData.classRoomId;
      if (validatedData.rollNumber !== undefined) studentData.rollNumber = validatedData.rollNumber;
      if (validatedData.dateOfBirth !== undefined) studentData.dateOfBirth = new Date(validatedData.dateOfBirth);
      if (validatedData.admissionDate !== undefined) studentData.admissionDate = new Date(validatedData.admissionDate);
      if (validatedData.bloodGroup !== undefined) studentData.bloodGroup = validatedData.bloodGroup;
      if (validatedData.emergencyContact !== undefined) studentData.emergencyContact = validatedData.emergencyContact;

      const student = Object.keys(studentData).length > 0
        ? await tx.student.update({
            where: { id: existingUser.student?.id },
            data: studentData,
          })
        : existingUser.student;

      // Update parent-student relationships if parent relations provided
      if (validatedData.parentRelations && validatedData.parentRelations.length > 0) {
        // Delete existing relationships
        await tx.studentParent.deleteMany({
          where: { studentId: existingUser.student?.id },
        });

        // Create new relationships with relationship types
        const parentStudents = await Promise.all(
          validatedData.parentRelations.map(async (relation: any) => {
            // Find the parent record by userId to get the actual parentId
            const parentRecord = await tx.parent.findUnique({
              where: { userId: relation.parentId },
            });

            if (!parentRecord) {
              throw new Error(`Parent with user ID ${relation.parentId} not found`);
            }

            return tx.studentParent.create({
              data: {
                parentId: parentRecord.id, // Use the actual parent ID, not user ID
                studentId: existingUser.student?.id,
                relationship: relation.relationship,
              },
            });
          })
        );

        return { user, student, parentStudents };
      }

      return { user, student };
    });

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
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

    console.error('Error updating student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // Check if student exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: studentId,
        role: 'STUDENT'
      },
      include: {
        student: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Delete student with transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete parent-student relationships
      await tx.studentParent.deleteMany({
        where: { studentId: existingUser.student?.id },
      });

      // Delete student profile
      await tx.student.delete({
        where: { id: existingUser.student?.id },
      });

      // Delete user
      await tx.user.delete({
        where: { id: studentId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
