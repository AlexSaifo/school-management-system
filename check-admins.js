const { PrismaClient } = require('@prisma/client');

async function checkAdmins() {
  const prisma = new PrismaClient();
  
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });
    
    console.log('Admins found:');
    console.log(JSON.stringify(admins, null, 2));
    
    // Also check if the specific ID exists
    const specificAdmin = await prisma.user.findUnique({
      where: { id: 'cmfedx90m0003ozum24cmf0vl' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });
    
    console.log('\nSpecific admin check:');
    console.log(JSON.stringify(specificAdmin, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
