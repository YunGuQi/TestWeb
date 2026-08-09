import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === process.env.ADMIN_LOGIN_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set auth cookie (httpOnly=false and secure=false to prevent reverse proxy/CDN dropping cookie)
      response.cookies.set({
        name: 'admin_token',
        value: 'jiasite_Authorized',
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      return response;
    }

    return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: '登录异常' }, { status: 500 });
  }
}
