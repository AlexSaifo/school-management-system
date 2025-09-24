import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRelationships() {
  try {
    const students = await prisma.student.findMany({
      take: 3,
      include: { classRoom: true }
    });
    console.log('Students with classes:');
    students.forEach(s => console.log(`${s.id} - ${s.classRoomId} - ${s.classRoom?.name}`));

    const attendances = await prisma.attendance.findMany({ take: 3 });
    console.log('Attendance records:');
    attendances.forEach(a => console.log(`${a.studentId} - ${a.classRoomId} - ${a.date}`));

    // Check if attendance records match students
    const studentIds = students.map(s => s.id);
    const matchingAttendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds }
      },
      take: 5
    });
    console.log(`Found ${matchingAttendances.length} attendance records for these students`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationships();