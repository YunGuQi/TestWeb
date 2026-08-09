import { test, expect } from '@playwright/test';
import { generateSignature } from '../../lib/security';

test.describe('Anti-scraping API Tests', () => {
  
  test.describe('/api/questions - Signature Protection', () => {
    test('should reject requests without a signature', async ({ request }) => {
      const response = await request.get('/api/questions?testId=destiny-lover', {
        headers: {}
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized signature');
    });

    test('should reject requests with invalid signature', async ({ request }) => {
      const response = await request.get('/api/questions?testId=destiny-lover', {
        headers: {
          'x-timestamp': Date.now().toString(),
          'x-sign': 'invalid_signature_hash'
        }
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should accept requests with valid signature', async ({ request }) => {
      const ts = Date.now();
      const sign = await generateSignature("GET_QUESTIONS", ts);
      const response = await request.get('/api/questions?testId=destiny-lover', {
        headers: {
          'x-timestamp': ts.toString(),
          'x-sign': sign
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.questions).toBeDefined();
      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
    });
  });

  test.describe('/api/submit - Data Stripping', () => {
    test('should return basic info but strip description, quote, and radar', async ({ request }) => {
      // Mock answers that correspond to some result
      const mockAnswers = {
        "q1": "1",
        "q2": "2",
        "q3": "3"
      };

      const payload = {
        testId: 'destiny-lover',
        deviceId: 'playwright-test-device',
        answers: mockAnswers,
        metadata: { nickname: 'Tester', status: 'single' }
      };
      
      const ts = Date.now();
      const sign = await generateSignature(JSON.stringify(payload), ts);

      const response = await request.post('/api/submit', {
        data: payload,
        headers: {
          'x-timestamp': ts.toString(),
          'x-sign': sign
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.recordId).toBeDefined();
      expect(data.result).toBeDefined();
      
      // The critical security assertions:
      expect(data.result.title).toBeDefined(); 
      expect(data.result.description).toBeUndefined(); // MUST be stripped
      expect(data.result.quote).toBeUndefined(); // MUST be stripped
      expect(data.result.radar).toBeUndefined(); // MUST be stripped
    });
  });

  test.describe('/api/verify - Dynamic Unlocking', () => {
    test('should reject invalid activation code and not leak data', async ({ request }) => {
      const payload = {
        code: 'INVALID_CODE_123',
        deviceId: 'playwright-test-device',
        testId: 'destiny-lover',
        recordId: 1,
        resultKey: 'ldar'
      };
      
      const ts = Date.now();
      const sign = await generateSignature(JSON.stringify(payload), ts);

      const response = await request.post('/api/verify', {
        data: payload,
        headers: {
          'x-timestamp': ts.toString(),
          'x-sign': sign
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.result).toBeUndefined(); // MUST NOT leak data on failure
    });

    test('should strictly bind activation code to the first resultKey used (VIP Loophole Fix)', async ({ request }) => {
      // 1. Create a test code via Prisma directly
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const testCode = 'TEST_STRICT_BIND_' + Date.now();
      await prisma.activationCode.create({
        data: {
          code: testCode,
          testId: 'destiny-lover',
          maxUses: 3,
          isDisabled: false,
          devices: '[]'
        }
      });

      try {
        // 2. First verification with 'ldar' -> should succeed and bind
        const payload1 = {
          code: testCode,
          deviceId: 'test-device-1',
          testId: 'destiny-lover',
          resultKey: 'ldar'
        };
        const ts1 = Date.now();
        const res1 = await request.post('/api/verify', {
          data: payload1,
          headers: { 'x-timestamp': ts1.toString(), 'x-sign': await generateSignature(JSON.stringify(payload1), ts1) }
        });
        const data1 = await res1.json();
        expect(data1.success).toBe(true);
        expect(data1.result).toBeDefined();

        // 3. Second verification with a DIFFERENT key 'gscp' on the SAME device -> should FAIL
        const payload2 = {
          code: testCode,
          deviceId: 'test-device-1',
          testId: 'destiny-lover',
          resultKey: 'gscp'
        };
        const ts2 = Date.now();
        const res2 = await request.post('/api/verify', {
          data: payload2,
          headers: { 'x-timestamp': ts2.toString(), 'x-sign': await generateSignature(JSON.stringify(payload2), ts2) }
        });
        const data2 = await res2.json();
        expect(data2.success).toBe(false);
        expect(data2.error).toBe('该激活码已绑定其他测试结果，请购买新码');
        expect(data2.result).toBeUndefined();

        // 4. Third verification with the ORIGINAL key 'ldar' -> should SUCCEED
        const payload3 = {
          code: testCode,
          deviceId: 'test-device-1',
          testId: 'destiny-lover',
          resultKey: 'ldar'
        };
        const ts3 = Date.now();
        const res3 = await request.post('/api/verify', {
          data: payload3,
          headers: { 'x-timestamp': ts3.toString(), 'x-sign': await generateSignature(JSON.stringify(payload3), ts3) }
        });
        const data3 = await res3.json();
        expect(data3.success).toBe(true);
        expect(data3.result).toBeDefined();

      } finally {
        // Cleanup
        await prisma.activationCode.deleteMany({
          where: { code: testCode }
        });
        await prisma.$disconnect();
      }
    });

  });

});
