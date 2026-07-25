import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /admin routes and /api/admin routes, but exclude the login routes
  const isProtectedPath = path.startsWith('/admin') || path.startsWith('/api/admin');
  const isLoginPath = path === '/admin/login' || path === '/api/admin/login';

  if (isProtectedPath && !isLoginPath) {
    const token = request.cookies.get('admin_token')?.value;

    if (token !== 'jiasite_Authorized') {
      // If it's an API request, return 401 JSON
      if (path.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
      }
      
      // Otherwise redirect to the admin login page
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};
