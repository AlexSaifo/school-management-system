import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiAuth } from '@/lib/api-auth';

// GET /api/academic/grade-levels - Get all grade levels
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await handleApiAuth(request, false);
    if (!authResult.success) {
      return authResult.response;
    }

    const gradeLevels = await prisma.gradeLevel.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
      include: {
        classRooms: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      gradeLevels: gradeLevels.map((grade: any) => ({
        ...grade,
        totalClasses: grade.classRooms.length,
        totalStudents: grade.classRooms.reduce((sum: number, cls: any) => sum + cls._count.students, 0)
      }))
    });
  } catch (error) {
    console.error('Error fetching grade levels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/academic/grade-levels - Create new grade level
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request and require admin privileges
    const authResult = await handleApiAuth(request, true);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { name, nameAr, level, description } = body;

    if (!name || !nameAr || !level) {
      return NextResponse.json({ 
        error: 'Name, Arabic name, and level are required' 
      }, { status: 400 });
    }

    // Check if level already exists
    const existingLevel = await prisma.gradeLevel.findUnique({
      where: { level: parseInt(level) }
    });

    if (existingLevel) {
      return NextResponse.json({ 
        error: 'Grade level already exists' 
      }, { status: 409 });
    }

    const gradeLevel = await prisma.gradeLevel.create({
      data: {
        name,
        nameAr,
        level: parseInt(level),
        description
      }
    });

    return NextResponse.json({ gradeLevel }, { status: 201 });
  } catch (error) {
    console.error('Error creating grade level:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
