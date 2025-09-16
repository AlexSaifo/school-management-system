const { PrismaClient } = require('@prisma/client');

async function getCorrectAdminIds() {
  const prisma = new PrismaClient();
  
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      include: {
        admin: true
      }
    });
    
    console.log('Admin data mapping:');
    admins.forEach(admin => {
      console.log(`User ID: ${admin.id}`);
      console.log(`Admin ID: ${admin.admin?.id || 'N/A'}`);
      console.log(`Email: ${admin.email}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCorrectAdminIds();
