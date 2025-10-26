import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import CryptoJS from 'crypto-js';
import { z } from 'zod';
import { AES_SECRET_KEY } from '@/lib/config';

// AES encryption utilities — use centralized config to avoid mismatched keys
const SECRET_KEY = AES_SECRET_KEY;

const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

// Validation schema for parent creation
const createParentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(1, 'Address is required'),
  occupation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  studentRelations: z.array(z.object({
    studentId: z.string(),
    relationship: z.string().min(1, 'Relationship is required')
  })).optional(), // Array of student relationships with types
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
    const status = searchParams.get('status') || '';
    const occupation = searchParams.get('occupation') || '';
    
    // Build where clause
    const where: any = {
      role: 'PARENT',
    };
    
    // Add search conditions
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Add occupation filter
    if (occupation) {
      where.parent = {
        occupation: { contains: occupation, mode: 'insensitive' },
      };
    }
    
    // Add status filter
    if (status) {
      where.status = status === 'active' ? 'ACTIVE' : 'INACTIVE';
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where });
    
    // Get parents with relationships
    const parents = await prisma.user.findMany({
      where,
      skip,
      take: limit,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data for frontend
    const transformedParents = parents.map((parent: any) => ({
      id: parent.id,
      user: {
        firstName: parent.firstName || '',
        lastName: parent.lastName || '',
        email: parent.email || '',
        phoneNumber: parent.phone || '', // Corrected field name
        address: parent.address || '',
        password: parent.password || '', // Include encrypted password for admin display
        isActive: parent.status === 'ACTIVE', // For backwards compatibility
        status: parent.status || 'ACTIVE',
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
      },
      occupation: parent.parent?.occupation || '',
      children: parent.parent?.children.map((sp: any) => ({
        id: sp.student.userId, // Use user ID instead of student record ID
        studentId: sp.student.studentId,
        rollNumber: sp.student.rollNumber,
        grade: sp.student.classRoom?.gradeLevel?.name || '',
        gradeAr: sp.student.classRoom?.gradeLevel?.nameAr || '',
        section: sp.student.classRoom?.section || '',
        relationship: sp.relationship, // Get relationship from StudentParent junction table
        user: {
          firstName: sp.student.user.firstName || '',
          lastName: sp.student.user.lastName || '',
          email: sp.student.user.email || '',
        },
      })) || [],
      childrenCount: parent.parent?.children.length || 0,
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        parents: transformedParents,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createParentSchema.parse(body);
    
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
    
    // Encrypt password
    const encryptedPassword = encryptPassword(validatedData.password);
    
    // Create parent with transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: encryptedPassword,
          phone: validatedData.phoneNumber, // Corrected field name
          address: validatedData.address,
          role: 'PARENT',
          status: validatedData.status,
        },
      });
      
      // Create parent profile (without relationship field)
      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          occupation: validatedData.occupation,
        },
      });

      // Create student-parent relationships if studentRelations provided
      if (validatedData.studentRelations && validatedData.studentRelations.length > 0) {
        const studentParentRelations = await Promise.all(
          validatedData.studentRelations.map(async (relation: any) => {
            // Find the student record by userId to get the actual studentId
            const studentRecord = await tx.student.findUnique({
              where: { userId: relation.studentId },
            });

            if (!studentRecord) {
              throw new Error(`Student with user ID ${relation.studentId} not found`);
            }

            return {
              studentId: studentRecord.id, // Use the actual student ID, not user ID
              parentId: parent.id,
              relationship: relation.relationship,
            };
          })
        );

        await tx.studentParent.createMany({
          data: studentParentRelations,
        });
      }
      
      return { user, parent };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Parent created successfully',
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
    
    console.error('Error creating parent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create parent' },
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
      // Delete parents and their relationships
      result = await prisma.$transaction(async (tx: any) => {
        // Delete parent-student relationships
        await tx.studentParent.deleteMany({
          where: {
            parent: {
              userId: { in: userIds },
            },
          },
        });
        
        // Delete parent profiles
        await tx.parent.deleteMany({
          where: {
            userId: { in: userIds },
          },
        });
        
        // Delete users
        const deletedUsers = await tx.user.deleteMany({
          where: {
            id: { in: userIds },
            role: 'PARENT',
          },
        });
        
        return deletedUsers;
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} parents deleted successfully`,
      });
    } else {
      // Update parent status
      const status = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
      
      result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          role: 'PARENT',
        },
        data: {
          status,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} parents ${action}d successfully`,
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
