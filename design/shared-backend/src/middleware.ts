import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // 默认账号密码，强烈建议在上线时通过环境变量注入
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Jiasite00';

    if (user === adminUser && pwd === adminPassword) {
      return NextResponse.next();
    }
  }

  // 账号密码不匹配或未输入，拦截并要求认证
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Admin Area"',
    },
  });
}

export const config = {
  // 只保护 /admin 开头的页面和 /api/admin 开头的接口
  // C端普通用户访问的 /api/submit 和 /api/verify 不受影响
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
