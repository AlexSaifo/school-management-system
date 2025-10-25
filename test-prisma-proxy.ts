import { prisma } from '@/lib/prisma';

async function run() {
  try {
    console.log('Has userNotification accessor:', (prisma as any).userNotification !== undefined);
    const results = await (prisma as any).userNotification.findMany({ where: { userId: 'cmghqstvc000u8vwhk4x4y461' }, take: 5 });
    console.log('findMany returned length:', Array.isArray(results) ? results.length : typeof results, results);
  } catch (error) {
    console.error('Error calling proxy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();