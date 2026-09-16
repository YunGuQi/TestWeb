import { NextResponse } from 'next/server';
import { signSessionToken } from '../../../lib/session';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let testId = 'emotional-friction';
    try {
      if (rawBody) {
        const body = JSON.parse(rawBody);
        testId = body.testId || testId;
      }
    } catch (e) {}

    // 生成基于时间的唯一 Participant ID，防冲突且无需依赖前端指纹
    const participantId = `pid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 签发 Token，时长由业务情况决定，默认 2 小时
    const token = await signSessionToken({ participantId, testId });

    const response = NextResponse.json({
      success: true,
      participantId // 可选返回，用于前端可能需要的非敏感展示
    });

    // 设置 HttpOnly Cookie，防止前端 JS 窃取，大幅提升防 XSS 及串号安全性
    response.cookies.set({
      name: 'test_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 60 * 60 // 2 hours
    });

    return response;
  } catch (error: any) {
    console.error('Init test error:', error);
    return NextResponse.json({ success: false, error: '初始化会话失败' }, { status: 500 });
  }
}

// 支持 GET 以便某些场景直接调用
export async function GET(request: Request) {
  const url = new URL(request.url);
  const testId = url.searchParams.get('testId') || 'emotional-friction';

  const participantId = `pid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const token = await signSessionToken({ participantId, testId });

  const response = NextResponse.json({
    success: true
  });

  response.cookies.set({
    name: 'test_session',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60
  });

  return response;
}
