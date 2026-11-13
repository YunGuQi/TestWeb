import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('chrome-session 窗口前置策略', () => {
  const src = readFileSync(
    join(__dirname, '../worker/chrome-session.ts'),
    'utf8'
  );

  it('热路径 getActivePage 默认不 bringToFront', () => {
    expect(src).toContain('activate?: boolean');
    expect(src).toContain('if (opts?.activate)');
    expect(src).toContain('热路径不 activate');
    // 扫码登录才前置
    expect(src).toContain('仅扫码场景才前置窗口');
    expect(src).toMatch(/need_qr[\s\S]*activatePage\(page\)/);
  });

  it('仍保留 activatePage 实现供扫码使用', () => {
    expect(src).toContain('async function activatePage');
    expect(src).toContain('bringToFront');
  });
});
