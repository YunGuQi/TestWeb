import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

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
    test('should return basic info but strip premium fields', async ({ request }) => {
      const initRes = await request.post('/api/init-test', { data: { testId: 'destiny-lover' } });
      const cookie = initRes.headers()['set-cookie']?.split(';')[0] || '';

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
          'Cookie': cookie,
          'x-timestamp': ts.toString(),
          'x-sign': sign
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.recordId).toBeDefined();
      expect(data.result).toBeDefined();
      
      // 付费深度字段必须剥离
      expect(data.result.title).toBeDefined(); 
      expect(data.result.firstMeet).toBeUndefined();
      expect(data.result.redFlags).toBeUndefined();
      expect(data.result.loveAdvice).toBeUndefined();
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

      expect(response.status()).toBe(400);
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.result).toBeUndefined(); // MUST NOT leak data on failure
    });

    test('should reject when device sharing limit is reached', async ({ request }) => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const testCode = 'TEST_DEVICE_LIMIT_' + Date.now();
      await prisma.activationCode.create({
        data: {
          code: testCode,
          testId: 'destiny-lover',
          maxUses: 1,
          isDisabled: false,
          devices: '[]'
        }
      });

      try {
        // 1. First verification with device-1 -> should succeed
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

        // 2. Second verification with DIFFERENT device-2 -> should FAIL (exceeded maxUses: 1)
        const payload2 = {
          code: testCode,
          deviceId: 'test-device-2',
          testId: 'destiny-lover',
          resultKey: 'ldar'
        };
        const ts2 = Date.now();
        const res2 = await request.post('/api/verify', {
          data: payload2,
          headers: { 'x-timestamp': ts2.toString(), 'x-sign': await generateSignature(JSON.stringify(payload2), ts2) }
        });
        const data2 = await res2.json();
        expect(data2.success).toBe(false);
        expect(data2.error).toContain('该卡密已达到最大设备分享上限');
        expect(data2.result).toBeUndefined();

        // 3. Third verification with ORIGINAL device-1 -> should SUCCEED
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
        await prisma.activationCode.deleteMany({
          where: { code: testCode }
        });
        await prisma.$disconnect();
      }
    });

  });

  // ==========================================
  // 工单 01 & 02: 预览路由强制鉴权与 Slug 混淆保护
  // ==========================================
  test.describe('Preview Auth & Obfuscation Protection', () => {
    test('Scenario A (无凭证隐身): GET /city/preview?slug=c_sz8a1f returns 404', async ({ request }) => {
      const response = await request.get('/city/preview?slug=c_sz8a1f');
      expect(response.status()).toBe(404);
    });

    test('Scenario B (错误凭据隐身): GET /emo/preview?slug=e_lw839b&secret=bad_pass returns 404', async ({ request }) => {
      const response = await request.get('/emo/preview?slug=e_lw839b&secret=bad_pass');
      expect(response.status()).toBe(404);
    });

    test('Scenario C (明文参数阻断): GET /city/preview?name=上海&secret=mutong-preview-secret-2026 returns 404', async ({ request }) => {
      const response = await request.get('/city/preview?name=上海&secret=mutong-preview-secret-2026');
      expect(response.status()).toBe(404);
    });

    test('Scenario D (合法凭证放行): GET /city/preview?slug=c_sz8a1f&secret=mutong-preview-secret-2026 returns 200 with 深圳', async ({ request }) => {
      const response = await request.get('/city/preview?slug=c_sz8a1f&secret=mutong-preview-secret-2026');
      expect(response.status()).toBe(200);
      const text = await response.text();
      expect(text).toContain('深圳');
    });
  });

  // ==========================================
  // 工单 04: 历史记录接口真脱敏与核销态校验
  // ==========================================
  test.describe('History API Stripping Protection', () => {
    test('Scenario A (未核销设备脱敏): unverified device returns stripped fields and isUnlocked=false', async ({ request }) => {
      const testDeviceId = 'unverified_device_' + Date.now();
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      try {
        await prisma.testRecord.create({
          data: {
            testId: 'city',
            deviceId: testDeviceId,
            answers: JSON.stringify({ "q1": "1" }),
            resultId: 1
          }
        });

        const response = await request.get(`/api/history?deviceId=${testDeviceId}&testId=city`);
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.history).toBeDefined();
        expect(data.history.length).toBeGreaterThan(0);
        const first = data.history[0];
        expect(first.result.isUnlocked).toBe(false);
        expect(first.result.schedule).toBeUndefined();
        expect(first.result.curePrescription).toBeUndefined();
        expect(first.result.toxicCity).toBeUndefined();
      } finally {
        await prisma.testRecord.deleteMany({ where: { deviceId: testDeviceId } });
        await prisma.$disconnect();
      }
    });

    test('Scenario B (已核销设备放行): verified device returns complete fields and isUnlocked=true', async ({ request }) => {
      const testDeviceId = 'verified_device_' + Date.now();
      const testCode = 'TEST_VERIFIED_HIST_' + Date.now();
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      try {
        await prisma.testRecord.create({
          data: {
            testId: 'city',
            deviceId: testDeviceId,
            answers: JSON.stringify({ "q1": "1" }),
            resultId: 1
          }
        });

        await prisma.activationCode.create({
          data: {
            code: testCode,
            testId: 'city',
            maxUses: 1,
            isDisabled: false,
            devices: JSON.stringify([testDeviceId])
          }
        });

        const response = await request.get(`/api/history?deviceId=${testDeviceId}&testId=city`);
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.history).toBeDefined();
        expect(data.history.length).toBeGreaterThan(0);
        const first = data.history[0];
        expect(first.result.isUnlocked).toBe(true);
        expect(first.result.schedule).toBeDefined();
        expect(first.result.curePrescription).toBeDefined();
      } finally {
        await prisma.testRecord.deleteMany({ where: { deviceId: testDeviceId } });
        await prisma.activationCode.deleteMany({ where: { code: testCode } });
        await prisma.$disconnect();
      }
    });
  });

});
