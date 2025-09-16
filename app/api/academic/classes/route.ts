import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenEdge } from '@/lib/auth-edge';

// GET /api/academic/classes - Get all classrooms with grade levels
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeLevel = searchParams.get('gradeLevel');

    const whereClause: any = {
      isActive: true
    };
    
    if (gradeLevel) {
      const grade = await prisma.gradeLevel.findFirst({
        where: { level: parseInt(gradeLevel) }
      });
      if (grade) {
        whereClause.gradeLevelId = grade.id;
      }
    }

    const classRooms = await prisma.classRoom.findMany({
      where: whereClause,
      include: {
        gradeLevel: {
          select: {
            id: true,
            level: true,
            nameAr: true
          }
        },
        students: {
          select: { id: true }
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: [
        { gradeLevel: { level: 'asc' } },
        { sectionNumber: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      classRooms: classRooms.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        nameAr: cls.nameAr,
        section: cls.section,
        sectionNumber: cls.sectionNumber,
        roomNumber: cls.roomNumber,
        floor: cls.floor,
        capacity: cls.capacity,
        facilities: cls.facilities,
        isActive: cls.isActive,
        academicYear: cls.academicYear,
        gradeLevel: cls.gradeLevel,
        studentCount: cls._count.students
      }))
    });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
