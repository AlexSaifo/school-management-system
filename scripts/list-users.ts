import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';
import { AES_SECRET_KEY } from '../lib/config';

const prisma = new PrismaClient();

async function main() {
  console.log('AES secret preview:', AES_SECRET_KEY.substring(0,8)+'...');
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`Found ${users.length} users`);
  console.log('Email | Role | Status | PasswordType | PasswordValid(password123) | Notes');
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
          else if (!decrypted) { notes.push('decryption empty (secret mismatch?)'); }
          else { notes.push(`decrypted='${decrypted}'`); }
        } catch (e) {
          notes.push('AES decrypt failed');
        }
      }
    } else {
      notes.push('no password set');
    }
    console.log(`${u.email} | ${u.role} | ${u.status} | ${type} | ${valid} | ${notes.join('; ')}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
