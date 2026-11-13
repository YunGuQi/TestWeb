import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  loadAccounts,
  saveAccounts,
  createAccount,
  updateAccount,
  setActiveAccount,
  getActiveAccount,
  getAccountsFilePath,
} from '../worker/accounts';
import {
  PROFILES_ROOT,
  getAccountProfileDir,
  setCurrentActiveAccountId,
  getCurrentActiveAccountId,
} from '../worker/config';
import { CHROME_ARGS, migrateOldProfileIfNeeded } from '../worker/chrome-session';

const testAccountsFile = path.resolve(__dirname, '../.tmp-test-accounts.json');
const testOldDir = path.resolve(__dirname, '../.tmp-test-old-profile');
const testNewDir = path.resolve(__dirname, '../.tmp-test-new-profile');

describe('多账号管理与 Profile 硬隔离 (工单 01 & 03)', () => {
  beforeEach(() => {
    process.env.XHS_ACCOUNTS_FILE_PATH = testAccountsFile;
    if (fs.existsSync(testAccountsFile)) {
      try {
        fs.unlinkSync(testAccountsFile);
      } catch {}
    }
    if (fs.existsSync(testOldDir)) {
      try {
        fs.rmSync(testOldDir, { recursive: true, force: true });
      } catch {}
    }
    if (fs.existsSync(testNewDir)) {
      try {
        fs.rmSync(testNewDir, { recursive: true, force: true });
      } catch {}
    }
  });

  afterEach(() => {
    delete process.env.XHS_ACCOUNTS_FILE_PATH;
    if (fs.existsSync(testAccountsFile)) {
      try {
        fs.unlinkSync(testAccountsFile);
      } catch {}
    }
    if (fs.existsSync(testOldDir)) {
      try {
        fs.rmSync(testOldDir, { recursive: true, force: true });
      } catch {}
    }
    if (fs.existsSync(testNewDir)) {
      try {
        fs.rmSync(testNewDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it('T-01: Chrome 启动参数抹除 AutomationControlled 指纹', () => {
    expect(CHROME_ARGS).toContain('--disable-blink-features=AutomationControlled');
  });

  it('T-02: 账号 Profile 路径物理硬隔离', () => {
    const dir1 = getAccountProfileDir('acc_01');
    const dir2 = getAccountProfileDir('acc_02');

    expect(dir1).toContain('acc_01');
    expect(dir2).toContain('acc_02');
    expect(dir1).not.toBe(dir2);
    expect(path.dirname(dir1)).toBe(PROFILES_ROOT);
  });

  it('T-03: 账号元数据增改查与持久化', () => {
    const initial = loadAccounts();
    expect(initial.activeId).toBe('acc_01');
    expect(initial.accounts.length).toBeGreaterThanOrEqual(1);

    const created = createAccount('测试新号_02');
    expect(created.id).toBe('acc_02');
    expect(created.name).toBe('测试新号_02');

    const updated = updateAccount('acc_02', {
      nickname: '小红书测试达人',
      redId: '123456789',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(updated.nickname).toBe('小红书测试达人');
    expect(updated.redId).toBe('123456789');

    setActiveAccount('acc_02');
    expect(getActiveAccount().id).toBe('acc_02');
    expect(getCurrentActiveAccountId()).toBe('acc_02');

    // 重新从磁盘读取，验证持久化
    const reloaded = loadAccounts();
    expect(reloaded.activeId).toBe('acc_02');
    const target = reloaded.accounts.find((a) => a.id === 'acc_02');
    expect(target).toBeDefined();
    expect(target?.nickname).toBe('小红书测试达人');
    expect(target?.redId).toBe('123456789');
  });

  it('T-04: 旧 AppData 数据平迁逻辑', () => {
    const uniqueOldDir = path.resolve(__dirname, `../.tmp-test-old-${Date.now()}`);
    const uniqueNewDir = path.resolve(__dirname, `../.tmp-test-new-${Date.now()}`);

    fs.mkdirSync(uniqueOldDir, { recursive: true });
    fs.writeFileSync(path.join(uniqueOldDir, 'cookie_dummy.txt'), 'old-session-data', 'utf8');

    // 目标不存在时执行迁移 (参数: targetDir, customOldDir)
    migrateOldProfileIfNeeded(uniqueNewDir, uniqueOldDir);
    expect(fs.existsSync(path.join(uniqueNewDir, 'cookie_dummy.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(uniqueNewDir, 'cookie_dummy.txt'), 'utf8')).toBe('old-session-data');

    // 再次调用时不重复覆盖
    fs.writeFileSync(path.join(uniqueNewDir, 'cookie_dummy.txt'), 'new-session-data', 'utf8');
    migrateOldProfileIfNeeded(uniqueNewDir, uniqueOldDir);
    expect(fs.readFileSync(path.join(uniqueNewDir, 'cookie_dummy.txt'), 'utf8')).toBe('new-session-data');

    // 清理
    try {
      fs.rmSync(uniqueOldDir, { recursive: true, force: true });
      fs.rmSync(uniqueNewDir, { recursive: true, force: true });
    } catch {}
  });
});
