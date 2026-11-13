/**
 * Worker 本机配置（02 / 04）
 * Cookie / 用户目录仅本机，无上传远端逻辑。
 */
import path from 'path';
import os from 'os';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const WORKER_HOST = '127.0.0.1';
export const WORKER_PORT = Number(process.env.XHS_DRAFT_WORKER_PORT || 3722);

export const PROFILES_ROOT = path.resolve(__dirname, '../profiles');

let currentActiveAccountId = 'acc_01';

export function setCurrentActiveAccountId(id: string): void {
  if (id && typeof id === 'string') {
    currentActiveAccountId = id;
  }
}

export function getCurrentActiveAccountId(): string {
  return currentActiveAccountId;
}

export function getAccountProfileDir(accountId?: string): string {
  const id = accountId || currentActiveAccountId || 'acc_01';
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(PROFILES_ROOT, safeId);
}

/** 账号专属 Chrome 用户数据目录（可环境变量覆盖） */
export function chromeUserDataDir(accountId?: string): string {
  if (process.env.XHS_CHROME_USER_DATA_DIR) {
    return process.env.XHS_CHROME_USER_DATA_DIR;
  }
  return getAccountProfileDir(accountId);
}

export const CREATOR_PUBLISH_URL =
  process.env.XHS_CREATOR_PUBLISH_URL ||
  'https://creator.xiaohongshu.com/publish/publish?from=menu&target=image';

export function getRuntimeDir(): string {
  return (
    process.env.XHS_DRAFT_RUNTIME_DIR ||
    path.join(REPO_ROOT, '.scratch/xhs-draft-autofill/runtime')
  );
}

/** @deprecated 请优先 getRuntimeDir()；保留兼容 */
const RUNTIME_DIR = getRuntimeDir();

export function getScreenshotDir(): string {
  return path.join(getRuntimeDir(), 'screenshots');
}

const SCREENSHOT_DIR = getScreenshotDir();

export const DEFAULT_IMAGE_SERVER =
  process.env.XHS_IMAGE_SERVER || 'http://127.0.0.1:8768';

/** 复用技能侧 draft-one-card 配方 */
export const DRAFT_ONE_CARD_PATH = path.join(
  REPO_ROOT,
  '.agent/skills/xhs-note-operator/scripts/draft-one-card.js'
);

/**
 * 默认 19222，避开日常/Antigravity Chrome 常用的 9222，
 * 防止 worker 误连主浏览器导致 /login 挂死。
 */
export const CDP_DEBUG_PORT = Number(
  process.env.XHS_CHROME_CDP_PORT || 19222
);
