import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and API routes (since APIs have their own auth)
  if (pathname.startsWith('/api/') || 
      pathname === '/' || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/')) {
    return NextResponse.next();
  }

  // Check for protected routes (dashboard and all main app routes)
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/users') ||
      pathname.startsWith('/academic') ||
      pathname.startsWith('/assignments') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/attendance') ||
      pathname.startsWith('/reports') ||
      pathname.startsWith('/events') ||
      pathname.startsWith('/announcements') ||
      pathname.startsWith('/profile')) {
    
    // Get token from multiple sources
    let token: string | undefined;
    
    // Try cookie first - this is the most reliable method for client-side navigation
    const cookieToken = request.cookies.get('auth_token')?.value;
    if (cookieToken && cookieToken.trim() !== '') {
      token = cookieToken;
    }
    
    // If no valid cookie token, check authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
        const headerToken = authHeader.substring(7).trim();
        if (headerToken !== '') {
          token = headerToken;
        }
      }
    }

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const decoded = await verifyTokenEdge(token);
      
      if (!decoded) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Role-based route protection
      const userRole = decoded.role;
      
      // Admin-only routes
      if ((pathname.startsWith('/users') || 
           pathname.startsWith('/users/admins') ||
           pathname.startsWith('/users/teachers') ||
           pathname.startsWith('/users/students') ||
           pathname.startsWith('/users/parents')) && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (pathname.startsWith('/reports') && userRole !== 'ADMIN' && userRole !== 'TEACHER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (pathname.startsWith('/events') && userRole !== 'ADMIN' && userRole !== 'TEACHER' && userRole !== 'STUDENT') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (pathname.startsWith('/announcements') && userRole !== 'ADMIN' && userRole !== 'TEACHER' && userRole !== 'STUDENT') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (pathname.startsWith('/timetable')) {
        // Allow teachers to access /timetable/teachers only
        if (pathname === '/timetable/teachers' && userRole === 'TEACHER') {
          return NextResponse.next();
        }
        // Allow admins to access all timetable routes
        if (userRole === 'ADMIN') {
          return NextResponse.next();
        }
        // Redirect others away from timetable routes
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Teacher and Student routes
      if (pathname.startsWith('/assignments')) {
        if (userRole !== 'TEACHER' && userRole !== 'STUDENT' && userRole !== 'ADMIN') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      // All authenticated users can access profile, attendance, exams
      return NextResponse.next();

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
