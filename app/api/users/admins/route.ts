import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema for admin creation
const createAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
  phoneNumber: z.string().optional().default(''),
  address: z.string().optional().default(''),
  permissions: z.object({
    canManageUsers: z.boolean().default(false),
    canViewReports: z.boolean().default(false),
    canManageSystem: z.boolean().default(false),
    canManageClasses: z.boolean().default(false),
  }).optional().default({
    canManageUsers: false,
    canViewReports: false,
    canManageSystem: false,
    canManageClasses: false,
  }),
  isActive: z.boolean().default(true),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
    
    // Build where clause
    const where: any = {
      role: 'ADMIN',
    };
    
    // Add search conditions
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Add status filter
    if (status) {
      where.status = status === 'active' ? 'ACTIVE' : 'INACTIVE';
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where });
    
    // Get admins with relationships
    const admins = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        admin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data for frontend
    const transformedAdmins = admins.map((admin: any) => ({
      id: admin.id, // Use user.id for consistency with individual admin routes
      user: {
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        email: admin.email || '',
        phoneNumber: admin.phone || '',
        address: admin.address || '',
        isActive: admin.status === 'ACTIVE',
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      permissions: admin.admin?.permissions || {
        canManageUsers: false,
        canViewReports: false,
        canManageSystem: false,
        canManageClasses: false,
      },
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        admins: transformedAdmins,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAdminSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash the provided password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user and admin in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: hashedPassword,
          phone: validatedData.phoneNumber,
          address: validatedData.address,
          role: 'ADMIN',
          status: validatedData.isActive ? 'ACTIVE' : 'INACTIVE',
        }
      });

      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          permissions: validatedData.permissions,
        }
      });

      return { user, admin };
    });

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: result.user.id,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const { action, userIds } = bulkActionSchema.parse(body);
    
    let result;
    
    if (action === 'delete') {
      // Delete admins and their relationships
      result = await prisma.$transaction(async (tx: any) => {
        // Delete admin profiles
        await tx.admin.deleteMany({
          where: {
            userId: { in: userIds },
          },
        });
        
        // Delete users
        const deletedUsers = await tx.user.deleteMany({
          where: {
            id: { in: userIds },
            role: 'ADMIN',
          },
        });
        
        return deletedUsers;
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} admins deleted successfully`,
      });
    } else {
      // Update admin status
      const status = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
      
      result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          role: 'ADMIN',
        },
        data: {
          status,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: `${result.count} admins ${action}d successfully`,
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
