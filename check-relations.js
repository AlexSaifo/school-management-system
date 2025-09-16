import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkParentStudentRelations() {
  try {
    // Check all parent-student relationships
    const relations = await prisma.studentParent.findMany({
      include: {
        student: {
          include: {
            user: true
          }
        },
        parent: {
          include: {
            user: true
          }
        }
      }
    });

    console.log('Found', relations.length, 'parent-student relationships:');
    relations.forEach(r => {
      console.log(`Parent: ${r.parent.user.firstName} ${r.parent.user.lastName} -> Student: ${r.student.user.firstName} ${r.student.user.lastName} (${r.student.user.id})`);
    });

    // Check if the problematic ID exists in any relationships
    const problematicRelations = await prisma.studentParent.findMany({
      where: {
        OR: [
          { studentId: 'cmfipxvaz000o10r0logero1u' },
          { parentId: 'cmfipxvaz000o10r0logero1u' }
        ]
      }
    });

    console.log('\nRelations with problematic ID:');
    if (problematicRelations.length > 0) {
      problematicRelations.forEach(r => {
        console.log('Found relation:', r);
      });
    } else {
      console.log('No relations found with the problematic ID');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParentStudentRelations();