import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    let data: any = {};
    
    if (type === 'all' || type === 'departments') {
      const departments = await prisma.teacher.findMany({
        select: {
          department: true
        },
        distinct: ['department'],
        orderBy: { department: 'asc' },
      });
      data.departments = departments.map(d => ({ name: d.department }));
    }
    
    if (type === 'all' || type === 'subjects') {
      const subjects = await prisma.subject.findMany({
        orderBy: { name: 'asc' },
      });
      data.subjects = subjects;
    }
    
    if (type === 'all' || type === 'classes') {
      const classRooms = await prisma.classRoom.findMany({
        include: {
          gradeLevel: true,
        },
        orderBy: { name: 'asc' },
      });
      data.classes = classRooms.map((cls: any) => ({
        ...cls,
        displayName: `${cls.name} - ${cls.gradeLevel.level} ${cls.section}`,
      }));
    }
    
    if (type === 'all' || type === 'parents') {
      const parents = await prisma.user.findMany({
        where: {
          role: 'PARENT',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          parent: {
            select: {
              occupation: true,
            },
          },
        },
        orderBy: { firstName: 'asc' },
      });
      
      data.parents = parents.map((parent: any) => ({
        id: parent.id,
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email,
        occupation: parent.parent?.occupation || '',
      }));
    }
    
    if (type === 'all' || type === 'students') {
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          status: 'ACTIVE',
        },
        include: {
          student: {
            include: {
              classRoom: true,
            },
          },
        },
        orderBy: { firstName: 'asc' },
      });
      
      data.students = students.map((student: any) => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.student?.rollNumber || '',
        class: student.student?.classRoom?.name || '',
      }));
    }
    
    if (type === 'all' || type === 'bloodGroups') {
      data.bloodGroups = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
      ];
    }
    
    if (type === 'all' || type === 'relations') {
      data.relations = [
        'FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER'
      ];
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dropdown data' },
      { status: 500 }
    );
  }
}
