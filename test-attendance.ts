import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAttendance() {
  try {
    const students = await prisma.student.findMany({ take: 1 });
    const teachers = await prisma.teacher.findMany({ take: 1 });
    const classes = await prisma.classRoom.findMany({ take: 1 });
    const timetables = await prisma.timetable.findMany({ take: 1 });

    console.log('Students:', students.length);
    console.log('Teachers:', teachers.length);
    console.log('Classes:', classes.length);
    console.log('Timetables:', timetables.length);

    if (students.length && teachers.length && classes.length && timetables.length) {
      const attendance = await prisma.attendance.create({
        data: {
          studentId: students[0].id,
          teacherId: teachers[0].id,
          classRoomId: classes[0].id,
          timetableId: timetables[0].id,
          date: new Date('2024-09-01'),
          status: 'PRESENT'
        }
      });
      console.log('Created attendance:', attendance.id);
    } else {
      console.log('Missing required data');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAttendance();