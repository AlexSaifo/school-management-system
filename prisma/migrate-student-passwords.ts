import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient();

// Static secret key for encryption (must match the one used in API)
const SECRET_KEY = 'school-management-secret-key-2025';

const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

async function main() {
  console.log('🔐 Setting default passwords for existing students...');

  try {
    // Find all students who don't have passwords set
    const studentsWithoutPasswords = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { password: null },
          { password: '' }
        ]
      },
      include: {
        student: true
      }
    });

    console.log(`Found ${studentsWithoutPasswords.length} students without passwords`);

    if (studentsWithoutPasswords.length === 0) {
      console.log('✅ All students already have passwords set.');
      return;
    }

    // Default password for students
    const defaultPassword = 'student123';
    const encryptedDefaultPassword = encryptPassword(defaultPassword);

    // Update all students without passwords
    const updateResult = await prisma.user.updateMany({
      where: {
        role: 'STUDENT',
        OR: [
          { password: null },
          { password: '' }
        ]
      },
      data: {
        password: encryptedDefaultPassword,
      },
    });

    console.log(`✅ Set default passwords for ${updateResult.count} students`);
    console.log(`📝 Default password set to: ${defaultPassword}`);
    console.log('⚠️  Students should change their passwords after logging in');

  } catch (error) {
    console.error('❌ Error during password migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });