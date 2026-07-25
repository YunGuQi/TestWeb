import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === 'jiasite') {
      const response = NextResponse.json({ success: true });
      
      // Set HttpOnly cookie for auth
      response.cookies.set({
        name: 'admin_token',
        value: 'jiasite_Authorized',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
