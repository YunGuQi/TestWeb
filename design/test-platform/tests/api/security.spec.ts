import { test, expect } from '@playwright/test';
import { generateSignature } from '../../lib/security';

test.describe('Test Platform Security API', () => {
  test('should initialize test and return HttpOnly Cookie', async ({ request }) => {
    const res = await request.post('/api/init-test', {
      data: { testId: 'love-species' }
    });
    
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    
    const cookies = res.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies).toContain('test_session=');
    expect(cookies).toContain('HttpOnly');
  });

  test('should reject submit without session cookie', async ({ request }) => {
    const timestamp = Date.now().toString();
    const rawBody = JSON.stringify({ testId: 'love-species', answers: {} });
    const signature = await generateSignature(rawBody, parseInt(timestamp, 10));

    const res = await request.post('/api/submit', {
      headers: {
        'x-timestamp': timestamp,
        'x-sign': signature
      },
      data: rawBody
    });

    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Session expired');
  });

  test('should reject submit with invalid signature', async ({ request }) => {
    // 假设用刚刚拿到的正确 cookie，但签名不对
    const initRes = await request.post('/api/init-test');
    const cookie = initRes.headers()['set-cookie']?.split(';')[0];
    
    const res = await request.post('/api/submit', {
      headers: {
        'Cookie': cookie || '',
        'x-timestamp': Date.now().toString(),
        'x-sign': 'invalid_sign'
      },
      data: { testId: 'love-species', answers: {} }
    });

    expect(res.status()).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized signature');
  });
});
