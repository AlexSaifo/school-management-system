import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the teacher's user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        teacher: true
      }
    });

    if (!user || user.role !== 'TEACHER' || !user.teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const teacherId = user.teacher.id;

    // Get all subject assignments for this teacher
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId },
      include: {
        subject: true
      }
    });

    // Get all assignments for this teacher grouped by subject
    const assignments = await prisma.assignment.findMany({
      where: { teacherId },
      include: {
        subject: true,
        classRoom: {
          include: {
            gradeLevel: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: [
        { dueDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Group assignments by subject
    const subjectGroups = new Map();
    
    teacherSubjects.forEach(teacherSubject => {
      subjectGroups.set(teacherSubject.subject.id, {
        subject: teacherSubject.subject,
        grades: new Set(),
        classrooms: new Set(),
        assignments: []
      });
    });

    // Add assignments to their respective subjects and collect unique grades/classrooms
    assignments.forEach(assignment => {
      const subjectGroup = subjectGroups.get(assignment.subjectId);
      if (subjectGroup) {
        subjectGroup.assignments.push(assignment);
        subjectGroup.grades.add(JSON.stringify({
          id: assignment.classRoom.gradeLevel.id,
          name: assignment.classRoom.gradeLevel.name,
          level: assignment.classRoom.gradeLevel.level
        }));
        subjectGroup.classrooms.add(JSON.stringify({
          id: assignment.classRoom.id,
          name: assignment.classRoom.name,
          room: {
            name: assignment.classRoom.roomNumber,
            capacity: assignment.classRoom.capacity
          }
        }));
      }
    });

    // Convert Sets back to arrays and parse JSON
    const teacherData = Array.from(subjectGroups.values()).map(group => ({
      subject: group.subject,
      grades: Array.from(group.grades).map((g: unknown) => JSON.parse(g as string))
        .sort((a: any, b: any) => a.level - b.level),
      classrooms: Array.from(group.classrooms).map((c: unknown) => JSON.parse(c as string))
        .sort((a: any, b: any) => a.name.localeCompare(b.name)),
      assignments: group.assignments
    }));

    return NextResponse.json(teacherData);
  } catch (error) {
    console.error('Error fetching teacher subject assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}