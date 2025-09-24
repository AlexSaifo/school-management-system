import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateAttendanceData() {
  console.log('Generating attendance data...');

  try {
    // Get all students with their classes
    const students = await prisma.student.findMany({
      include: {
        classRoom: {
          include: {
            classTeacher: true
          }
        }
      }
    });

    console.log(`Found ${students.length} students`);

    // Get timetables
    const timetables = await prisma.timetable.findMany();
    console.log(`Found ${timetables.length} timetables`);

    const attendanceRecords = [];
    const startDate = new Date('2024-09-01');
    const endDate = new Date('2024-09-15'); // Just 2 weeks for testing

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const student of students) {
        if (!student.classRoom || !student.classRoom.classTeacher) continue;

        // Random attendance status (85% present, 10% late, 5% absent)
        const random = Math.random();
        let status = 'PRESENT';
        if (random > 0.85 && random <= 0.95) status = 'LATE';
        else if (random > 0.95) status = 'ABSENT';

        attendanceRecords.push({
          studentId: student.id,
          teacherId: student.classRoom.classTeacherId!,
          classRoomId: student.classRoom.id,
          date: new Date(date),
          status: status as any,
          remarks: status === 'LATE' ? 'متأخر' : status === 'ABSENT' ? 'غائب' : null
        });
      }
    }

    console.log(`Generated ${attendanceRecords.length} attendance records`);

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      await prisma.attendance.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log('✅ Attendance data generated successfully!');

  } catch (error) {
    console.error('Error generating attendance data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateAttendanceData();