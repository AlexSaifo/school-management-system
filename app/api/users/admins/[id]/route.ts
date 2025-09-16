import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

interface Params {
  params: {
    id: string;
  };
}

// Validation schema for admin update
const updateAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  permissions: z.object({
    canManageUsers: z.boolean(),
    canViewReports: z.boolean(),
    canManageSystem: z.boolean(),
    canManageClasses: z.boolean(),
  }).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    const admin = await prisma.user.findFirst({
      where: {
        id,
        role: 'ADMIN',
      },
      include: {
        admin: true,
      },
    });
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }
    
    // Transform data for frontend
    const transformedAdmin = {
      id: admin.id, // Use user.id for consistency
      user: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
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
    };
    
    return NextResponse.json({
      success: true,
      data: transformedAdmin,
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateAdminSchema.parse(body);
    
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        id,
        role: 'ADMIN',
      },
      include: {
        admin: true,
      },
    });
    
    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }
    
    // Check if email is being changed and already exists
    if (validatedData.email && validatedData.email !== existingAdmin.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const userUpdateData: any = {};
    const adminUpdateData: any = {};
    
    // User fields
    if (validatedData.firstName) userUpdateData.firstName = validatedData.firstName;
    if (validatedData.lastName) userUpdateData.lastName = validatedData.lastName;
    if (validatedData.email) userUpdateData.email = validatedData.email;
    if (validatedData.phoneNumber !== undefined) userUpdateData.phone = validatedData.phoneNumber;
    if (validatedData.address !== undefined) userUpdateData.address = validatedData.address;
    if (validatedData.isActive !== undefined) userUpdateData.status = validatedData.isActive ? 'ACTIVE' : 'INACTIVE';

    // Hash password if provided
    if (validatedData.password) {
      userUpdateData.password = await bcrypt.hash(validatedData.password, 12);
    }

    // Admin fields
    if (validatedData.permissions) adminUpdateData.permissions = validatedData.permissions;    // Update with transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id },
        data: userUpdateData,
      });
      
      // Update admin profile if admin data exists
      let updatedAdmin = null;
      if (Object.keys(adminUpdateData).length > 0) {
        if (existingAdmin.admin) {
          updatedAdmin = await tx.admin.update({
            where: { userId: id },
            data: adminUpdateData,
          });
        } else {
          updatedAdmin = await tx.admin.create({
            data: {
              userId: id,
              ...adminUpdateData,
            },
          });
        }
      }
      
      return { updatedUser, updatedAdmin };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        id: result.updatedUser.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Check if this is a toggle status request
    if ('isActive' in body) {
      const admin = await prisma.user.findFirst({
        where: {
          id,
          role: 'ADMIN',
        },
      });
      
      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        );
      }
      
      const updatedAdmin = await prisma.user.update({
        where: { id },
        data: { status: body.isActive ? 'ACTIVE' : 'INACTIVE' },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin status updated successfully',
        data: { id: updatedAdmin.id, isActive: updatedAdmin.status === 'ACTIVE' },
      });
    }
    
    // Handle regular update using the existing PUT logic
    return PUT(request, { params });
  } catch (error) {
    console.error('Error updating admin status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update admin status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        id,
        role: 'ADMIN',
      },
    });
    
    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }
    
    // Delete admin with transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete admin profile if exists
      await tx.admin.deleteMany({
        where: { userId: id },
      });
      
      // Delete user
      await tx.user.delete({
        where: { id },
      });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
