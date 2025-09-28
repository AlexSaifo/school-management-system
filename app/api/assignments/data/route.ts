import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('API request from user:', decoded);
    console.log('User role:', decoded.role);
    console.log('User ID:', decoded.userId);

    // Only teachers and admins can access this data
    if (decoded.role !== 'TEACHER' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'classrooms' or 'subjects' or 'grades'
    const subjectId = searchParams.get('subjectId'); // Optional subject ID for filtering classrooms

    if (type === 'classrooms') {
      let classrooms;

      if (decoded.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: decoded.userId },
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        });

        if (!teacher) {
          return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }

        // Get all subjects the teacher teaches
        const subjectIds = teacher.teacherSubjects.map(ts => ts.subjectId);
        
        // Get specific subject-classroom assignments from timetable
        const timetableAssignments = await prisma.timetable.findMany({
          where: {
            teacherId: teacher.id,
            isActive: true,
            ...(subjectId ? { subjectId } : {}), // Filter by specific subject if provided
          },
          select: {
            subjectId: true,
            classRoomId: true,
            subject: {
              select: {
                code: true,
                name: true,
              }
            }
          },
          distinct: ['subjectId', 'classRoomId'],
        });
        
        // Group classroom IDs by subject ID
        const subjectSpecificClassrooms: Record<string, string[]> = {};
        timetableAssignments.forEach(entry => {
          if (entry.subjectId) {
            if (!subjectSpecificClassrooms[entry.subjectId]) {
              subjectSpecificClassrooms[entry.subjectId] = [];
            }
            subjectSpecificClassrooms[entry.subjectId].push(entry.classRoomId);
          }
        });
        
        // Handle specific subject filtering if subjectId is provided
        if (subjectId) {
          console.log(`Filtering classrooms for specific subject: ${subjectId}`);
          const specificClassroomIds = subjectSpecificClassrooms[subjectId] || [];
          
          // If we have specific classroom assignments for this subject, use only those
          if (specificClassroomIds.length > 0) {
            console.log(`Found ${specificClassroomIds.length} specific classroom assignments`);
            classrooms = await prisma.classRoom.findMany({
              where: {
                isActive: true,
                id: { in: specificClassroomIds }
              },
              select: {
                id: true,
                name: true,
                nameAr: true,
                section: true,
                sectionNumber: true,
                gradeLevel: {
                  select: { id: true, name: true, nameAr: true, level: true }
                },
                _count: {
                  select: { students: true }
                }
              },
              orderBy: [
                { gradeLevel: { level: 'asc' } },
                { sectionNumber: 'asc' }
              ]
            });
            
            return NextResponse.json({ classrooms });
          }
        }
        
        // For all subjects or if no specific assignments found
        // Check if we have specific assignments for Arabic subject
        const arabicSubject = teacher.teacherSubjects.find(ts => 
          ts.subject.code === 'ARAB' || ts.subject.name === 'Arabic' || 
          ts.subject.name.toLowerCase().includes('arabic')
        );
        
        // Get classroom IDs specifically for Arabic if available
        const arabicClassroomIds = arabicSubject ? 
          subjectSpecificClassrooms[arabicSubject.subjectId] || [] : [];
        
        // Determine if we should filter by specific classrooms for Arabic
        const hasArabicSpecificAssignments = arabicSubject && arabicClassroomIds.length > 0;
        
        // Query to get all classrooms based on teacher's subjects and specific assignments
        classrooms = await prisma.classRoom.findMany({
          where: {
            isActive: true,
            OR: [
              // For subjects other than Arabic, include all classrooms in relevant grades
              {
                gradeLevel: {
                  gradeSubjects: {
                    some: {
                      subjectId: {
                        in: hasArabicSpecificAssignments ? 
                          subjectIds.filter(id => id !== arabicSubject.subjectId) : 
                          subjectIds
                      }
                    }
                  }
                }
              },
              // For Arabic, only include specific assigned classrooms
              hasArabicSpecificAssignments ? {
                id: {
                  in: arabicClassroomIds
                }
              } : {}
            ]
          },
          select: {
            id: true,
            name: true,
            nameAr: true,
            section: true,
            sectionNumber: true,
            gradeLevel: {
              select: { id: true, name: true, nameAr: true, level: true }
            },
            _count: {
              select: { students: true }
            }
          },
          orderBy: [
            { gradeLevel: { level: 'asc' } },
            { sectionNumber: 'asc' }
          ]
        });
      } else {
        // Admins can see all classrooms
        classrooms = await prisma.classRoom.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameAr: true,
            section: true,
            sectionNumber: true,
            gradeLevel: {
              select: { id: true, name: true, nameAr: true, level: true }
            },
            _count: {
              select: { students: true }
            }
          },
          orderBy: [
            { gradeLevel: { level: 'asc' } },
            { sectionNumber: 'asc' }
          ]
        });
      }

      return NextResponse.json({ classrooms });
    }

    if (type === 'subjects') {
      console.log('Fetching subjects for user:', decoded.userId, 'role:', decoded.role);
      let subjects;

      if (decoded.role === 'TEACHER') {
        console.log('Looking up teacher with userId:', decoded.userId);
        const teacher = await prisma.teacher.findUnique({
          where: { userId: decoded.userId },
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        });

        console.log('Teacher found:', teacher ? 'YES' : 'NO');
        if (teacher) {
          console.log('Teacher subjects:', teacher.teacherSubjects.length);
          subjects = teacher.teacherSubjects.map(ts => ts.subject);
        } else {
          console.log('No teacher record found for userId:', decoded.userId);
          subjects = [];
        }
      } else {
        // Admins can see all subjects
        console.log('User is admin, fetching all subjects');
        subjects = await prisma.subject.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
        });
      }

      console.log('Returning subjects:', subjects.length);
      return NextResponse.json({ subjects });
    }

    if (type === 'grades') {
      const grades = await prisma.gradeLevel.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { classRooms: true }
          }
        },
        orderBy: { level: 'asc' }
      });

      return NextResponse.json({ grades });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching assignment data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
