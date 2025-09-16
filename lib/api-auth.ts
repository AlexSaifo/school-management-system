import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

type AuthResult = {
  success: boolean;
  response?: NextResponse;
  auth?: {
    userId: string;
    email: string;
    role: Role;
  };
};

/**
 * A utility function to handle authentication for API routes
 * @param request The Next.js request object
 * @param requireAdmin Whether admin privileges are required
 * @returns An object with auth data or an error response
 */
export async function handleApiAuth(
  request: NextRequest,
  requireAdmin: boolean = false
): Promise<AuthResult> {
  try {
    // First check if there's a cookie token
    const cookieToken = request.cookies.get('auth_token')?.value;
    
    // Then check for auth header
    let headerToken: string | undefined;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      headerToken = authHeader.substring(7);
    }
    
    // Try cookie token first, then header token
    let auth = null;
    if (cookieToken) {
      auth = verifyToken(cookieToken);
    }
    
    // If cookie token failed, try header token
    if (!auth && headerToken) {
      auth = verifyToken(headerToken);
    }
    
    // If no valid token, return unauthorized
    if (!auth) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }
    
    // If admin access required, check role
    if (requireAdmin && auth.role !== 'ADMIN') {
      return {
        success: false,
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      };
    }
    
    // Authentication successful
    return {
      success: true,
      auth
    };
  } catch (error) {
    console.error('API Authentication error:', error);
    return {
      success: false,
      response: NextResponse.json({ error: 'Authentication error' }, { status: 500 })
    };
  }
}
