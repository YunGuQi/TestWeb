import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the admin token cookie
  response.cookies.set({
    name: 'admin_token',
    value: '',
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Expire immediately
  });
  
  return response;
}
