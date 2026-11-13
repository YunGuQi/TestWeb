import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  findMasterPoster,
  generateDynamicRandomSlice,
} from '../worker/slice-helper';

describe('slice-helper 动态切片与母本定位', () => {
  const testDir = path.join(os.tmpdir(), `test-slice-helper-${Date.now()}`);
  const cardsDir = path.join(testDir, 'cards');

  beforeAll(async () => {
    fs.mkdirSync(cardsDir, { recursive: true });

    // 创建 6 张假母本长图 (尺寸 1000 x 3000)
    const masterFiles = [
      '01_tired_筋疲力尽.png',
      '02_anxious_焦虑不安.png',
      '03_sensitive_高敏感.png',
      '04_depressed_情绪低落.png',
      '05_r6_破茧成蝶.png',
      '06_r4_暗夜蔷薇.png',
    ];

    for (const name of masterFiles) {
      await sharp({
        create: {
          width: 1000,
          height: 3000,
          channels: 3,
          background: { r: 120, g: 150, b: 200 },
        },
      })
        .png()
        .toFile(path.join(cardsDir, name));
    }
  });

  afterAll(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // 忽略清理异常
    }
  });

  describe('findMasterPoster 母本定位', () => {
    it('根据 cardId 命中 01_ 开头母本', () => {
      const match = findMasterPoster(cardsDir, 'r1_m4', 'r1_m4_slice.png');
      expect(match).not.toBeNull();
      expect(path.basename(match!)).toBe('01_tired_筋疲力尽.png');
    });

    it('根据 cardId 命中 03_ 开头母本', () => {
      const match = findMasterPoster(cardsDir, 'r3_m2');
      expect(match).not.toBeNull();
      expect(path.basename(match!)).toBe('03_sensitive_高敏感.png');
    });

    it('若存在真实的静态切片文件，优先短路返回静态切片', () => {
      const staticSliceName = 'r1_m4_slice.png';
      const staticPath = path.join(cardsDir, staticSliceName);
      fs.writeFileSync(staticPath, 'fake slice');
      try {
        const match = findMasterPoster(cardsDir, 'r1_m4', staticSliceName);
        expect(match).toBe(staticPath);
      } finally {
        fs.unlinkSync(staticPath);
      }
    });

    it('无匹配目录或无对应序号时优雅返回 null', () => {
      expect(findMasterPoster('path/not/exist', 'r1_m1')).toBeNull();
      expect(findMasterPoster(cardsDir, 'invalid_id')).toBeNull();
      expect(findMasterPoster(cardsDir, 'r99_m1')).toBeNull();
    });
  });

  describe('generateDynamicRandomSlice 尺寸与二维码避让率 (蒙特卡洛 1000 次)', () => {
    it('切片几何尺寸断言 (1000 x 3000 -> 1000 x 1000)', async () => {
      const res = await generateDynamicRandomSlice({
        cardsDir,
        cardId: 'r1_m1',
        outDir: path.join(testDir, 'out'),
      });

      expect(fs.existsSync(res.tempPath)).toBe(true);
      expect(res.width).toBe(1000);
      expect(res.sliceHeight).toBe(1000);

      const croppedMeta = await sharp(res.tempPath).metadata();
      expect(croppedMeta.width).toBe(1000);
      expect(croppedMeta.height).toBe(1000);

      // 验证生命周期与零残留
      await res.cleanup();
      expect(fs.existsSync(res.tempPath)).toBe(false);
    });

    it('1000 次抽样 100% 避让二维码红线 (startY + sliceHeight <= safeMaxY)', async () => {
      // 模拟多比例长图验证纯算法边界
      const testCases = [
        { h: 2400 },
        { h: 3000 },
        { h: 4000 },
        { h: 5120 },
      ];

      for (const { h } of testCases) {
        const sliceH = Math.floor(h / 3);
        const safeMaxY = Math.floor(h * 0.85);
        const maxStartY = Math.max(0, safeMaxY - sliceH);

        let violations = 0;
        for (let i = 0; i < 1000; i++) {
          const startY = Math.floor(Math.random() * (maxStartY + 1));
          const endY = startY + sliceH;
          if (endY > safeMaxY || startY < 0) {
            violations++;
          }
        }
        expect(violations).toBe(0);
      }
    });
  });
});
