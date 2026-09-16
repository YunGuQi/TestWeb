import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod_1234567890';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /ops-dashboard routes and /api/admin routes, but exclude the login routes
  const isProtectedPath = path.startsWith('/ops-dashboard') || path.startsWith('/api/admin');
  const isLoginPath = path === '/ops-login' || path === '/api/admin/login';

  const response = NextResponse.next();

  // 添加全局基础安全响应头
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (isProtectedPath && !isLoginPath) {
    const token = request.cookies.get('admin_token')?.value;

    let isAuthorized = false;

    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        // 使用 jose 解密验证 JWT
        await jwtVerify(token, secret);
        isAuthorized = true;
      } catch (err) {
        // Token verification failed (过期或被篡改或还是旧版的明文 token)
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      // If it's an API request, return 401 JSON
      if (path.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
      }
      
      // Otherwise redirect to the admin login page
      return NextResponse.redirect(new URL('/ops-login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // 匹配所有的路由，但不包括静态文件、图片等资源
    '/((?!_next/static|_next/image|favicon.ico|images|favicon).*)',
  ]
};
