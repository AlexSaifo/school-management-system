import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.notification.count();
    console.log('Notifications count:', count);
    const userNotifs = await prisma.userNotification.count();
    console.log('UserNotifications count:', userNotifs);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();