import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenEdge } from '@/lib/auth-edge';

// GET /api/academic/grade-levels/[id] - Get specific grade level
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const gradeLevel = await prisma.gradeLevel.findUnique({
      where: { id: params.id },
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

    if (!gradeLevel) {
      return NextResponse.json({ error: 'Grade level not found' }, { status: 404 });
    }

    return NextResponse.json({ gradeLevel });
  } catch (error) {
    console.error('Error fetching grade level:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/academic/grade-levels/[id] - Update grade level
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, nameAr, level, description, isActive } = body;

    // Check if the new level conflicts with existing ones (if level is being changed)
    if (level) {
      const existingLevel = await prisma.gradeLevel.findFirst({
        where: { 
          level: parseInt(level),
          id: { not: params.id }
        }
      });

      if (existingLevel) {
        return NextResponse.json({ 
          error: 'Grade level number already exists' 
        }, { status: 409 });
      }
    }

    const gradeLevel = await prisma.gradeLevel.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(nameAr && { nameAr }),
        ...(level && { level: parseInt(level) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ gradeLevel });
  } catch (error) {
    console.error('Error updating grade level:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/academic/grade-levels/[id] - Delete grade level
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = await verifyTokenEdge(token);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if grade level has associated classrooms
    const classCount = await prisma.classRoom.count({
      where: { gradeLevelId: params.id }
    });

    if (classCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete grade level with associated classrooms' 
      }, { status: 409 });
    }

    await prisma.gradeLevel.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Grade level deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade level:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
