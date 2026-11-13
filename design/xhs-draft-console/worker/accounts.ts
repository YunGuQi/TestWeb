/**
 * 多账号元数据持久化管理（工单 03）
 * 持久化至 design/xhs-draft-console/accounts.json
 */
import fs from 'fs';
import path from 'path';
import { setCurrentActiveAccountId, getAccountProfileDir } from './config';

export interface AccountMeta {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  redId?: string;
  profileDir: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AccountsStore {
  activeId: string;
  accounts: AccountMeta[];
}

export function getAccountsFilePath(): string {
  if (process.env.XHS_ACCOUNTS_FILE_PATH) {
    return process.env.XHS_ACCOUNTS_FILE_PATH;
  }
  return path.resolve(__dirname, '../accounts.json');
}

export function getDefaultAccountsStore(): AccountsStore {
  return {
    activeId: 'acc_01',
    accounts: [
      {
        id: 'acc_01',
        name: '安安 (老号)',
        nickname: '安安',
        avatarUrl: '',
        redId: '',
        profileDir: 'profiles/acc_01',
        createdAt: new Date().toISOString(),
        lastLoginAt: '',
      },
    ],
  };
}

let inMemoryStore: AccountsStore | null = null;

export function loadAccounts(): AccountsStore {
  const filePath = getAccountsFilePath();
  try {
    if (!fs.existsSync(filePath)) {
      const def = getDefaultAccountsStore();
      saveAccounts(def);
      inMemoryStore = def;
      return def;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as AccountsStore;
    if (!parsed || !Array.isArray(parsed.accounts) || parsed.accounts.length === 0) {
      const def = getDefaultAccountsStore();
      saveAccounts(def);
      inMemoryStore = def;
      return def;
    }
    // 确保 activeId 有效
    if (!parsed.accounts.some((a) => a.id === parsed.activeId)) {
      parsed.activeId = parsed.accounts[0].id;
      saveAccounts(parsed);
    }
    inMemoryStore = parsed;
    setCurrentActiveAccountId(parsed.activeId);
    return parsed;
  } catch (e) {
    console.warn(`[Accounts] 读取 ${filePath} 失败，回退至默认配置:`, e);
    const def = getDefaultAccountsStore();
    inMemoryStore = def;
    setCurrentActiveAccountId(def.activeId);
    return def;
  }
}

export function saveAccounts(store: AccountsStore): void {
  const filePath = getAccountsFilePath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  inMemoryStore = store;
  setCurrentActiveAccountId(store.activeId);

  const content = JSON.stringify(store, null, 2);
  const tmpPath = `${filePath}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;

  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    try {
      fs.renameSync(tmpPath, filePath);
    } catch {
      // Windows 锁文件降级
      fs.copyFileSync(tmpPath, filePath);
      try {
        fs.unlinkSync(tmpPath);
      } catch {}
    }
  } catch (e) {
    console.error(`[Accounts] 保存 ${filePath} 异常:`, e);
    // 兜底直接覆盖
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

export function getActiveAccount(): AccountMeta {
  const store = inMemoryStore || loadAccounts();
  const active = store.accounts.find((a) => a.id === store.activeId);
  if (active) return active;
  return store.accounts[0];
}

export function setActiveAccount(id: string): AccountMeta {
  const store = loadAccounts();
  const target = store.accounts.find((a) => a.id === id);
  if (!target) {
    throw new Error(`账号不存在: ${id}`);
  }
  store.activeId = id;
  saveAccounts(store);
  return target;
}

export function createAccount(name?: string): AccountMeta {
  const store = loadAccounts();
  // 计算下一个序号，如 acc_01, acc_02 ...
  let maxNum = 0;
  for (const a of store.accounts) {
    const match = a.id.match(/^acc_(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const nextNum = maxNum + 1;
  const newId = `acc_${String(nextNum).padStart(2, '0')}`;
  const profileDir = `profiles/${newId}`;

  // 确保物理目录存在
  const absProfileDir = getAccountProfileDir(newId);
  fs.mkdirSync(absProfileDir, { recursive: true });

  const newAccount: AccountMeta = {
    id: newId,
    name: name?.trim() || `账号 ${nextNum}`,
    nickname: '',
    avatarUrl: '',
    redId: '',
    profileDir,
    createdAt: new Date().toISOString(),
    lastLoginAt: '',
  };

  store.accounts.push(newAccount);
  saveAccounts(store);
  return newAccount;
}

export function updateAccount(
  id: string,
  patch: Partial<Omit<AccountMeta, 'id' | 'profileDir'>>
): AccountMeta {
  const store = loadAccounts();
  const acc = store.accounts.find((a) => a.id === id);
  if (!acc) {
    throw new Error(`账号不存在: ${id}`);
  }
  if (patch.name !== undefined) acc.name = patch.name;
  if (patch.nickname !== undefined) acc.nickname = patch.nickname;
  if (patch.avatarUrl !== undefined) acc.avatarUrl = patch.avatarUrl;
  if (patch.redId !== undefined) acc.redId = patch.redId;
  if (patch.lastLoginAt !== undefined) acc.lastLoginAt = patch.lastLoginAt;

  saveAccounts(store);
  return acc;
}
