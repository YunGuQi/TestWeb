# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: anti-scraping.spec.ts >> Anti-scraping API Tests >> /api/questions - Signature Protection >> should reject requests without a signature
- Location: tests\api\anti-scraping.spec.ts:7:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "Unauthorized request"
Received: "Unauthorized signature"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { generateSignature } from '../../lib/security';
  3   | 
  4   | test.describe('Anti-scraping API Tests', () => {
  5   |   
  6   |   test.describe('/api/questions - Signature Protection', () => {
  7   |     test('should reject requests without a signature', async ({ request }) => {
  8   |       const response = await request.get('/api/questions?testId=destiny-lover', {
  9   |         headers: {}
  10  |       });
  11  |       
  12  |       expect(response.status()).toBe(403);
  13  |       const data = await response.json();
  14  |       expect(data.success).toBe(false);
> 15  |       expect(data.error).toBe('Unauthorized request');
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  16  |     });
  17  | 
  18  |     test('should reject requests with invalid signature', async ({ request }) => {
  19  |       const response = await request.get('/api/questions?testId=destiny-lover', {
  20  |         headers: {
  21  |           'x-timestamp': Date.now().toString(),
  22  |           'x-sign': 'invalid_signature_hash'
  23  |         }
  24  |       });
  25  |       
  26  |       expect(response.status()).toBe(403);
  27  |       const data = await response.json();
  28  |       expect(data.success).toBe(false);
  29  |     });
  30  | 
  31  |     test('should accept requests with valid signature', async ({ request }) => {
  32  |       const ts = Date.now();
  33  |       const sign = await generateSignature("GET_QUESTIONS", ts);
  34  |       const response = await request.get('/api/questions?testId=destiny-lover', {
  35  |         headers: {
  36  |           'x-timestamp': ts.toString(),
  37  |           'x-sign': sign
  38  |         }
  39  |       });
  40  |       
  41  |       expect(response.status()).toBe(200);
  42  |       const data = await response.json();
  43  |       expect(data.success).toBe(true);
  44  |       expect(data.questions).toBeDefined();
  45  |       expect(Array.isArray(data.questions)).toBe(true);
  46  |       expect(data.questions.length).toBeGreaterThan(0);
  47  |     });
  48  |   });
  49  | 
  50  |   test.describe('/api/submit - Data Stripping', () => {
  51  |     test('should return basic info but strip description, quote, and radar', async ({ request }) => {
  52  |       // Mock answers that correspond to some result
  53  |       const mockAnswers = {
  54  |         "q1": "1",
  55  |         "q2": "2",
  56  |         "q3": "3"
  57  |       };
  58  | 
  59  |       const payload = {
  60  |         testId: 'destiny-lover',
  61  |         deviceId: 'playwright-test-device',
  62  |         answers: mockAnswers,
  63  |         metadata: { nickname: 'Tester', status: 'single' }
  64  |       };
  65  |       
  66  |       const ts = Date.now();
  67  |       const sign = await generateSignature(JSON.stringify(payload), ts);
  68  | 
  69  |       const response = await request.post('/api/submit', {
  70  |         data: payload,
  71  |         headers: {
  72  |           'x-timestamp': ts.toString(),
  73  |           'x-sign': sign
  74  |         }
  75  |       });
  76  | 
  77  |       expect(response.status()).toBe(200);
  78  |       const data = await response.json();
  79  |       
  80  |       expect(data.success).toBe(true);
  81  |       expect(data.recordId).toBeDefined();
  82  |       expect(data.result).toBeDefined();
  83  |       
  84  |       // The critical security assertions:
  85  |       expect(data.result.title).toBeDefined(); 
  86  |       expect(data.result.description).toBeUndefined(); // MUST be stripped
  87  |       expect(data.result.quote).toBeUndefined(); // MUST be stripped
  88  |       expect(data.result.radar).toBeUndefined(); // MUST be stripped
  89  |     });
  90  |   });
  91  | 
  92  |   test.describe('/api/verify - Dynamic Unlocking', () => {
  93  |     test('should reject invalid activation code and not leak data', async ({ request }) => {
  94  |       const payload = {
  95  |         code: 'INVALID_CODE_123',
  96  |         deviceId: 'playwright-test-device',
  97  |         testId: 'destiny-lover',
  98  |         recordId: 1,
  99  |         resultKey: 'ldar'
  100 |       };
  101 |       
  102 |       const ts = Date.now();
  103 |       const sign = await generateSignature(JSON.stringify(payload), ts);
  104 | 
  105 |       const response = await request.post('/api/verify', {
  106 |         data: payload,
  107 |         headers: {
  108 |           'x-timestamp': ts.toString(),
  109 |           'x-sign': sign
  110 |         }
  111 |       });
  112 | 
  113 |       expect(response.status()).toBe(200);
  114 |       const data = await response.json();
  115 |       
```