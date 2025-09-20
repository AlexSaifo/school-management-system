import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema for teacher creation
const createTeacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(1, 'Address is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().optional(),
  qualification: z.string().min(1, 'Qualification is required'),
  experience: z.number().min(0, 'Experience must be positive'),
  salary: z.number().min(0, 'Salary must be positive').optional(),
  joinDate: z.string().min(1, 'Join date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

// Validation schema for bulk operations
const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete']),
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Search parameters
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    
    // Build where clause
    const where: any = {
      role: 'TEACHER',
    };
    
    // Add search conditions
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Add department filter
    if (department) {
      where.teacher = {
        department: { contains: department, mode: 'insensitive' },
      };
    }
    
    // Add status filter
    if (status) {
      where.status = status === 'active' ? 'ACTIVE' : 'INACTIVE';
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where });
    
    // Get teachers with relationships
    const teachers = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: {
          include: {
            teacherSubjects: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    nameAr: true,
                    code: true
                  }
                }
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data for frontend
    const transformedTeachers = teachers.map((teacher: any) => ({
      id: teacher.id,
      user: {
        firstName: teacher.firstName || '',
        lastName: teacher.lastName || '',
        email: teacher.email || '',
        phoneNumber: teacher.phone || '', // Corrected field name
        address: teacher.address || '',
        isActive: teacher.status === 'ACTIVE', // For backwards compatibility
        status: teacher.status || 'ACTIVE',
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
      salary: teacher.teacher?.salary ? Number(teacher.teacher.salary) : 0,
      joinDate: teacher.teacher?.joinDate,
      assignedClasses: [], // Will be populated when class assignment is implemented
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        teachers: transformedTeachers,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createTeacherSchema.parse(body);
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    // Check if employee ID already exists
    const existingEmployee = await prisma.teacher.findUnique({
      where: { employeeId: validatedData.employeeId },
    });
    
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee ID already exists' },
        { status: 400 }
      );
    }
    
    // Create teacher with transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: hashedPassword,
          phone: validatedData.phoneNumber, // Corrected field name
          address: validatedData.address,
          role: 'TEACHER',
          status: validatedData.status,
        },
      });
      
      // Create teacher profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId: validatedData.employeeId,
          department: validatedData.department || '',
          qualification: validatedData.qualification,
          experience: validatedData.experience,
          salary: validatedData.salary,
          joinDate: new Date(validatedData.joinDate),
        },
      });
      
      return { user, teacher };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        id: result.user.id,
        tempPassword,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const { action, userIds } = bulkActionSchema.parse(body);
    
    let result;
    
    if (action === 'delete') {
      // Delete teachers and their relationships
      result = await prisma.$transaction(async (tx: any) => {
        // Delete teacher profiles
        await tx.teacher.deleteMany({
          where: {
            userId: { in: userIds },
          },
        });
        
        // Delete users
        const deletedUsers = await tx.user.deleteMany({
          where: {
            id: { in: userIds },
            role: 'TEACHER',
          },
        });
        
        return deletedUsers;
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} teachers deleted successfully`,
      });
    } else {
      // Update teacher status
      const status = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
      
      result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          role: 'TEACHER',
        },
        data: {
          status,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} teachers ${action}d successfully`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
