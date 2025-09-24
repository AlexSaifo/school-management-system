import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAttendanceDates() {
  try {
    const attendances = await prisma.attendance.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      select: { date: true, studentId: true }
    });

    console.log('Recent attendance records:');
    attendances.forEach(a => console.log(`${a.date} - ${a.studentId}`));

    // Check date range
    const minDate = await prisma.attendance.aggregate({
      _min: { date: true }
    });
    const maxDate = await prisma.attendance.aggregate({
      _max: { date: true }
    });

    console.log(`Date range: ${minDate._min.date} to ${maxDate._max.date}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendanceDates();