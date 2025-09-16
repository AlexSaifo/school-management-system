import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Retrieve the authorization token from headers
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || '';
    
    if (!term) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }
    
    // Search for students by name, ID, email
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { studentId: { contains: term, mode: 'insensitive' } },
          { user: { firstName: { contains: term, mode: 'insensitive' } } },
          { user: { lastName: { contains: term, mode: 'insensitive' } } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
        ]
      },
      include: {
        user: true,
        classRoom: {
          include: {
            gradeLevel: true
          }
        }
      },
      take: 10, // Limit results
    });
    
    // Transform data for frontend
    const transformedStudents = students.map(student => ({
      id: student.userId, // Use userId instead of student.id
      studentId: student.studentId,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      grade: student.classRoom?.gradeLevel?.name || '',
      gradeAr: student.classRoom?.gradeLevel?.nameAr || '',
      section: student.classRoom?.section || '',
      classroom: student.classRoom?.name || ''
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedStudents
    });
  } catch (error) {
    console.error('Error searching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search students' },
      { status: 500 }
    );
  }
}