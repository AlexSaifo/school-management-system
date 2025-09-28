const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('=== TEACHERS ===');
    const teachers = await prisma.teacher.findMany({
      include: {
        teacherSubjects: {
          include: { subject: true }
        },
        user: true
      }
    });

    teachers.forEach(teacher => {
      console.log(`Teacher: ${teacher.user.firstName} ${teacher.user.lastName}`);
      console.log(`  Subjects: ${teacher.teacherSubjects.map(ts => ts.subject.name).join(', ') || 'NONE'}`);
      console.log(`  Employee ID: ${teacher.employeeId}`);
      console.log('');
    });

    console.log('=== SUBJECTS ===');
    const subjects = await prisma.subject.findMany({
      where: { isActive: true }
    });
    console.log(`Total active subjects: ${subjects.length}`);
    subjects.forEach(subject => {
      console.log(`  ${subject.name} (${subject.code})`);
    });

    console.log('\n=== CLASSROOMS ===');
    const classrooms = await prisma.classRoom.findMany({
      where: { isActive: true },
      include: { gradeLevel: true }
    });
    console.log(`Total active classrooms: ${classrooms.length}`);
    classrooms.forEach(classroom => {
      console.log(`  ${classroom.name} - ${classroom.gradeLevel?.name || 'No grade'}`);
    });

    console.log('\n=== TIMETABLE ENTRIES ===');
    const timetable = await prisma.timetable.findMany({
      include: {
        teacher: { include: { user: true } },
        subject: true,
        classRoom: { include: { gradeLevel: true } }
      }
    });
    console.log(`Total timetable entries: ${timetable.length}`);
    timetable.forEach(entry => {
      console.log(`  ${entry.teacher.user.firstName} ${entry.teacher.user.lastName} - ${entry.subject.name} - ${entry.classRoom.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();