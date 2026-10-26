import { test, expect } from '@playwright/test';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

function generateSignature(payload: string, timestamp: number): string {
  const secret = process.env.NEXT_PUBLIC_API_SALT || 'destiny-lover-default-salt-12345';
  const data = timestamp.toString() + payload + secret;
  return crypto.createHash('sha256').update(data).digest('hex');
}

test.describe('Destiny Lover API Submit & Anti-Block Regression Tests', () => {

  test('GET /api/questions?testId=destiny-lover should return 15 questions', async ({ request }) => {
    const timestamp = Date.now();
    const sign = generateSignature('GET_QUESTIONS', timestamp);
    const response = await request.get('/api/questions?testId=destiny-lover', {
      headers: {
        'x-timestamp': timestamp.toString(),
        'x-sign': sign
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.questions).toBeDefined();
    expect(data.questions.length).toBe(15);
  });

  test('POST /api/submit should succeed WITHOUT turnstileToken (graceful degradation for mainland China network)', async ({ request }) => {
    // 1. 初始化并获取 HttpOnly Session Cookie
    const initRes = await request.get('/api/init-test?testId=destiny-lover');
    expect(initRes.ok()).toBeTruthy();
    const cookies = initRes.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies).toContain('test_session=');

    // 2. 模拟真实用户的 15 题答案 (偏向 ldap 组合)
    const answers: Record<string, string> = {
      q1: 'o1_1',  // L
      q2: 'o2_2',  // L
      q3: 'o3_1',  // L
      q4: 'o4_2',  // L
      q5: 'o5_1',  // L
      q6: 'o6_2',  // D
      q7: 'o7_1',  // D
      q8: 'o8_2',  // D
      q9: 'o9_1',  // D
      q10: 'o10_2', // D
      q11: 'o11_1', // A
      q12: 'o12_2', // A
      q13: 'o13_1', // A
      q14: 'o14_2', // A
      q15: 'o15_1'  // A
    };

    const payload = {
      deviceId: 'automated-test-device-001',
      testId: 'destiny-lover',
      answers,
      metadata: { nickname: '云梦', status: 'single' },
      turnstileToken: '' // 模拟国内无法连接 Cloudflare 导致 token 为空的情况
    };

    const timestamp = Date.now();
    const payloadStr = JSON.stringify(payload);
    const signature = generateSignature(payloadStr, timestamp);

    const submitRes = await request.post('/api/submit', {
      headers: {
        'x-timestamp': timestamp.toString(),
        'x-sign': signature,
        'content-type': 'application/json',
        'cookie': cookies
      },
      data: payloadStr
    });

    if (!submitRes.ok()) {
      console.error('Submit failed:', await submitRes.text());
    }

    expect(submitRes.ok()).toBeTruthy();
    const data = await submitRes.json();
    expect(data.success).toBe(true);
    expect(data.recordId).toBeDefined();
    expect(data.result).toBeDefined();
    expect(data.result.title).toBeDefined();
    expect(data.result.key).toBeDefined();
  });

});
