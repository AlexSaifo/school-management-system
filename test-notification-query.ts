import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    const userId = 'cmhgqstvc000u8vwhk4x4y461'; // from token
    const type: string[] | undefined = undefined;
    const priority: string[] | undefined = undefined;
    const isRead = undefined;
    const limit = 20;
    const offset = 0;

    const userNotifications = await prisma.userNotification.findMany({
      where: {
        userId: userId,
        ...(isRead !== undefined && { isRead }),
        notification: {
          AND: [
            ...(type && type.length > 0 ? [{ type: { in: type } }] : []),
            ...(priority && priority.length > 0 ? [{ priority: { in: priority } }] : []),
          ],
        },
      },
      include: {
        notification: true,
      },
      orderBy: {
        notification: {
          createdAt: 'desc',
        },
      },
      skip: offset,
      take: limit,
    });

    console.log('Found notifications:', userNotifications.length);
    console.log(userNotifications);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();