import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function letterGrade(percentage: number) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

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
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Verify relationship between parent and student
    const relation = await prisma.studentParent.findFirst({
      where: { parent: { userId: decoded.userId }, studentId },
      include: { student: { include: { user: true } } }
    });
    if (!relation) return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });

    // Query both legacy Grade table and ExamResult table
    const legacyGrades = await prisma.grade.findMany({
      where: { studentId },
      include: { subject: true },
      orderBy: { examDate: 'desc' }
    });

    const examResults = await prisma.examResult.findMany({
      where: { studentId },
      include: { 
        exam: { 
          include: { 
            subject: true 
          } 
        } 
      },
      orderBy: { exam: { examDate: 'desc' } }
    });

    // Map legacy grades
    const legacyPerformance = legacyGrades.map(g => {
      const marks = Number(g.marks);
      const total = Number(g.totalMarks);
      const percentage = total > 0 ? Math.round((marks / total) * 10000) / 100 : 0;
      return {
        subject: g.subject?.name || 'Unknown',
        marks, totalMarks: total,
        examType: g.examType,
        date: g.examDate.toISOString().split('T')[0],
        percentage,
        grade: letterGrade(percentage)
      };
    });

    // Map exam results
    const examPerformance = examResults.map(r => {
      const marks = Number(r.marksObtained);
      const total = Number(r.exam.totalMarks);
      const percentage = total > 0 ? Math.round((marks / total) * 10000) / 100 : 0;
      return {
        subject: r.exam.subject?.name || 'Unknown',
        marks, 
        totalMarks: total,
        examType: r.exam.title, // Using exam title as exam type
        date: r.exam.examDate.toISOString().split('T')[0],
        percentage,
        grade: r.grade || letterGrade(percentage) // Use stored grade if available, otherwise calculate
      };
    });

    // Combine both sources and sort by date
    const performance = [...legacyPerformance, ...examPerformance]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, performance });
  } catch (error) {
    console.error('Error fetching parent grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
