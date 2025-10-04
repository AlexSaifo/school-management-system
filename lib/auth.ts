import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
import { JWT_SECRET, AES_SECRET_KEY } from './config';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

// Secrets now sourced from centralized config (lib/config.ts)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  // Check if stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    // Legacy bcrypt hash - use bcrypt comparison
    return bcrypt.compare(password, storedPassword);
  } else {
    // AES encrypted password - decrypt and compare
    try {
      const bytes = CryptoJS.AES.decrypt(storedPassword, AES_SECRET_KEY);
      const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedPassword === password;
    } catch (error) {
      // If decryption fails, password is invalid
      return false;
    }
  }
}

export function generateToken(payload: { userId: string; email: string; role: Role }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verifies a JWT token and returns the decoded payload or null if invalid
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if verification fails
 */
export function verifyToken(token: string | undefined): { userId: string; email: string; role: Role } | null {
  // Handle undefined, null, or empty tokens
  if (!token || typeof token !== 'string') {
    console.error('verifyToken: Token is undefined or not a string');
    return null;
  }
  
  // Trim the token and check if it's still valid
  const cleanToken = token.trim();
  if (cleanToken === '') {
    console.error('verifyToken: Token is empty after trimming');
    return null;
  }
  
  try {
    // Log only the first few characters of the secret for debugging
    console.log('verifyToken: Attempting to verify token with secret:', 
      JWT_SECRET?.substring(0, 10) + '...');
    
    // Verify the token
    const decoded = jwt.verify(cleanToken, JWT_SECRET) as { 
      userId: string; 
      email: string; 
      role: Role 
    };
    
    // Check if decoded token has all required fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      console.error('verifyToken: Token missing required fields');
      return null;
    }
    
    console.log('verifyToken: Token verified successfully for user:', decoded.email);
    return decoded;
  } catch (error) {
    console.error('verifyToken: Token verification failed:', error);
    return null;
  }
}

export function getRolePermissions(role: Role) {
  const permissions = {
    ADMIN: {
      canManageUsers: true,
      canManageClasses: true,
      canViewReports: true,
      canManageSystem: true,
      canViewAllStudents: true,
      canViewAllTeachers: true,
      canViewAllParents: true,
    },
    TEACHER: {
      canManageUsers: false,
      canManageClasses: true,
      canViewReports: true,
      canManageSystem: false,
      canViewAllStudents: false,
      canViewAllTeachers: false,
      canViewAllParents: false,
      canMarkAttendance: true,
      canGradeStudents: true,
    },
    STUDENT: {
      canManageUsers: false,
      canManageClasses: false,
      canViewReports: false,
      canManageSystem: false,
      canViewAllStudents: false,
      canViewAllTeachers: false,
      canViewAllParents: false,
      canViewOwnGrades: true,
      canViewOwnAttendance: true,
    },
    PARENT: {
      canManageUsers: false,
      canManageClasses: false,
      canViewReports: false,
      canManageSystem: false,
      canViewAllStudents: false,
      canViewAllTeachers: false,
      canViewAllParents: false,
      canViewChildGrades: true,
      canViewChildAttendance: true,
    },
  };

  return permissions[role as keyof typeof permissions] || {};
}
