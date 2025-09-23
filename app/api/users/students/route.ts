import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import CryptoJS from 'crypto-js';
import { z } from 'zod';

// Static secret key for encryption (in production, this should be in environment variables)
const SECRET_KEY = 'school-management-secret-key-2025';

// Encryption/Decryption utilities
const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

const decryptPassword = (encryptedPassword: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Validation schema for student creation
const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  studentId: z.string().min(1, 'Student ID is required'),
  classRoomId: z.string().min(1, 'Classroom is required'),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  admissionDate: z.string().min(1, 'Admission date is required'),
  parentIds: z.array(z.string()).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
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
    const classId = searchParams.get('class') || '';
    const gradeId = searchParams.get('grade') || '';
    const status = searchParams.get('status') || '';
    const bloodGroup = searchParams.get('bloodGroup') || '';
    
    // Build where clause
    const where: any = {
      role: 'STUDENT',
    };
    
    // Add search conditions
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // Add class filter
    if (classId) {
      where.student = {
        ...where.student,
        classRoomId: classId,
      };
    }
    
    // Add grade filter
    if (gradeId && gradeId !== 'all') {
      where.student = {
        ...where.student,
        classRoom: {
          ...where.student?.classRoom,
          gradeLevelId: gradeId,
        },
      };
    }
    
    // Add blood group filter
    if (bloodGroup) {
      where.student = {
        ...where.student,
        bloodGroup: bloodGroup,
      };
    }
    
    // Add status filter
    if (status) {
      where.status = status === 'active' ? 'ACTIVE' : 'INACTIVE';
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where });
    
    // Get students with relationships
    const students = await prisma.user.findMany({
      where,
      skip,
      take: limit,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data for frontend
    const transformedStudents = students.map((student: any) => ({
      id: student.id,
      user: {
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        phone: student.phone || '', // Using correct field from schema
        address: student.address || '',
        password: student.password || '', // Include encrypted password for admin display
        isActive: student.status === 'ACTIVE', // Keep isActive for backward compatibility
        status: student.status || 'ACTIVE',
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
      studentId: student.student?.studentId || '',
      rollNumber: student.student?.rollNumber || '',
      class: student.student?.classRoom?.name || '',
      classId: student.student?.classRoomId || '',
      grade: student.student?.classRoom?.gradeLevel?.name || '',
      gradeAr: student.student?.classRoom?.gradeLevel?.nameAr || '',
      section: student.student?.classRoom?.section || '',
      classroom: student.student?.classRoom?.name || '',
      classroomAr: student.student?.classRoom?.nameAr || '',
      academicYear: student.student?.classRoom?.academicYear || '',
      classRoomData: student.student?.classRoom,
      gradeLevelData: student.student?.classRoom?.gradeLevel,
      dateOfBirth: student.student?.dateOfBirth,
      admissionDate: student.student?.admissionDate,
      bloodGroup: student.student?.bloodGroup,
      emergencyContact: student.student?.emergencyContact,
      parents: student.student?.parents.map((sp: any) => ({
        id: sp.parent.id,
        name: `${sp.parent.user.firstName} ${sp.parent.user.lastName}`,
        email: sp.parent.user.email,
        phone: sp.parent.user.phone,
        relationship: sp.relationship, // Get relationship from StudentParent junction table
      })) || [],
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        students: transformedStudents,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createStudentSchema.parse(body);
    
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
    
    // Check if student ID already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: validatedData.studentId },
    });
    
    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student ID already exists' },
        { status: 400 }
      );
    }
    
    // Encrypt the provided password with static secret key
    const encryptedPassword = encryptPassword(validatedData.password);
    
    // Create student with transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: encryptedPassword,
          phone: validatedData.phoneNumber, // Using phoneNumber from form but correct field name is phone
          address: validatedData.address,
          role: 'STUDENT',
          status: validatedData.status,
        },
      });
      
      // Create student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: validatedData.studentId,
          classRoomId: validatedData.classRoomId,
          rollNumber: validatedData.rollNumber,
          dateOfBirth: new Date(validatedData.dateOfBirth),
          admissionDate: new Date(validatedData.admissionDate),
          bloodGroup: validatedData.bloodGroup,
          emergencyContact: validatedData.emergencyContact,
        },
      });
      
      // Create parent-student relationships if parent IDs provided
      if (validatedData.parentIds && validatedData.parentIds.length > 0) {
        const parentStudents = await Promise.all(
          validatedData.parentIds.map(async (parentUserId) => {
            // Find the parent record by userId to get the actual parentId
            const parentRecord = await tx.parent.findUnique({
              where: { userId: parentUserId },
            });

            if (!parentRecord) {
              throw new Error(`Parent with user ID ${parentUserId} not found`);
            }

            return tx.studentParent.create({
              data: {
                parentId: parentRecord.id, // Use the actual parent ID, not user ID
                studentId: student.id,
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
      message: 'Student created successfully',
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
    
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
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
      // Delete students and their relationships
      result = await prisma.$transaction(async (tx: any) => {
        // Delete parent-student relationships
        await tx.studentParent.deleteMany({
          where: {
            student: {
              userId: { in: userIds },
            },
          },
        });
        
        // Delete student profiles
        await tx.student.deleteMany({
          where: {
            userId: { in: userIds },
          },
        });
        
        // Delete users
        const deletedUsers = await tx.user.deleteMany({
          where: {
            id: { in: userIds },
            role: 'STUDENT',
          },
        });
        
        return deletedUsers;
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} students deleted successfully`,
      });
    } else {
      // Update student status
      const status = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
      
      result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          role: 'STUDENT',
        },
        data: {
          status,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} students ${action}d successfully`,
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
