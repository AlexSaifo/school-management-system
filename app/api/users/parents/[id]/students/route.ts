import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // First, find the parent record for this user ID
    const parentRecord = await prisma.parent.findUnique({
      where: {
        userId: parentId,
      },
    });

    if (!parentRecord) {
      return NextResponse.json(
        { success: false, error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Get student relationships for this parent
    const parentStudents = await prisma.studentParent.findMany({
      where: {
        parentId: parentRecord.id, // Use parent record ID, not user ID
      },
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
    });

    // Transform data for frontend
    const transformedStudents = parentStudents.map((relation: any) => ({
      id: relation.student.userId, // Use userId instead of student.id
      studentId: relation.student.studentId,
      firstName: relation.student.user.firstName,
      lastName: relation.student.user.lastName,
      email: relation.student.user.email,
      grade: relation.student.classRoom?.gradeLevel?.name || '',
      gradeAr: relation.student.classRoom?.gradeLevel?.nameAr || '',
      section: relation.student.classRoom?.section || '',
      classroom: relation.student.classRoom?.name || '',
      relationship: relation.relationship, // Include relationship type
    }));

    return NextResponse.json({
      success: true,
      data: transformedStudents,
    });
  } catch (error) {
    console.error('Error fetching parent students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parent students' },
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
    const { studentIds } = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!Array.isArray(studentIds)) {
      return NextResponse.json(
        { success: false, error: 'studentIds must be an array' },
        { status: 400 }
      );
    }

    // Use a transaction to update parent-student relationships
    await prisma.$transaction(async (tx: any) => {
      // Find the parent record by userId
      const parentRecord = await tx.parent.findUnique({
        where: { userId: parentId },
      });

      if (!parentRecord) {
        throw new Error(`Parent with user ID ${parentId} not found`);
      }

      // Delete existing relationships
      await tx.studentParent.deleteMany({
        where: { parentId: parentRecord.id },
      });

      // Create new relationships if studentIds array is not empty
      if (studentIds.length > 0) {
        const studentParentRelations = await Promise.all(
          studentIds.map(async (studentUserId: string) => {
            // Find the student record by userId
            const studentRecord = await tx.student.findUnique({
              where: { userId: studentUserId },
            });

            if (!studentRecord) {
              throw new Error(`Student with user ID ${studentUserId} not found`);
            }

            return {
              studentId: studentRecord.id,
              parentId: parentRecord.id,
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
      message: 'Parent-student relationships updated successfully',
    });
  } catch (error) {
    console.error('Error updating parent-student relationships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update parent-student relationships' },
      { status: 500 }
    );
  }
}