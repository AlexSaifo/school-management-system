import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth verification
const verifyAuth = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Validation schemas
const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  nameAr: z.string().min(1, 'Arabic subject name is required'),
  code: z.string().min(1, 'Subject code is required').max(10, 'Code too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

const updateSubjectSchema = createSubjectSchema.partial();

// GET /api/academic/subjects - Get all subjects with relationships
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyAuth(request);
    
    const { searchParams } = new URL(request.url);
    const includeGrades = searchParams.get('includeGrades') === 'true';
    const includeTeachers = searchParams.get('includeTeachers') === 'true';
    const gradeLevel = searchParams.get('gradeLevel');
    const teacherId = searchParams.get('teacherId');

    let whereClause: any = {
      isActive: true
    };

    // Filter by grade level if specified
    if (gradeLevel) {
      whereClause.gradeSubjects = {
        some: {
          gradeLevel: {
            level: parseInt(gradeLevel)
          }
        }
      };
    }

    // Filter by teacher if specified
    if (teacherId) {
      whereClause.teacherSubjects = {
        some: {
          teacherId: teacherId
        }
      };
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        gradeSubjects: includeGrades ? {
          include: {
            gradeLevel: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                level: true
              }
            }
          },
          orderBy: {
            gradeLevel: {
              level: 'asc'
            }
          }
        } : false,
        teacherSubjects: includeTeachers ? {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        } : false,
        _count: {
          select: {
            gradeSubjects: true,
            teacherSubjects: true,
            assignments: true,
            exams: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Transform data for frontend
    const transformedSubjects = subjects.map((subject: any) => ({
      id: subject.id,
      name: subject.name,
      nameAr: subject.nameAr,
      code: subject.code,
      description: subject.description,
      color: subject.color || '#1976d2',
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      grades: subject.gradeSubjects?.map((gs: any) => ({
        id: gs.gradeLevel.id,
        name: gs.gradeLevel.name,
        nameAr: gs.gradeLevel.nameAr,
        level: gs.gradeLevel.level,
        weeklyHours: gs.weeklyHours,
        isRequired: gs.isRequired
      })) || [],
      teachers: subject.teacherSubjects?.map((ts: any) => ({
        id: ts.teacher.id,
        name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
        isPrimary: ts.isPrimary
      })) || [],
      stats: {
        gradeCount: subject._count.gradeSubjects,
        teacherCount: subject._count.teacherSubjects,
        assignmentCount: subject._count.assignments,
        examCount: subject._count.exams
      }
    }));

    return NextResponse.json({
      success: true,
      data: transformedSubjects,
    });
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    if (error.message.includes('token') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST /api/academic/subjects - Create new subject
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyAuth(request);
    
    if (!['ADMIN'].includes(decoded.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createSubjectSchema.parse(body);

    // Check if subject code already exists
    const existingSubject = await prisma.subject.findUnique({
      where: { code: validatedData.code }
    });

    if (existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject code already exists' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        code: validatedData.code,
        description: validatedData.description,
        color: validatedData.color || '#1976d2',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error: any) {
    console.error('Error creating subject:', error);
    
    if (error.message.includes('token') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}