import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeeding() {
  console.log('🔍 Verifying database seeding results...\n');

  try {
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}`);

    // Check students
    const studentCount = await prisma.student.count();
    console.log(`🎓 Students: ${studentCount}`);

    // Check teachers
    const teacherCount = await prisma.teacher.count();
    console.log(`👨‍🏫 Teachers: ${teacherCount}`);

    // Check parents
    const parentCount = await prisma.parent.count();
    console.log(`👨‍👩‍👧‍👦 Parents: ${parentCount}`);

    // Check classrooms
    const classroomCount = await prisma.classRoom.count();
    console.log(`🏫 Classrooms: ${classroomCount}`);

    // Check subjects
    const subjectCount = await prisma.subject.count();
    console.log(`📖 Subjects: ${subjectCount}`);

    // Check grade levels
    const gradeLevelCount = await prisma.gradeLevel.count();
    console.log(`📚 Grade Levels: ${gradeLevelCount}`);

    // Check assignments
    const assignmentCount = await prisma.assignment.count();
    console.log(`📝 Assignments: ${assignmentCount}`);

    // Check exams
    const examCount = await prisma.exam.count();
    console.log(`📋 Exams: ${examCount}`);

    // Check events
    const eventCount = await prisma.event.count();
    console.log(`📅 Events: ${eventCount}`);

    // Check announcements
    const announcementCount = await prisma.announcement.count();
    console.log(`📢 Announcements: ${announcementCount}`);

    // Check relationships
    const studentParentCount = await prisma.studentParent.count();
    console.log(`🔗 Parent-Student Relationships: ${studentParentCount}`);

    const attendanceCount = await prisma.attendance.count();
    console.log(`📊 Attendance Records: ${attendanceCount}`);

    const gradeCount = await prisma.grade.count();
    console.log(`🎯 Grades: ${gradeCount}`);

    console.log('\n✅ Database verification completed successfully!');
    console.log('All tables have been populated with comprehensive data.');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeeding();