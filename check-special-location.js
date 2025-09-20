const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function main() {
  try {
    console.log('Checking special location with ID: cmfoml3lt001lv2a8bmcarczn');
    const location = await prisma.specialLocation.findUnique({
      where: {
        id: 'cmfoml3lt001lv2a8bmcarczn'
      }
    });

    if (location) {
      console.log('Special location found:');
      console.log(location);
    } else {
      console.log('Special location NOT found');
      
      // List all special locations to help identify the correct ID
      console.log('Listing all special locations:');
      const allLocations = await prisma.specialLocation.findMany();
      allLocations.forEach(loc => {
        console.log(`ID: ${loc.id} - Name: ${loc.name} (${loc.nameAr})`);
      });
    }
  } catch (error) {
    console.error('Error checking special location:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();