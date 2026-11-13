import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createServer as createWorkerServer } from '../worker/server';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

const fixtureSrc = join(__dirname, 'fixtures/sample-copy.md');
const tmpDir = join(__dirname, '../.tmp-api-runtime');
const tmpMd = join(tmpDir, 'copy.md');

describe('worker API contract', () => {
  let base = '';
  let server: Server;

  beforeAll(async () => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(tmpMd, readFileSync(fixtureSrc, 'utf8'), 'utf8');
    process.env.XHS_DRAFT_RUNTIME_DIR = join(tmpDir, 'runtime');
    server = createWorkerServer();
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    base = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((e) => (e ? reject(e) : resolve()));
    });
  });

  it('health 本机回环；开跑校验失败返回 4xx + 可读原因', async () => {
    const h = await fetch(`${base}/health`).then((r) => r.json());
    expect(h.ok).toBe(true);
    expect(h.host).toBe('127.0.0.1');
    expect(h.cookiePolicy).toMatch(/仅本机/);
    expect(h.antiDetect).toBe(true);
    expect(h.profileDir).toBeDefined();

    const bad = await fetch(`${base}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mdPath: tmpMd, n: 99 }),
    });
    expect(bad.status).toBe(400);
    const badBody = await bad.json();
    expect(badBody.ok).toBe(false);
    expect(String(badBody.err)).toMatch(/1～10|1~10|N/);

    const missing = await fetch(`${base}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mdPath: 'Z:/no-such-file.md', n: 1 }),
    });
    expect(missing.status).toBe(400);
    const missBody = await missing.json();
    expect(missBody.ok).toBe(false);
    expect(String(missBody.err)).toMatch(/不存在/);

    const expired = await fetch(`${base}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mdPath: tmpMd,
        n: 1,
        scheduleAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    });
    expect(expired.status).toBe(400);
    const expBody = await expired.json();
    expect(expBody.ok).toBe(false);
    expect(String(expBody.err)).toMatch(/过期/);

    const draftPlat = await fetch(`${base}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mdPath: tmpMd,
        n: 1,
        mode: 'draft',
        platformScheduleAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    expect(draftPlat.status).toBe(400);
    const dpBody = await draftPlat.json();
    expect(dpBody.ok).toBe(false);
    expect(String(dpBody.err)).toMatch(/ready/);
  });

  it('accounts 列表与切换契约', async () => {
    const listRes = await fetch(`${base}/accounts`).then((r) => r.json());
    expect(listRes.ok).toBe(true);
    expect(listRes.activeId).toBeDefined();
    expect(Array.isArray(listRes.accounts)).toBe(true);
    expect(listRes.accounts.length).toBeGreaterThanOrEqual(1);

    // 切换不存在的账号返回 404
    const notFoundRes = await fetch(`${base}/accounts/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'non_existent_id' }),
    });
    expect(notFoundRes.status).toBe(404);
    const notFoundBody = await notFoundRes.json();
    expect(notFoundBody.ok).toBe(false);
  });
});
