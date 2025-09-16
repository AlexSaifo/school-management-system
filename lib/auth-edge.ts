import { jwtVerify } from 'jose';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Edge runtime compatible function to verify JWT tokens
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if verification fails
 */
export async function verifyTokenEdge(token: string | undefined): Promise<{ userId: string; email: string; role: Role } | null> {
  // Handle undefined, null, or empty tokens
  if (!token || typeof token !== 'string') {
    console.error('verifyTokenEdge: Token is undefined or not a string');
    return null;
  }
  
  // Trim the token and check if it's still valid
  const cleanToken = token.trim();
  if (cleanToken === '') {
    console.error('verifyTokenEdge: Token is empty after trimming');
    return null;
  }
  
  try {
    // Create a secret key from the JWT_SECRET
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Verify the token
    const { payload } = await jwtVerify(cleanToken, secret);
    
    // Ensure all required fields exist
    if (!payload.userId || !payload.email || !payload.role) {
      console.error('verifyTokenEdge: Token missing required fields');
      return null;
    }
    
    // Return the decoded token data
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role
    };
  } catch (error) {
    console.error('verifyTokenEdge: Token verification failed:', error);
    return null;
  }
}
