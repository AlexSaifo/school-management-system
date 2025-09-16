import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOrphanedRelations() {
  try {
    console.log('Cleaning up orphaned parent-student relationships...');

    // Find all relationships
    const allRelations = await prisma.studentParent.findMany();

    console.log('Found', allRelations.length, 'total relationships');

    let cleanedCount = 0;

    for (const relation of allRelations) {
      // Check if parent exists
      const parentExists = await prisma.user.findFirst({
        where: {
          id: relation.parentId,
          role: 'PARENT'
        }
      });

      // Check if student exists
      const studentExists = await prisma.user.findFirst({
        where: {
          id: relation.studentId,
          role: 'STUDENT'
        }
      });

      if (!parentExists || !studentExists) {
        console.log(`Removing orphaned relationship: Parent ID ${relation.parentId} (${parentExists ? 'exists' : 'missing'}) -> Student ID ${relation.studentId} (${studentExists ? 'exists' : 'missing'})`);

        await prisma.studentParent.delete({
          where: { id: relation.id }
        });

        cleanedCount++;
      }
    }

    console.log(`\nCleanup complete! Removed ${cleanedCount} orphaned relationships.`);

    // Verify cleanup
    const remainingRelations = await prisma.studentParent.findMany({
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

    console.log('\nRemaining valid relationships:');
    remainingRelations.forEach(r => {
      console.log(`Parent: ${r.parent.user.firstName} ${r.parent.user.lastName} -> Student: ${r.student.user.firstName} ${r.student.user.lastName}`);
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphanedRelations();