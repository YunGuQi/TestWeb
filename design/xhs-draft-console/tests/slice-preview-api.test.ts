import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { GET, POST } from '../app/api/slice-preview/route';

describe('Slice Preview API (/api/slice-preview)', () => {
  const testDir = path.join(os.tmpdir(), `test-slice-preview-api-${Date.now()}`);
  const cardsDir = path.join(testDir, 'cards');

  beforeAll(async () => {
    fs.mkdirSync(cardsDir, { recursive: true });

    // 1. 创建静态切片文件 r1_m4_slice.png
    await sharp({
      create: {
        width: 600,
        height: 800,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .png()
      .toFile(path.join(cardsDir, 'r1_m4_slice.png'));

    // 2. 创建母本长图 01_tired.png (750 x 1500)
    await sharp({
      create: {
        width: 750,
        height: 1500,
        channels: 3,
        background: { r: 50, g: 80, b: 120 },
      },
    })
      .png()
      .toFile(path.join(cardsDir, '01_tired.png'));
  });

  afterAll(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // 容错忽略
    }
  });

  it('AC-01.1: 静态切片直读测试 (Fast Path)', async () => {
    const url = `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
      cardsDir
    )}&cardId=r1_m4&imageSlice=r1_m4_slice.png`;
    const req = new Request(url, { method: 'GET' });
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.isDynamic).toBe(false);
    expect(json.meta.isStatic).toBe(true);
    expect(json.meta.width).toBe(600);
    expect(json.meta.height).toBe(800);
    expect(json.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('AC-01.2: 动态长图切片与 1/3 黄金高度避让断言 (Dynamic Path)', async () => {
    const url = `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
      cardsDir
    )}&cardId=r1_m1`;
    const req = new Request(url, { method: 'GET' });
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.isDynamic).toBe(true);
    expect(json.meta.isStatic).toBe(false);
    expect(json.meta.width).toBe(750);
    expect(json.meta.sliceHeight).toBe(500); // 1500 / 3
    // 二维码避让红线检验: startY + sliceHeight <= 1500 * 0.85 = 1275
    expect(json.meta.startY + json.meta.sliceHeight).toBeLessThanOrEqual(1275);
    expect(json.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('AC-01.3: 种子驱动或 startY 提取测试', async () => {
    const url = `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
      cardsDir
    )}&cardId=r1_m1&seed=test-seed-123&startY=200`;
    const req = new Request(url, { method: 'GET' });
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.startY).toBe(200);
  });

  it('AC-01.4: 异常参数与路径越权防御', async () => {
    // 缺失必需参数
    const reqNoParam = new Request('http://localhost:3721/api/slice-preview', {
      method: 'GET',
    });
    const resNoParam = await GET(reqNoParam);
    expect(resNoParam.status).toBe(400);

    // 路径遍历注入防护
    const reqTraversal = new Request(
      `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
        cardsDir
      )}&cardId=r1_m1&imageSlice=../secret.png`,
      { method: 'GET' }
    );
    const resTraversal = await GET(reqTraversal);
    expect(resTraversal.status).toBe(400);

    // 不存在的目录
    const reqNonExistDir = new Request(
      `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
        path.join(testDir, 'not-exist-dir')
      )}&cardId=r1_m1`,
      { method: 'GET' }
    );
    const resNonExistDir = await GET(reqNonExistDir);
    expect(resNonExistDir.status).toBe(404);

    // 未找到母本长图
    const reqNoMaster = new Request(
      `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
        cardsDir
      )}&cardId=r99_m1`,
      { method: 'GET' }
    );
    const resNoMaster = await GET(reqNoMaster);
    expect(resNoMaster.status).toBe(404);
  });

  it('AC-01.5: 零磁盘残留检验 (cleanup)', async () => {
    const tmpSlicesDir = path.join(os.tmpdir(), 'xhs-slices');
    const getFileCount = () => {
      if (!fs.existsSync(tmpSlicesDir)) return 0;
      return fs.readdirSync(tmpSlicesDir).length;
    };

    const countBefore = getFileCount();

    const url = `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
      cardsDir
    )}&cardId=r1_m1&seed=zero-residue-test`;
    const req = new Request(url, { method: 'GET' });
    const response = await GET(req);

    expect(response.status).toBe(200);
    const countAfter = getFileCount();
    // 断言执行完毕后零临时文件增加
    expect(countAfter).toBe(countBefore);
  });

  it('POST 请求支持测试', async () => {
    const req = new Request('http://localhost:3721/api/slice-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardsDir,
        cardId: 'r1_m4',
        imageSlice: 'r1_m4_slice.png',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.meta.isStatic).toBe(true);
  });

  it('raw 二进制格式响应测试', async () => {
    const url = `http://localhost:3721/api/slice-preview?cardsDir=${encodeURIComponent(
      cardsDir
    )}&cardId=r1_m4&imageSlice=r1_m4_slice.png&format=raw`;
    const req = new Request(url, { method: 'GET' });
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);
  });
});
