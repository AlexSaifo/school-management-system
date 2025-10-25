import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';
import { AES_SECRET_KEY } from '../lib/config';

const prisma = new PrismaClient();

async function main() {
  console.log('AES secret preview:', AES_SECRET_KEY.substring(0,8)+'...');
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`Found ${users.length} users`);
  console.log('Email | Role | Status | PasswordType | PasswordValid(password123) | Notes');
  
  const usersToFix: { email: string; currentPassword: string }[] = [];
  const resetAll = process.argv.includes('--reset-all');
  
  for (const u of users) {
    let type = 'NONE';
    let valid = 'n/a';
    let notes: string[] = [];
    if (u.password) {
      if (u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$')) {
        type = 'bcrypt';
        notes.push('bcrypt hash present');
      } else {
        type = 'AES';
        // Try decrypt
        try {
          const bytes = CryptoJS.AES.decrypt(u.password, AES_SECRET_KEY);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (decrypted === 'password123') valid = 'yes';
          else if (decrypted === 'student123') valid = 'yes(student default)';
          else if (!decrypted) { 
            notes.push('decryption empty (secret mismatch?)'); 
            usersToFix.push({ email: u.email, currentPassword: u.password });
          }
          else { notes.push(`decrypted='${decrypted}'`); }
        } catch (e) {
          notes.push('AES decrypt failed');
          usersToFix.push({ email: u.email, currentPassword: u.password });
        }
      }
    } else {
      notes.push('no password set');
    }
    console.log(`${u.email} | ${u.role} | ${u.status} | ${type} | ${valid} | ${notes.join('; ')}`);
  }

  // Reset all passwords if --reset-all flag is provided
  if (resetAll) {
    console.log('\n' + '='.repeat(80));
    console.log('Resetting ALL user passwords to default...');
    for (const u of users) {
      let newPassword = 'password123';
      if (u.role === 'STUDENT') newPassword = 'student123';
      const encryptedPassword = CryptoJS.AES.encrypt(newPassword, AES_SECRET_KEY).toString();
      await prisma.user.update({
        where: { email: u.email },
        data: { password: encryptedPassword }
      });
      // Verify
      const bytes = CryptoJS.AES.decrypt(encryptedPassword, AES_SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      const status = decrypted === newPassword ? '✓' : '✗';
      console.log(`${status} ${u.email} - password reset to: ${newPassword}`);
    }
    console.log('\n' + '='.repeat(80));
    console.log('All passwords have been reset to default! Run the script again to verify.\n');
    return;
  }
  
  // Offer to fix users with password issues
  if (usersToFix.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log(`Found ${usersToFix.length} users with password decryption issues:`);
    usersToFix.forEach(u => console.log(`  - ${u.email}`));
    console.log('\nWould you like to reset these passwords to "password123"?');
    console.log('Run with --fix flag to reset: npx tsx scripts/list-users.ts --fix');
    
    // Check if --fix flag is provided
    if (process.argv.includes('--fix')) {
      console.log('\n' + '='.repeat(80));
      console.log('Resetting passwords...\n');
      
      for (const userToFix of usersToFix) {
        const newPassword = 'password123';
        const encryptedPassword = CryptoJS.AES.encrypt(newPassword, AES_SECRET_KEY).toString();
        
        await prisma.user.update({
          where: { email: userToFix.email },
          data: { password: encryptedPassword }
        });
        
        // Verify
        const bytes = CryptoJS.AES.decrypt(encryptedPassword, AES_SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        const status = decrypted === newPassword ? '✓' : '✗';
        console.log(`${status} ${userToFix.email} - password reset to: ${newPassword}`);
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('Password reset complete! Run the script again to verify.\n');
    }
  } else {
    console.log('\nAll users have valid passwords! ✓');
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
