import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanResultMapFromCardsDir } from '../lib/result-resolver.server';
import {
  resolveResultLabel,
  DNVZHU_PROFILES,
  EMO_PROFILES,
  DESTINY_LOVER_PROFILES,
  LOVE_SPECIES_PROFILES,
  CITY_PROFILES,
} from '../lib/result-resolver';

describe('Result Resolver Helper 测试套件 (Ticket 01 & 04)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xhs-resolver-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  it('T-01: 扫描真实 cardsDir 准确提取模式 A (01_r1_内核超稳的满级大女主.png)', () => {
    fs.writeFileSync(path.join(tmpDir, '01_r1_内核超稳的满级大女主.png'), '');
    fs.writeFileSync(path.join(tmpDir, '02_r5_气场全开的六边形女王.png'), '');
    // 忽略切片与全景图
    fs.writeFileSync(path.join(tmpDir, 'r1_m1_slice.png'), '');
    fs.writeFileSync(path.join(tmpDir, '01_r1_full.png'), '');

    const map = scanResultMapFromCardsDir(tmpDir);
    expect(map['r1']).toBe('内核超稳的满级大女主');
    expect(map['01']).toBe('内核超稳的满级大女主');
    expect(map['r5']).toBe('气场全开的六边形女王');
    expect(map['r1_m1_slice']).toBeUndefined();
  });

  it('T-02: 扫描性格城市测试母本文件名模式 B (01_深圳.png, 02_上海.png)', () => {
    fs.writeFileSync(path.join(tmpDir, '01_深圳.png'), '');
    fs.writeFileSync(path.join(tmpDir, '02_成都.png'), '');

    const map = scanResultMapFromCardsDir(tmpDir);
    expect(map['深圳']).toBe('效率先锋 · 破壁极客（深圳）');
    expect(map['01']).toBe('效率先锋 · 破壁极客（深圳）');
    expect(map['成都']).toBe('锦官慢煮 · 巴适隐居客（成都）');
  });

  it('T-03: 当 MD 标注中文字段时，优先直接采用 (结果=内核超稳的满级大女主)', () => {
    const card = {
      cardId: 'custom_01',
      meta: { fields: { '结果': '内核超稳的满级大女主' } },
      title: '测试标题',
    };
    const res = resolveResultLabel(card);
    expect(res.name).toBe('内核超稳的满级大女主');
  });

  it('T-04: 无 cardsDir 时，准确回退至 5 大主流测试画像字典', () => {
    // 1. 大女主
    expect(resolveResultLabel({ cardId: 'r2_m3' }).name).toBe(DNVZHU_PROFILES['r2']);
    // 2. 深度情绪内耗
    expect(resolveResultLabel({ cardId: 'low_m1' }).name).toBe(EMO_PROFILES['low']);
    // 3. 命定恋人
    expect(resolveResultLabel({ cardId: 'ldar_m2' }).name).toBe(DESTINY_LOVER_PROFILES['ldar']);
    // 4. 恋爱物种
    expect(resolveResultLabel({ cardId: 'AESI_m4' }).name).toBe(LOVE_SPECIES_PROFILES['aesi']);
    // 5. 性格城市
    expect(resolveResultLabel({ cardId: 'city_01', title: '生活在深圳的松弛感' }).name).toContain('深圳');
  });

  it('T-05: 格式化 full 字符串与颜色 variant 分配正确', () => {
    const res = resolveResultLabel({ cardId: 'r1_m2' });
    expect(res.full).toBe('r1 · 内核超稳的满级大女主');
    expect(res.badgeVariant).toBe('purple');

    const res2 = resolveResultLabel({ cardId: 'r2_m1' });
    expect(res2.badgeVariant).toBe('blue');
  });

  it('T-06: 缺失、异常与未知数据优雅兜底 (零抛错)', () => {
    expect(resolveResultLabel({}).full).toBe('通用画像');
    expect(resolveResultLabel({ cardId: 'unknown_x9' }).full).toBe('unknown_x9');
    expect(resolveResultLabel({ cardId: '' }, {}).code).toBe('');
    expect(resolveResultLabel({ cardId: 'nonexistent_test' }).badgeVariant).toBe('slate');
  });

  it('T-07: scanResultMapFromCardsDir 面对无效路径或空目录安全返回空对象', () => {
    expect(scanResultMapFromCardsDir('')).toEqual({});
    expect(scanResultMapFromCardsDir(undefined)).toEqual({});
    expect(scanResultMapFromCardsDir('path/that/does/not/exist/ever')).toEqual({});
    expect(scanResultMapFromCardsDir(tmpDir)).toEqual({});
  });
});
