import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import {
  exportMobileHubData,
  exportMultiSuiteHubData,
  cleanCardTitle,
  formatCardTags,
  extractCleanBody,
} from '../lib/export/mobile-hub-exporter';
import { readZipEntries } from '../lib/export/zip-pack';
import type { ProductPresetItem } from '../lib/preset-suites';

describe('Mobile Hub Exporter & Zip Pack (Multi-Suite Support)', () => {
  const tmpRoot = path.resolve(__dirname, '../.tmp-test-mobile-hub-export');
  const tmpOutDir = path.resolve(tmpRoot, 'dist');
  const sampleMdPath = path.resolve(__dirname, 'fixtures/sample-copy.md');

  beforeAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('T-01: 准确解析发帖文案并导出合法 data.json (AC-1.1 & AC-6.1 & AC-6.2)', async () => {
    const res = await exportMobileHubData({
      mdPath: sampleMdPath,
      outDir: tmpOutDir,
      accessPassword: 'test-password-123',
      generateZip: true,
    });

    expect(res.ok).toBe(true);
    expect(res.totalCards).toBeGreaterThanOrEqual(1);

    const dataJsonPath = path.join(tmpOutDir, 'data.json');
    expect(fs.existsSync(dataJsonPath)).toBe(true);

    const json = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
    expect(json.version).toBe('2.0.0');
    expect(json.totalCards).toBe(res.totalCards);
    expect(Array.isArray(json.cards)).toBe(true);
    expect(Array.isArray(json.accounts)).toBe(true);
    expect(Array.isArray(json.suites)).toBe(true);
    expect(json.suites.length).toBeGreaterThanOrEqual(1);
    expect(json.activeSuiteId).toBeTruthy();

    // 检查卡片字段强契约
    for (const card of json.cards) {
      expect(card.id).toBeTruthy();
      expect(card.title).toBeTruthy();
      expect(card.body).toBeDefined();
      expect(card.cover).toBeDefined();
      expect(Array.isArray(card.cover.lines)).toBe(true);
      expect(Array.isArray(card.tags)).toBe(true);
      expect(card.formattedTags).toBeTruthy();
      expect(Array.isArray(card.images)).toBe(true);
      expect(card.images.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('T-02: 正文内容脱敏与清洗断言 (AC-1.2)', () => {
    expect(cleanCardTitle('[标题] 配得感100%我妈先问手疼')).toBe('配得感100%我妈先问手疼');
    expect(cleanCardTitle('【配得感100%我妈先问手疼】')).toBe('配得感100%我妈先问手疼');
    expect(cleanCardTitle('[标题] [已完成标题请勿再跑]')).toBe('已完成标题请勿再跑');

    expect(formatCardTags(['大女主', '#松弛感', '原生家庭'])).toBe('#大女主 #松弛感 #原生家庭');

    const rawFence = [
      '```text',
      '[封面]防备9成',
      '周五手机全静音',
      '[标题]99%防御留给周五',
      '五点半按停工作机。',
      '',
      '红点堆了二十个。',
      '一条也没点开。',
      '',
      '合上电脑。',
      '#大女主觉醒 #原生家庭测试 #女性成长',
      '```',
    ].join('\n');

    const cleanBody = extractCleanBody(rawFence, '');
    expect(cleanBody).not.toContain('```');
    expect(cleanBody).not.toContain('[标题]');
    expect(cleanBody).not.toContain('[封面]');
    expect(cleanBody).not.toContain('#大女主觉醒');
    expect(cleanBody).toContain('五点半按停工作机。');
    expect(cleanBody).toContain('红点堆了二十个。');
    expect(cleanBody).toContain('\n\n');
  });

  it('T-03: 切片资源物理落地与套件子目录隔离断言 (AC-1.3 & AC-6.3)', () => {
    const slicesDir = path.join(tmpOutDir, 'slices');
    expect(fs.existsSync(slicesDir)).toBe(true);

    const subDirs = fs.readdirSync(slicesDir);
    expect(subDirs.length).toBeGreaterThanOrEqual(1);

    // 检查套件子目录下的文件
    const defaultSuiteDir = path.join(slicesDir, subDirs[0]);
    expect(fs.statSync(defaultSuiteDir).isDirectory()).toBe(true);

    const files = fs.readdirSync(defaultSuiteDir);
    expect(files.length).toBeGreaterThanOrEqual(1);

    for (const f of files) {
      const filePath = path.join(defaultSuiteDir, f);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  it('T-04: 生成 update.zip 完整性验证 (AC-1.4)', () => {
    const zipPath = path.resolve(tmpOutDir, '../update.zip');
    expect(fs.existsSync(zipPath)).toBe(true);

    const stat = fs.statSync(zipPath);
    expect(stat.size).toBeGreaterThan(500);

    const entries = readZipEntries(zipPath);
    expect(entries).toContain('index.html');
    expect(entries).toContain('data.json');
    const hasSlices = entries.some((e) => e.startsWith('slices/'));
    expect(hasSlices).toBe(true);
  });

  it('T-05: 多套件全量批量导出与异常容错断言 (AC-6.1 ~ AC-6.5)', async () => {
    const multiOutDir = path.resolve(tmpRoot, 'dist-multi');
    const mockSuites: ProductPresetItem[] = [
      {
        id: 'suite_sample',
        name: '样例测试套件 A',
        category: '样例',
        mdPath: sampleMdPath,
        cardsDir: '',
      },
      {
        id: 'suite_non_existent',
        name: '不存在的异常套件 (容错测试)',
        category: '容错',
        mdPath: path.resolve(__dirname, '__non_existent__.md'),
        cardsDir: '',
      },
      {
        id: 'suite_copy_b',
        name: '样例测试套件 B',
        category: '样例',
        mdPath: sampleMdPath,
        cardsDir: '',
      },
    ];

    const res = await exportMultiSuiteHubData({
      suites: mockSuites,
      defaultSuiteId: 'suite_copy_b',
      outDir: multiOutDir,
      generateZip: true,
    });

    expect(res.ok).toBe(true);
    // 异常套件被平稳跳过，合法套件正常导出 (AC-6.4)
    expect(res.totalSuites).toBe(2);
    expect(res.data.version).toBe('2.0.0'); // AC-6.1
    expect(res.data.suites.length).toBe(2);
    expect(res.data.activeSuiteId).toBe('suite_copy_b');

    // 顶层向后兼容字段 (AC-6.2)
    expect(res.data.cards.length).toBe(res.data.suites[1].totalCards);
    expect(res.data.totalCards).toBe(res.data.suites[1].totalCards);

    // 切片目录独立隔离 (AC-6.3)
    const suiteADir = path.join(multiOutDir, 'slices/suite_sample');
    const suiteBDir = path.join(multiOutDir, 'slices/suite_copy_b');
    expect(fs.existsSync(suiteADir)).toBe(true);
    expect(fs.existsSync(suiteBDir)).toBe(true);

    const suiteAFiles = fs.readdirSync(suiteADir);
    expect(suiteAFiles.length).toBeGreaterThan(0);
    for (const f of suiteAFiles) {
      expect(fs.statSync(path.join(suiteADir, f)).size).toBeGreaterThan(0);
    }

    // 检查卡片中相对 url 是否符合 slices/<suite_id>/...
    for (const card of res.data.suites[0].cards) {
      for (const img of card.images) {
        expect(img.url.startsWith('slices/suite_sample/')).toBe(true);
      }
    }
  });
});
