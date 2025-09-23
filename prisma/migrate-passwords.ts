import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient();

// Static secret key for encryption (must match the one used in API)
const SECRET_KEY = 'school-management-secret-key-2025';

// Encryption utility
const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

async function main() {
  console.log('🔐 Migrating existing bcrypt passwords to AES encryption...');

  try {
    // Find all users with bcrypt-hashed passwords (starting with $2a$, $2b$, or $2y$)
    const usersWithBcryptPasswords = await prisma.user.findMany({
      where: {
        password: {
          startsWith: '$2a$',
        },
      },
    });

    console.log(`Found ${usersWithBcryptPasswords.length} users with bcrypt passwords`);

    if (usersWithBcryptPasswords.length === 0) {
      console.log('✅ No bcrypt passwords found. Migration complete.');
      return;
    }

    // Default password for migrated users
    const defaultPassword = 'password123';
    const encryptedDefaultPassword = encryptPassword(defaultPassword);

    // Update all users with bcrypt passwords to use the default AES-encrypted password
    const updateResult = await prisma.user.updateMany({
      where: {
        password: {
          startsWith: '$2a$',
        },
      },
      data: {
        password: encryptedDefaultPassword,
      },
    });

    console.log(`✅ Migrated ${updateResult.count} users to AES encryption`);
    console.log(`📝 Default password set to: ${defaultPassword}`);
    console.log('⚠️  Users will need to change their passwords after logging in');

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