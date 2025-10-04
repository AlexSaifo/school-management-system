// Centralized configuration for secrets and other constants
// Ensures encryption/decryption logic uses the SAME key across app + migration scripts

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// IMPORTANT: This must match the key used when encrypting existing passwords.
// In migration scripts previously this was hard-coded as 'school-management-secret-key-2025'.
// Provide it via environment variable AES_SECRET_KEY to avoid future mismatch.
export const AES_SECRET_KEY = process.env.AES_SECRET_KEY || 'school-management-secret-key-2025';

export function summarizeConfigForDebug() {
  return {
    jwtSecretSet: !!process.env.JWT_SECRET,
    aesSecretSet: !!process.env.AES_SECRET_KEY,
    jwtPreview: JWT_SECRET.substring(0, 6) + '...' ,
    aesPreview: AES_SECRET_KEY.substring(0, 6) + '...'
  };
}
