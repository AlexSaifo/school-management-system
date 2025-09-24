import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGradeDates() {
  try {
    const grades = await prisma.grade.findMany({
      take: 10,
      orderBy: { examDate: 'desc' },
      select: { examDate: true, studentId: true, marks: true }
    });

    console.log('Recent grade records:');
    grades.forEach(g => console.log(`${g.examDate} - ${g.studentId} - ${g.marks}`));

    // Check date range
    const minDate = await prisma.grade.aggregate({
      _min: { examDate: true }
    });
    const maxDate = await prisma.grade.aggregate({
      _max: { examDate: true }
    });

    console.log(`Grade date range: ${minDate._min.examDate} to ${maxDate._max.examDate}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGradeDates();