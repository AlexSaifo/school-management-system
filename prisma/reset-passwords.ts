import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient();

// Static secret key for encryption (must match the one used in API)
const SECRET_KEY = process.env.AES_SECRET_KEY || 'your-secret-key-here';

console.log('Using SECRET_KEY:', SECRET_KEY);

// Encryption utility
const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

// Decryption utility for verification
const decryptPassword = (encryptedPassword: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return 'DECRYPTION_FAILED';
  }
};

async function main() {
  console.log('🔐 Resetting passwords for all user accounts...');

  try {
    // Default password for all users
    const defaultPassword = 'password123';
    const encryptedDefaultPassword = encryptPassword(defaultPassword);

    console.log(`📝 Default password will be set to: ${defaultPassword}`);
    console.log(`🔒 Encrypted password: ${encryptedDefaultPassword}`);

    // Verify decryption works
    const decryptedTest = decryptPassword(encryptedDefaultPassword);
    console.log(`✅ Decryption test: ${decryptedTest === defaultPassword ? 'SUCCESS' : 'FAILED'}`);

    // Get count of all users before update
    const totalUsers = await prisma.user.count();
    console.log(`👥 Total users in system: ${totalUsers}`);

    // Get breakdown by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    console.log('📊 Current user breakdown:');
    roleCounts.forEach(roleCount => {
      console.log(`  ${roleCount.role}: ${roleCount._count.role} users`);
    });

    // Update all users with the default encrypted password
    const updateResult = await prisma.user.updateMany({
      data: {
        password: encryptedDefaultPassword,
      },
    });

    console.log(`✅ Successfully reset passwords for ${updateResult.count} users`);
    console.log(`📝 All users now have password: ${defaultPassword}`);
    console.log('⚠️  Users should change their passwords after first login');

    // Verify a few users were updated correctly
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
      },
    });

    console.log('\n🔍 Verification - Sample users:');
    sampleUsers.forEach(user => {
      const decrypted = user.password ? decryptPassword(user.password) : 'NULL_PASSWORD';
      console.log(`  ${user.role} - ${user.email}: ${decrypted === defaultPassword ? '✅ OK' : decrypted === 'NULL_PASSWORD' ? '⚠️ NULL' : '❌ FAILED'}`);
    });

  } catch (error) {
    console.error('❌ Error during password reset:', error);
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