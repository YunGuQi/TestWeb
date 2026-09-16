import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { redis } from '../../../../lib/redis';

// 使用环境变量中的密钥，如果未配置则使用一个长且随机的回退密钥（但不建议在生产环境使用回退）
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod_1234567890';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const lockKey = `admin_login_fail:${ip}`;

    // 检查是否已被临时锁定（15分钟内最多允许5次错误尝试）
    try {
      const failCount = await redis.get(lockKey);
      if (failCount && parseInt(failCount, 10) >= 5) {
        return NextResponse.json({
          success: false,
          error: '登录失败次数过多，请 15 分钟后再试'
        }, { status: 429 });
      }
    } catch (redisErr) {
      // Redis 连接异常时优雅降级
    }

    const { password } = await request.json();

    const correctPassword = process.env.ADMIN_LOGIN_PASSWORD || 'jiasite';
    if (password === correctPassword) {
      // 登录成功，清除失败计数
      try {
        await redis.del(lockKey);
      } catch (e) {}

      const response = NextResponse.json({ success: true });
      
      // 生成 JWT
      const secret = new TextEncoder().encode(JWT_SECRET);
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

      // 设置 auth cookie，将 httpOnly 改为 true 提升安全性
      response.cookies.set({
        name: 'admin_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      return response;
    }

    // 密码错误：累加失败计数并设置 15 分钟（900秒）过期
    try {
      const currentFails = await redis.incr(lockKey);
      if (currentFails === 1) {
        await redis.expire(lockKey, 900);
      }
      const remain = Math.max(0, 5 - currentFails);
      return NextResponse.json({
        success: false,
        error: remain > 0 ? `密码错误，还可尝试 ${remain} 次` : '密码错误过多，账号已锁定 15 分钟'
      }, { status: 401 });
    } catch (e) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: '登录异常' }, { status: 500 });
  }
}

