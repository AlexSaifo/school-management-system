import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Syrian grading system helper
function calculateGrade(marksObtained: number, totalMarks: number): string {
  const percentage = (marksObtained / totalMarks) * 100;
  
  if (percentage >= 90) return 'ممتاز (A+)';
  if (percentage >= 80) return 'جيد جداً (A)';
  if (percentage >= 70) return 'جيد (B+)';
  if (percentage >= 60) return 'مقبول (B)';
  if (percentage >= 50) return 'ضعيف (C)';
  return 'راسب (F)';
}

// POST /api/exams/[id]/results - Submit or update exam results
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                 request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { teacher: true }
    });

    if (!user || !['TEACHER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Teachers can only grade their own exams
    if (user.role === 'TEACHER' && exam.teacherId !== user.teacher?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { results } = body; // Array of { studentId, marksObtained, remarks? }

    if (!Array.isArray(results)) {
      return NextResponse.json({ error: 'Results must be an array' }, { status: 400 });
    }

    const processedResults = [];

    for (const result of results) {
      const { studentId, marksObtained, remarks } = result;

      if (!studentId || marksObtained === undefined || marksObtained === null) {
        continue; // Skip invalid entries
      }

      const marks = parseFloat(marksObtained);
      const totalMarksNumber = Number(exam.totalMarks);
      
      if (marks < 0 || marks > totalMarksNumber) {
        return NextResponse.json({ 
          error: `Invalid marks for student ${studentId}. Must be between 0 and ${totalMarksNumber}` 
        }, { status: 400 });
      }

      const grade = calculateGrade(marks, totalMarksNumber);

      // Upsert the result
      const examResult = await prisma.examResult.upsert({
        where: {
          examId_studentId: {
            examId: params.id,
            studentId: studentId
          }
        },
        update: {
          marksObtained: marks,
          grade,
          remarks: remarks || null
        },
        create: {
          examId: params.id,
          studentId: studentId,
          marksObtained: marks,
          grade,
          remarks: remarks || null
        },
        include: {
          student: {
            select: {
              id: true,
              rollNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      processedResults.push(examResult);
    }

    return NextResponse.json({ 
      message: 'Results saved successfully',
      results: processedResults 
    });

  } catch (error) {
    console.error('Error saving exam results:', error);
    return NextResponse.json(
      { error: 'Failed to save results' },
      { status: 500 }
    );
  }
}

// GET /api/exams/[id]/results - Get exam results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                 request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { student: true, teacher: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          select: {
            name: true,
            nameAr: true,
            code: true
          }
        },
        classRoom: {
          select: {
            name: true,
            nameAr: true,
            section: true
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    let whereCondition: any = { examId: params.id };

    // Role-based filtering
    if (user.role === 'STUDENT') {
      if (exam.classRoomId !== user.student?.classRoomId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      whereCondition.studentId = user.student?.id;
    } else if (user.role === 'TEACHER') {
      if (exam.teacherId !== user.teacher?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const results = await prisma.examResult.findMany({
      where: whereCondition,
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          rollNumber: 'asc'
        }
      }
    });

    // Calculate statistics for teachers/admins
    let statistics = null;
    if (['TEACHER', 'ADMIN'].includes(user.role) && results.length > 0) {
      const marks = results.map(r => Number(r.marksObtained));
      const totalMarks = Number(exam.totalMarks);
      
      statistics = {
        totalStudents: results.length,
        averageMarks: marks.reduce((a, b) => a + b, 0) / marks.length,
        averagePercentage: (marks.reduce((a, b) => a + b, 0) / marks.length / totalMarks) * 100,
        highestMarks: Math.max(...marks),
        lowestMarks: Math.min(...marks),
        passedStudents: marks.filter(m => (m / totalMarks) * 100 >= 50).length,
        failedStudents: marks.filter(m => (m / totalMarks) * 100 < 50).length,
        gradeDistribution: {
          'ممتاز (A+)': results.filter(r => r.grade === 'ممتاز (A+)').length,
          'جيد جداً (A)': results.filter(r => r.grade === 'جيد جداً (A)').length,
          'جيد (B+)': results.filter(r => r.grade === 'جيد (B+)').length,
          'مقبول (B)': results.filter(r => r.grade === 'مقبول (B)').length,
          'ضعيف (C)': results.filter(r => r.grade === 'ضعيف (C)').length,
          'راسب (F)': results.filter(r => r.grade === 'راسب (F)').length
        }
      };
    }

    return NextResponse.json({ 
      exam,
      results,
      statistics
    });

  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}