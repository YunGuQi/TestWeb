import { test, expect } from '@playwright/test';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

// Helper to generate signature exactly like lib/security.ts
function generateSignature(payload: string, timestamp: number): string {
  const secret = process.env.NEXT_PUBLIC_API_SALT || 'destiny-lover-default-salt-12345';
  const data = timestamp.toString() + payload + secret;
  return crypto.createHash('sha256').update(data).digest('hex');
}

test.describe('Love Species 3.0 API Tests (TDD)', () => {

  test('GET /api/questions?testId=love-species should return 15 questions without score weights', async ({ request }) => {
    const timestamp = Date.now();
    const sign = generateSignature('GET_QUESTIONS', timestamp);
    const response = await request.get('/api/questions?testId=love-species', {
      headers: {
        'x-timestamp': timestamp.toString(),
        'x-sign': sign
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Check if it returns exactly 15 questions
    expect(data.questions).toBeDefined();
    expect(data.questions.length).toBe(15);
    
    // Check for anti-scraping: NO SCORES LEAKED
    const firstQuestion = data.questions[0];
    expect(firstQuestion.options).toBeDefined();
    for (const option of firstQuestion.options) {
      // The scores object must be removed before sending to the client
      expect(option.scores).toBeUndefined();
    }
  });

  test('POST /api/submit should calculate AESI genome and return 直球粘人精 · 掉毛大胖橘', async ({ request }) => {
    // 1. 初始化并获取 HttpOnly Session Cookie (与服务端鉴权对齐)
    const initRes = await request.get('/api/init-test?testId=love-species');
    expect(initRes.ok()).toBeTruthy();
    const cookies = initRes.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies).toContain('test_session=');

    // 2. 选择稳定偏向 Attached, Expressive, Sensitive, Idealistic 的 15 题黄金选项
    const optionIds = [
      'ls-q1-o1', 'ls-q2-o4', 'ls-q3-o1', 'ls-q4-o1', 'ls-q5-o2',
      'ls-q6-o1', 'ls-q7-o1', 'ls-q8-o1', 'ls-q9-o2', 'ls-q10-o2',
      'ls-q11-o1', 'ls-q12-o1', 'ls-q13-o1', 'ls-q14-o2', 'ls-q15-o1'
    ];

    const payload = {
      testId: 'love-species',
      answers: optionIds,
      metadata: { status: 'single' }
    };
    
    const timestamp = Date.now();
    const payloadStr = JSON.stringify(payload);
    const signature = generateSignature(payloadStr, timestamp);

    const response = await request.post('/api/submit', {
      headers: {
        'x-timestamp': timestamp.toString(),
        'x-sign': signature,
        'content-type': 'application/json',
        'cookie': cookies
      },
      data: payloadStr
    });

    if (!response.ok()) {
      console.error('POST /api/submit AESI failed:', await response.text());
    }
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.success).toBeTruthy();
    expect(data.recordId).toBeDefined();
    
    // The genome key should be AESI
    expect(data.result.key).toBe('AESI');
    expect(data.result.title).toBe('直球粘人精 · 掉毛大胖橘');
  });

  test('POST /api/submit should calculate DHCR genome and return 寡王巅峰 · 零度高岭雪豹', async ({ request }) => {
    // 1. 初始化并获取 HttpOnly Session Cookie (与服务端鉴权对齐)
    const initRes = await request.get('/api/init-test?testId=love-species');
    expect(initRes.ok()).toBeTruthy();
    const cookies = initRes.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies).toContain('test_session=');

    // 2. 选择稳定偏向 Detached, Hidden, Calm, Realistic 的 15 题黄金选项
    const optionIds = [
      'ls-q1-o3', 'ls-q2-o2', 'ls-q3-o2', 'ls-q4-o2', 'ls-q5-o4',
      'ls-q6-o3', 'ls-q7-o4', 'ls-q8-o4', 'ls-q9-o4', 'ls-q10-o3',
      'ls-q11-o2', 'ls-q12-o2', 'ls-q13-o4', 'ls-q14-o3', 'ls-q15-o4'
    ];

    const payload = {
      testId: 'love-species',
      answers: optionIds,
      metadata: { status: 'relationship' }
    };

    const timestamp = Date.now();
    const payloadStr = JSON.stringify(payload);
    const signature = generateSignature(payloadStr, timestamp);

    const response = await request.post('/api/submit', {
      headers: {
        'x-timestamp': timestamp.toString(),
        'x-sign': signature,
        'content-type': 'application/json',
        'cookie': cookies
      },
      data: payloadStr
    });

    if (!response.ok()) {
      console.error('POST /api/submit DHCR failed:', await response.text());
    }
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.success).toBeTruthy();
    expect(data.result.key).toBe('DHCR');
    expect(data.result.title).toBe('寡王巅峰 · 零度高岭雪豹');
  });

});
