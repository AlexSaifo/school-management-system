import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRelations() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'cmghqstvc000u8vwhk4x4y461' },
      include: {
        admin: true,
        teacher: true,
        student: true,
        parent: true
      }
    });
    console.log('User role:', user?.role);
    console.log('Admin:', user?.admin ? 'exists' : 'null');
    console.log('Teacher:', user?.teacher ? 'exists' : 'null');
    console.log('Student:', user?.student ? 'exists' : 'null');
    console.log('Parent:', user?.parent ? 'exists' : 'null');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelations();