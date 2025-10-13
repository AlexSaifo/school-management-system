import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin or teacher
    if (!['ADMIN', 'TEACHER'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const gradeLevelId = searchParams.get('gradeLevelId');
    const academicYearId = searchParams.get('academicYearId');

    if (!gradeLevelId || !academicYearId) {
      return NextResponse.json(
        { error: 'gradeLevelId and academicYearId are required' },
        { status: 400 }
      );
    }

    // Get students in the specified grade for the current academic year
    const students = await prisma.student.findMany({
      where: {
        classRoom: {
          gradeLevelId: gradeLevelId,
          academicYearId: academicYearId,
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        classRoom: {
          include: {
            gradeLevel: true,
            academicYear: true
          }
        },
        academicProgressions: {
          where: {
            toAcademicYearId: academicYearId
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    // Get next academic year for promotion options
    const currentAcademicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    const nextAcademicYear = await prisma.academicYear.findFirst({
      where: {
        startDate: {
          gt: currentAcademicYear?.endDate
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Get available grade levels for promotion
    const currentGrade = await prisma.gradeLevel.findUnique({
      where: { id: gradeLevelId }
    });

    const availableGrades = await prisma.gradeLevel.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        level: 'asc'
      }
    });

    return NextResponse.json({
      students,
      currentAcademicYear,
      nextAcademicYear,
      currentGrade,
      availableGrades
    });
  } catch (error) {
    console.error('Error fetching students for progression:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { progressions } = body;

    if (!Array.isArray(progressions) || progressions.length === 0) {
      return NextResponse.json(
        { error: 'Progressions array is required' },
        { status: 400 }
      );
    }

    // Validate all progressions
    for (const progression of progressions) {
      const { studentId, toGradeLevelId, toAcademicYearId, toClassRoomId, progressionType, reason } = progression;

      if (!studentId || !toGradeLevelId || !toAcademicYearId || !progressionType) {
        return NextResponse.json(
          { error: 'studentId, toGradeLevelId, toAcademicYearId, and progressionType are required for each progression' },
          { status: 400 }
        );
      }

      if (!['PROMOTED', 'RETAINED'].includes(progressionType)) {
        return NextResponse.json(
          { error: 'progressionType must be either PROMOTED or RETAINED' },
          { status: 400 }
        );
      }

      if (progressionType === 'PROMOTED' && !toClassRoomId) {
        return NextResponse.json(
          { error: 'toClassRoomId is required when progressionType is PROMOTED' },
          { status: 400 }
        );
      }
    }

    const results = [];

    // Process each progression in a transaction
    for (const progression of progressions) {
  const { studentId, toGradeLevelId, toAcademicYearId, toClassRoomId, progressionType, reason } = progression;

      try {
        const result = await prisma.$transaction(async (tx) => {
          // Get current student info
          const student = await tx.student.findUnique({
            where: { id: studentId },
            include: {
              classRoom: {
                include: {
                  gradeLevel: true,
                  academicYear: true
                }
              }
            }
          });

          if (!student) {
            throw new Error('Student not found');
          }

          let assignedClassRoomId: string | null = null;

          // If promoted, assign student to a classroom in the new grade/year
          if (progressionType === 'PROMOTED') {
            let targetClassroom = null;

            if (toClassRoomId) {
              targetClassroom = await tx.classRoom.findUnique({
                where: { id: toClassRoomId },
                include: {
                  _count: {
                    select: { students: true }
                  }
                }
              });

              if (!targetClassroom) {
                throw new Error(`Selected classroom ${toClassRoomId} not found`);
              }

              if (targetClassroom.gradeLevelId !== toGradeLevelId || targetClassroom.academicYearId !== toAcademicYearId) {
                throw new Error('Selected classroom does not match target grade or academic year');
              }

              if (targetClassroom._count.students >= targetClassroom.capacity) {
                throw new Error(`Selected classroom ${targetClassroom.name} is at capacity`);
              }
            }

            if (!targetClassroom) {
              const fallbackClassroom = await tx.classRoom.findMany({
                where: {
                  gradeLevelId: toGradeLevelId,
                  academicYearId: toAcademicYearId,
                  isActive: true
                },
                include: {
                  _count: {
                    select: {
                      students: true
                    }
                  }
                }
              });

              targetClassroom = fallbackClassroom.find(classroom => classroom._count.students < classroom.capacity) ?? null;
            }

            if (!targetClassroom) {
              throw new Error(`No available classroom found in target grade/year for student ${studentId}`);
            }

            await tx.student.update({
              where: { id: studentId },
              data: {
                classRoomId: targetClassroom.id
              }
            });

            assignedClassRoomId = targetClassroom.id;
          }
          // If retained, check if current classroom exists in target academic year
          if (progressionType === 'RETAINED') {
            // Check if the student's current classroom exists in the target academic year
            let retainedClassroom = await tx.classRoom.findFirst({
              where: {
                gradeLevelId: toGradeLevelId,
                academicYearId: toAcademicYearId,
                name: student.classRoom?.name, // Same classroom name
                section: student.classRoom?.section, // Same section
                isActive: true
              }
            });

            if (retainedClassroom) {
              // Move to equivalent classroom in new academic year
              await tx.student.update({
                where: { id: studentId },
                data: {
                  classRoomId: retainedClassroom.id
                }
              });

              assignedClassRoomId = retainedClassroom.id;
            } else {
              // If no equivalent classroom, find any available classroom in the grade/year
              const availableClassroom = await tx.classRoom.findFirst({
                where: {
                  gradeLevelId: toGradeLevelId,
                  academicYearId: toAcademicYearId,
                  isActive: true
                },
                include: {
                  _count: {
                    select: {
                      students: true
                    }
                  }
                }
              });

              if (availableClassroom && availableClassroom._count.students < availableClassroom.capacity) {
                await tx.student.update({
                  where: { id: studentId },
                  data: {
                    classRoomId: availableClassroom.id
                  }
                });

                assignedClassRoomId = availableClassroom.id;
              } else {
                throw new Error(`No available classroom found for retained student ${studentId}`);
              }
            }
          }

          // Create progression record after assigning classroom
          const progressionRecord = await tx.studentAcademicProgression.create({
            data: {
              studentId,
              fromAcademicYearId: student.classRoom?.academicYearId,
              fromGradeLevelId: student.classRoom?.gradeLevelId,
              fromClassRoomId: student.classRoomId,
              toAcademicYearId,
              toGradeLevelId,
              toClassRoomId: assignedClassRoomId ?? undefined,
              progressionType: progressionType as any,
              reason,
              effectiveDate: new Date(),
              processedById: decoded.userId
            }
          });

          return {
            studentId,
            progressionId: progressionRecord.id,
            progressionType,
            success: true
          };
        });

        results.push(result);
      } catch (error) {
        console.error(`Error processing progression for student ${studentId}:`, error);
        results.push({
          studentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.filter(r => r.success).length} out of ${progressions.length} progressions`
    });
  } catch (error) {
    console.error('Error processing student progressions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}