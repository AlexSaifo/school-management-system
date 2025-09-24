import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const timetableCount = await prisma.timetable.count();
    console.log('Timetables:', timetableCount);

    const attendanceCount = await prisma.attendance.count();
    console.log('Attendance:', attendanceCount);

    const gradeCount = await prisma.grade.count();
    console.log('Grades:', gradeCount);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();