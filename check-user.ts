import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'cmghqstvc000u8vwhk4x4y461' }
    });
    console.log('User:', user ? 'exists' : 'not found');
    if (user) {
      console.log('Role:', user.role);
      console.log('Email:', user.email);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();