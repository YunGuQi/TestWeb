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

  test('GET /api/questions?testId=love-species should return 20 questions without score weights', async ({ request }) => {
    // Note: GET /api/questions does not actually check the signature according to current route.ts,
    // but we can pass it just in case.
    const response = await request.get('/api/questions?testId=love-species');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Check if it returns exactly 20 questions
    expect(data.questions).toBeDefined();
    expect(data.questions.length).toBe(20);
    
    // Check for anti-scraping: NO SCORES LEAKED
    const firstQuestion = data.questions[0];
    expect(firstQuestion.options).toBeDefined();
    for (const option of firstQuestion.options) {
      // The scores object must be removed before sending to the client
      expect(option.scores).toBeUndefined();
    }
  });

  test('POST /api/submit should calculate AESI genome and return 赛博哈士奇', async ({ request }) => {
    // Select answers that heavily favor Attached, Expressive, Sensitive, Idealistic
    // Based on love-species-data.ts:
    // q1-o4 (A,S), q2-o4 (A,E), q3-o1 (E,A), q4-o1 (E,A), q6-o1 (A,S)
    // q8-o1 (I,S), q12-o4 (E,I), q18-o1 (A,I), q19-o1 (A,I)
    // These options will definitely push the result towards AESI
    const optionIds = [
      'ls-q1-o4', 'ls-q2-o4', 'ls-q3-o1', 'ls-q4-o1', 'ls-q5-o1',
      'ls-q6-o1', 'ls-q7-o1', 'ls-q8-o1', 'ls-q9-o2', 'ls-q10-o1',
      'ls-q11-o1', 'ls-q12-o4', 'ls-q13-o1', 'ls-q14-o2', 'ls-q15-o4',
      'ls-q16-o1', 'ls-q17-o1', 'ls-q18-o1', 'ls-q19-o1', 'ls-q20-o1'
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
        'content-type': 'application/json'
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
    expect(data.result.title).toBe('赛博哈士奇');
  });

  test('POST /api/submit should calculate DHCR genome and return 冰川雪豹', async ({ request }) => {
    // Select answers that heavily favor Detached, Hidden, Calm, Realistic
    // Based on love-species-data.ts:
    // q1-o3 (D,C), q2-o2 (C,R), q3-o2 (C,D), q4-o3 (D,C)
    const optionIds = [
      'ls-q1-o3', 'ls-q2-o2', 'ls-q3-o2', 'ls-q4-o3', 'ls-q5-o2',
      'ls-q6-o2', 'ls-q7-o4', 'ls-q8-o2', 'ls-q9-o3', 'ls-q10-o2',
      'ls-q11-o2', 'ls-q12-o2', 'ls-q13-o4', 'ls-q14-o4', 'ls-q15-o2',
      'ls-q16-o4', 'ls-q17-o4', 'ls-q18-o3', 'ls-q19-o2', 'ls-q20-o4'
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
        'content-type': 'application/json'
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
    expect(data.result.title).toBe('冰川雪豹');
  });

});
