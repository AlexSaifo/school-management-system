import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudents() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        student: {
          include: {
            classRoom: {
              include: {
                gradeLevel: true
              }
            }
          }
        }
      }
    });

    console.log('Found', students.length, 'students:');
    students.forEach(s => {
      console.log('ID:', s.id, 'Name:', s.firstName, s.lastName, 'Student ID:', s.student?.studentId);
    });

    // Also check if the specific ID exists
    const specificStudent = await prisma.user.findFirst({
      where: {
        id: 'cmfipxvaz000o10r0logero1u',
        role: 'STUDENT'
      }
    });

    console.log('\nSpecific student ID check:');
    if (specificStudent) {
      console.log('Student found:', specificStudent.firstName, specificStudent.lastName);
    } else {
      console.log('Student with ID cmfipxvaz000o10r0logero1u not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();