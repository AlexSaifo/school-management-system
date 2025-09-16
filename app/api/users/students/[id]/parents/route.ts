import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get parent relationships for this student
    const studentRecord = await prisma.student.findUnique({
      where: { userId: studentId },
      include: {
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
    });

    if (!studentRecord) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const transformedParents = studentRecord.parents.map((relation) => ({
      id: relation.parent.userId, // Use userId instead of parent.id
      firstName: relation.parent.user.firstName,
      lastName: relation.parent.user.lastName,
      email: relation.parent.user.email,
      phone: relation.parent.user.phone,
      relationship: relation.relationship, // Get relationship from StudentParent junction table
      occupation: relation.parent.occupation,
    }));

    return NextResponse.json({
      success: true,
      data: transformedParents,
    });
  } catch (error) {
    console.error('Error fetching student parents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student parents' },
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
    const { parentIds } = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!Array.isArray(parentIds)) {
      return NextResponse.json(
        { success: false, error: 'parentIds must be an array' },
        { status: 400 }
      );
    }

    // Use a transaction to update parent-student relationships
    await prisma.$transaction(async (tx) => {
      // Find the student record by userId
      const studentRecord = await tx.student.findUnique({
        where: { userId: studentId },
      });

      if (!studentRecord) {
        throw new Error(`Student with user ID ${studentId} not found`);
      }

      // Delete existing relationships
      await tx.studentParent.deleteMany({
        where: { studentId: studentRecord.id },
      });

      // Create new relationships if parentIds array is not empty
      if (parentIds.length > 0) {
        const studentParentRelations = await Promise.all(
          parentIds.map(async (parentUserId: string) => {
            // Find the parent record by userId
            const parentRecord = await tx.parent.findUnique({
              where: { userId: parentUserId },
            });

            if (!parentRecord) {
              throw new Error(`Parent with user ID ${parentUserId} not found`);
            }

            return {
              studentId: studentRecord.id,
              parentId: parentRecord.id,
              relationship: 'Father', // Default relationship
            };
          })
        );

        await tx.studentParent.createMany({
          data: studentParentRelations,
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Student-parent relationships updated successfully',
    });
  } catch (error) {
    console.error('Error updating student-parent relationships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student-parent relationships' },
      { status: 500 }
    );
  }
}