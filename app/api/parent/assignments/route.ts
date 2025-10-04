import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    let token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'No token provided' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    if (decoded.role !== 'PARENT' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ error: 'studentId is required' }, { status: 400 });

    // Verify relationship
    const relation = await prisma.studentParent.findFirst({
      where: { parent: { userId: decoded.userId }, studentId },
      include: { student: true }
    });
    if (!relation) return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });

    if (!relation.student.classRoomId) {
      return NextResponse.json({ assignments: [] });
    }

    const assignments = await prisma.assignment.findMany({
      where: { classRoomId: relation.student.classRoomId, isActive: true },
      include: { subject: true, submissions: { where: { studentId } } },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const result = assignments.map(a => {
      const submission = a.submissions[0];
      let status: 'PENDING' | 'SUBMITTED' | 'LATE' = 'PENDING';
      if (submission) status = 'SUBMITTED';
      else if (a.dueDate < now) status = 'LATE';
      return {
        id: a.id,
        title: a.title,
        subject: a.subject?.name || 'Unknown',
        dueDate: a.dueDate.toISOString(),
        status,
        marks: submission?.marksObtained ? Number(submission.marksObtained) : undefined,
        totalMarks: Number(a.totalMarks)
      };
    });

    return NextResponse.json({ success: true, assignments: result });
  } catch (error) {
    console.error('Error fetching parent assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
