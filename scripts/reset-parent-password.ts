import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';
import { AES_SECRET_KEY } from '../lib/config';

const prisma = new PrismaClient();

async function main() {
  const email = 'parent@school.com';
  const newPassword = 'password123';
  
  console.log('Resetting password for:', email);
  console.log('New password:', newPassword);
  console.log('AES secret preview:', AES_SECRET_KEY.substring(0,8)+'...');
  
  // Encrypt the new password
  const encryptedPassword = CryptoJS.AES.encrypt(newPassword, AES_SECRET_KEY).toString();
  
  // Update the user
  const user = await prisma.user.update({
    where: { email },
    data: { password: encryptedPassword }
  });
  
  console.log('Password updated successfully for:', user.email);
  
  // Verify the password
  const bytes = CryptoJS.AES.decrypt(user.password!, AES_SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  console.log('Verification - Decrypted password:', decrypted);
  console.log('Match:', decrypted === newPassword ? 'YES ✓' : 'NO ✗');
}

main()
  .catch(e => { 
    console.error('Error:', e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });
