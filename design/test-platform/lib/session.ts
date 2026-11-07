import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod_1234567890';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  participantId: string;
  testId?: string;
  [key: string]: any;
}

// 签发 Token，设定过期时间为 2 小时，适合一般心理测试
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey);
}

// 校验 Token 并返回 payload
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as SessionPayload;
  } catch (err) {
    return null;
  }
}
