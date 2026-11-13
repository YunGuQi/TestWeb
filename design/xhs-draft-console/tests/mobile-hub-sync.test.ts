import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { runBaotaSync, loadBaotaConfig } from '../worker/sync-pipeline';

describe('Baota Sync Pipeline & Fallback Circuit', () => {
  const tmpRoot = path.resolve(__dirname, '../.tmp-test-mobile-hub-sync');
  const tmpOutDir = path.resolve(tmpRoot, 'dist');
  const sampleMdPath = path.resolve(__dirname, 'fixtures/sample-copy.md');

  beforeAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('T-05: 无 SSH 配置时，100% 触发降级并生成 update.zip (AC-3.3 & AC-3.5)', async () => {
    const res = await runBaotaSync({
      configPath: path.resolve(__dirname, '__non_existent_config__.json'),
      mdPath: sampleMdPath,
      outDir: tmpOutDir,
      silent: true,
    });

    expect(res.ok).toBe(true);
    expect(res.mode).toBe('fallback_zip');
    expect(res.zipPath).toBeTruthy();
    expect(fs.existsSync(res.zipPath!)).toBe(true);
    expect(res.fallbackReason).toContain('未检测到有效宝塔 SSH 配置');
    expect(Array.isArray(res.manualSteps)).toBe(true);
    expect(res.manualSteps!.length).toBeGreaterThanOrEqual(3);
    expect(res.manualSteps![0]).toContain('登录您的宝塔 Linux 面板');
    expect(res.manualSteps![1]).toContain('/www/wwwroot/post-hub');
    expect(res.manualSteps![2]).toContain('update.zip');
  }, 15000);

  it('T-06: 模拟网络超时异常，系统零崩溃并输出手动部署指引 (AC-3.3 & AC-3.4)', async () => {
    // 写入一个指向不可达 IP 的测试配置
    const mockConfigPath = path.resolve(tmpRoot, 'mock-unreachable.json');
    if (!fs.existsSync(tmpRoot)) {
      fs.mkdirSync(tmpRoot, { recursive: true });
    }
    fs.writeFileSync(
      mockConfigPath,
      JSON.stringify({
        server: {
          host: '192.0.2.1', // TEST-NET-1 非路由地址，网络不可达
          port: 22,
          username: 'root',
        },
      }),
      'utf8'
    );

    const startTime = Date.now();
    const res = await runBaotaSync({
      configPath: mockConfigPath,
      mdPath: sampleMdPath,
      outDir: tmpOutDir,
      silent: true,
      timeoutMs: 800, // 800ms 快速超时验证
    });
    const elapsed = Date.now() - startTime;

    expect(res.ok).toBe(true);
    expect(res.mode).toBe('fallback_zip');
    expect(res.zipPath).toBeTruthy();
    expect(fs.existsSync(res.zipPath!)).toBe(true);
    expect(res.fallbackReason).toBeTruthy();
    expect(elapsed).toBeLessThan(4000); // 远小于 5 秒卡死
  }, 15000);

  it('T-07: 配置加载优先级与缺省安全隔离', () => {
    const nonExistent = loadBaotaConfig('__not_found__.json');
    // 若没有环境变量且无配置文件，返回 null
    if (!process.env.BAOTA_SSH_HOST) {
      expect(nonExistent).toBeNull();
    }
  });
});
