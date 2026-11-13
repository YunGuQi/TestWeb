/**
 * Chrome 持久配置 + 登录检测/扫码闸门（工单 02）
 * 登录态不出本机、不同步服务器。
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, type ChildProcess } from 'child_process';
import {
  CDP_DEBUG_PORT,
  CREATOR_PUBLISH_URL,
  getScreenshotDir,
  chromeUserDataDir,
} from './config';
import {
  getActiveAccount,
  updateAccount,
  type AccountMeta,
} from './accounts';

export type LoginStatus = 'logged_in' | 'need_qr' | 'unknown' | 'offline';

export interface SessionSnapshot {
  status: LoginStatus;
  userDataDir: string;
  publishUrl: string;
  cdpPort: number;
  qrScreenshotPath?: string | null;
  qrDataUrl?: string | null;
  message: string;
  cookieStaysLocal: true;
  at: string;
  account?: AccountMeta | null;
}

export type LocatorLike = {
  click: (opts?: { delay?: number; timeout?: number }) => Promise<void>;
  fill: (value: string, opts?: { timeout?: number }) => Promise<void>;
  focus: (opts?: { timeout?: number }) => Promise<void>;
  first: () => LocatorLike;
  setInputFiles?: (files: string | string[]) => Promise<void>;
  scrollIntoViewIfNeeded?: () => Promise<void>;
  isVisible?: () => Promise<boolean>;
  count?: () => Promise<number>;
  textContent?: () => Promise<string | null>;
  innerText?: () => Promise<string>;
};

export type KeyboardLike = {
  press: (key: string, opts?: { delay?: number }) => Promise<void>;
  type: (text: string, opts?: { delay?: number }) => Promise<void>;
  down?: (key: string) => Promise<void>;
  up?: (key: string) => Promise<void>;
};

export type PageLike = {
  goto: (url: string, opts?: object) => Promise<unknown>;
  url: () => string;
  content: () => Promise<string>;
  evaluate: <T>(fn: (...args: any[]) => T | Promise<T>, ...args: any[]) => Promise<T>;
  screenshot: (opts: { path: string; fullPage?: boolean; timeout?: number }) => Promise<unknown>;
  locator?: (selector: string, opts?: { hasText?: string | RegExp }) => LocatorLike;
  keyboard?: KeyboardLike;
  waitForTimeout?: (ms: number) => Promise<void>;
  bringToFront?: () => Promise<void>;
  setInputFiles?: (selector: string, files: string | string[]) => Promise<void>;
};

type ContextLike = {
  newPage: () => Promise<PageLike>;
  pages: () => PageLike[] | Promise<PageLike[]>;
};

type BrowserLike = {
  newPage?: () => Promise<PageLike>;
  pages?: () => Promise<PageLike[]>;
  contexts?: () => ContextLike[];
  close: () => Promise<void>;
  on?: (ev: string, fn: (...a: unknown[]) => void) => void;
};

async function listPages(b: BrowserLike): Promise<PageLike[]> {
  // connectOverCDP：pages 在 context 上；launch 直连偶有 browser.pages
  if (typeof b.contexts === 'function') {
    const ctxs = b.contexts();
    const out: PageLike[] = [];
    for (const c of ctxs) {
      const ps = await Promise.resolve(c.pages());
      out.push(...ps);
    }
    return out;
  }
  if (typeof b.pages === 'function') {
    return b.pages();
  }
  return [];
}

async function openNewPage(b: BrowserLike): Promise<PageLike> {
  if (typeof b.contexts === 'function') {
    const ctxs = b.contexts();
    const ctx = ctxs[0];
    if (ctx) return ctx.newPage();
  }
  if (typeof b.newPage === 'function') return b.newPage();
  throw new Error('无法 newPage：CDP browser 无可用 context');
}

let browser: BrowserLike | null = null;
let chromeProc: ChildProcess | null = null;
let lastSnapshot: SessionSnapshot | null = null;
const gateListeners = new Set<(ev: SessionSnapshot) => void>();

const CDP_CONNECT_TIMEOUT_MS = 4_000;
const GOTO_TIMEOUT_MS = 25_000;

export function onGateEvent(fn: (ev: SessionSnapshot) => void): () => void {
  gateListeners.add(fn);
  return () => gateListeners.delete(fn);
}

function emitGate(ev: SessionSnapshot) {
  lastSnapshot = ev;
  for (const fn of gateListeners) {
    try {
      fn(ev);
    } catch {
      /* ignore */
    }
  }
}

function findChromeExecutable(): string | null {
  if (process.env.XHS_CHROME_PATH) return process.env.XHS_CHROME_PATH;
  const candidates = [
    'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    path.join(
      process.env.LOCALAPPDATA || '',
      'Google/Chrome/Application/chrome.exe'
    ),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} 超时 ${ms}ms`)),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/** 探测 CDP HTTP 是否为本机目标端口且可响应（快速失败） */
async function probeCdpHttp(port: number): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return false;
    const body = (await res.json()) as { Browser?: string };
    return Boolean(body?.Browser);
  } catch {
    return false;
  }
}

async function tryConnectPlaywright(
  endpoint: string
): Promise<BrowserLike | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pw = require('playwright') as {
      chromium: {
        connectOverCDP: (u: string) => Promise<BrowserLike>;
      };
    };
    return await withTimeout(
      pw.chromium.connectOverCDP(endpoint),
      CDP_CONNECT_TIMEOUT_MS,
      `CDP connect ${endpoint}`
    );
  } catch {
    return null;
  }
}

export const CHROME_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-first-run',
  '--no-default-browser-check',
];

export function getOldAppDataProfileDir(): string {
  const base =
    process.env.LOCALAPPDATA ||
    process.env.APPDATA ||
    path.join(os.homedir(), 'AppData', 'Local');
  return path.join(base, 'XhsDraftConsole', 'chrome-profile');
}

export function migrateOldProfileIfNeeded(
  targetDir: string,
  customOldDir?: string
): boolean {
  try {
    const oldDir = customOldDir || getOldAppDataProfileDir();
    if (!fs.existsSync(oldDir)) return false;
    const oldFiles = fs.readdirSync(oldDir);
    if (oldFiles.length === 0) return false;

    // 若目标目录已存在且有内容，不重复覆盖
    if (fs.existsSync(targetDir)) {
      const targetFiles = fs.readdirSync(targetDir);
      if (targetFiles.length > 0) return false;
    }

    fs.mkdirSync(targetDir, { recursive: true });

    copyRecursiveSync(oldDir, targetDir);

    const flagFile = path.join(targetDir, 'migrated_from_appdata.flag');
    fs.writeFileSync(flagFile, new Date().toISOString(), 'utf8');
    console.log(`[Migration] 老 Profile 数据已平迁至: ${targetDir}`);
    return true;
  } catch (e) {
    console.warn('[Migration] 老 Profile 数据平迁遇到非致命异常:', e);
    return false;
  }
}

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = stats && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    for (const childItemName of fs.readdirSync(src)) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

export async function closeCurrentBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close().catch(() => {});
    } catch {}
    browser = null;
  }
  if (chromeProc) {
    try {
      chromeProc.kill('SIGTERM');
    } catch {}
    chromeProc = null;
  }
  // 等待端口释放（最多 2 秒）
  for (let i = 0; i < 10; i++) {
    const busy = await probeCdpHttp(CDP_DEBUG_PORT);
    if (!busy) break;
    await new Promise((r) => setTimeout(r, 200));
  }
}

export function launchVisibleBrowser(accountId?: string): ChildProcess {
  const exe = findChromeExecutable();
  if (!exe) {
    throw new Error('未找到 Chrome 可执行文件；请设置环境变量 XHS_CHROME_PATH');
  }
  const targetDir = chromeUserDataDir(accountId);
  fs.mkdirSync(targetDir, { recursive: true });

  const args = [
    `--user-data-dir=${targetDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    'https://creator.xiaohongshu.com',
  ];

  const proc = spawn(exe, args, {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();
  return proc;
}

async function launchChromeWithProfile(accountId?: string): Promise<void> {
  const exe = findChromeExecutable();
  if (!exe) {
    throw new Error(
      '未找到 Chrome 可执行文件；请设置环境变量 XHS_CHROME_PATH'
    );
  }
  const userDataDir = chromeUserDataDir(accountId);
  if (!accountId || accountId === 'acc_01') {
    migrateOldProfileIfNeeded(userDataDir);
  }
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.mkdirSync(getScreenshotDir(), { recursive: true });

  const args = [
    `--remote-debugging-port=${CDP_DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    // 降低 HTTPS→本机 HTTP 图片服务被 Private Network Access 拦截概率（切片仍优先走 setInputFiles）
    '--disable-features=PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests',
    CREATOR_PUBLISH_URL,
  ];
  chromeProc = spawn(exe, args, {
    detached: true,
    stdio: 'ignore',
  });
  chromeProc.unref();
  // 等待 CDP 就绪（约 20s）
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (!(await probeCdpHttp(CDP_DEBUG_PORT))) continue;
    const b = await tryConnectPlaywright(`http://127.0.0.1:${CDP_DEBUG_PORT}`);
    if (b) {
      browser = b;
      return;
    }
  }
  throw new Error(
    `Chrome CDP 端口 ${CDP_DEBUG_PORT} 未就绪（user-data-dir=${userDataDir}）`
  );
}

export async function ensureBrowser(accountId?: string): Promise<BrowserLike> {
  if (browser) return browser;
  const endpoint = `http://127.0.0.1:${CDP_DEBUG_PORT}`;
  // 先快速探测，避免对占用端口的「别人的 Chrome」长时间挂起
  if (await probeCdpHttp(CDP_DEBUG_PORT)) {
    const existing = await tryConnectPlaywright(endpoint);
    if (existing) {
      browser = existing;
      return browser;
    }
  }
  await launchChromeWithProfile(accountId);
  if (!browser) throw new Error('无法附着 Chrome');
  return browser;
}

/** 优先选创作者发布页，避免误用 pages[0]（可能是空白/其他站） */
async function pickCreatorPage(b: BrowserLike): Promise<PageLike> {
  const pages = await listPages(b);
  const creator = pages.find((p) => {
    try {
      const u = p.url();
      return /creator\.xiaohongshu\.com/i.test(u);
    } catch {
      return false;
    }
  });
  if (creator) return creator;
  if (pages[0]) return pages[0];
  return openNewPage(b);
}

async function detectLoginOnPage(page: PageLike): Promise<{
  status: LoginStatus;
  hint: string;
}> {
  const url = page.url();
  const html = await page.content().catch(() => '');
  const text = await page
    .evaluate(() => document.body?.innerText?.slice(0, 4000) || '')
    .catch(() => '');

  // 强登录信号：侧栏已出 / 编辑区可见（勿被页脚「扫码」误伤）
  const contentLogged =
    /填写标题|文字配图|上传图文|添加商品|原创声明|发布笔记/.test(text) ||
    /图片编辑|生成图片|预览图片/.test(text);
  const chromeLoggedIn = /创作服务平台/.test(text) && !/扫码登录|请使用小红书扫码/.test(text);

  // 仅认明确登录墙文案 / passport URL；禁止用泛化「扫码|qrcode」扫整页 HTML
  const needQr =
    /扫码登录|请使用小红书扫码|请使用.*App扫码|登录后使用|短信登录|验证码登录/.test(
      text
    ) || /passport\.xiaohongshu\.com|\/login/.test(url);

  const urlLooksCreator = /creator\.xiaohongshu\.com\/publish/.test(url);

  if (needQr && !contentLogged) {
    return { status: 'need_qr', hint: '检测到登录/扫码页' };
  }
  if (contentLogged || (chromeLoggedIn && urlLooksCreator)) {
    return {
      status: 'logged_in',
      hint: contentLogged ? '创作者发布页要素可见' : '创作者壳已登录，编辑区加载中',
    };
  }
  if (urlLooksCreator) {
    return { status: 'unknown', hint: `publish URL 已到但编辑区未就绪 url=${url}` };
  }
  return { status: 'unknown', hint: `url=${url}` };
}

/** 等到「文字配图」可见，避免 SPA 未水合就注入 */
export async function waitForPublishEditor(
  page?: PageLike,
  timeoutMs = 50_000
): Promise<PageLike> {
  const b = await ensureBrowser();
  const p = page || (await pickCreatorPage(b));
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await p
      .evaluate(() => {
        const el = [...document.querySelectorAll('button,div,span')].find(
          (node) =>
            node.innerText?.trim() === '文字配图' &&
            node.getBoundingClientRect().width > 0
        );
        return Boolean(el);
      })
      .catch(() => false);
    if (ready) return p;

    // 若已经加载了主壳但仍处于骨架屏或菜单态，尝试唤起「上传图文」
    if (Date.now() - start > 8_000) {
      await p
        .evaluate(() => {
          const tab = [...document.querySelectorAll('div,span,button')].find(
            (n) =>
              n.innerText?.trim() === '上传图文' &&
              n.getBoundingClientRect().width > 0
          );
          if (tab) (tab as HTMLElement).click();
        })
        .catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('创作者编辑区未就绪：超时未出现「文字配图」');
}

export async function probeCreatorProfile(page: PageLike): Promise<{
  nickname?: string;
  avatarUrl?: string;
  redId?: string;
}> {
  try {
    const result = await page.evaluate(() => {
      let nickname = '';
      let avatarUrl = '';
      let redId = '';

      const avatarImg = document.querySelector<HTMLImageElement>(
        '.creator-header img, header img, [class*="avatar"] img, [class*="Avatar"] img, img[src*="avatar"], img[src*="xhscdn.com"]'
      );
      if (avatarImg && avatarImg.src) {
        avatarUrl = avatarImg.src;
      }

      const nameEl = document.querySelector<HTMLElement>(
        '.creator-header [class*="name"], header [class*="name"], [class*="user-name"], [class*="userName"], [class*="nickname"], [class*="Nickname"]'
      );
      if (nameEl && nameEl.innerText) {
        nickname = nameEl.innerText.trim();
      }

      const text = document.body?.innerText || '';
      const redMatch = text.match(/小红书号[：:\s]*([a-zA-Z0-9_-]+)/);
      if (redMatch && redMatch[1]) {
        redId = redMatch[1].trim();
      }

      return { nickname, avatarUrl, redId };
    });
    return result || {};
  } catch (e) {
    console.warn('[DOM Probe] 提取创作者资料优雅降级:', e);
    return {};
  }
}

function baseSnap(
  at: string,
  partial: Partial<SessionSnapshot> &
    Pick<SessionSnapshot, 'status' | 'message'>
): SessionSnapshot {
  let account: AccountMeta | null = null;
  try {
    account = getActiveAccount();
  } catch {}
  return {
    userDataDir: chromeUserDataDir(),
    publishUrl: CREATOR_PUBLISH_URL,
    cdpPort: CDP_DEBUG_PORT,
    qrScreenshotPath: null,
    qrDataUrl: null,
    cookieStaysLocal: true,
    at,
    account,
    ...partial,
  };
}

export async function checkLogin(opts?: {
  navigate?: boolean;
  captureQr?: boolean;
}): Promise<SessionSnapshot> {
  const at = new Date().toISOString();
  try {
    const b = await ensureBrowser();
    const page = await pickCreatorPage(b);
    if (opts?.navigate !== false) {
      await page.goto(CREATOR_PUBLISH_URL, {
        waitUntil: 'domcontentloaded',
        timeout: GOTO_TIMEOUT_MS,
      });
      await new Promise((r) => setTimeout(r, 800));
      // 尽量等到编辑区；失败不在此处抛——交给 detect + assert
      await waitForPublishEditor(page, 12_000).catch(() => page);
    }
    const det = await detectLoginOnPage(page);
    let qrScreenshotPath: string | null = null;
    let qrDataUrl: string | null = null;
    if (det.status === 'need_qr' && opts?.captureQr !== false) {
      // 仅扫码场景才前置窗口，方便大哥扫码；日常跑卡不置顶
      await activatePage(page);
      fs.mkdirSync(getScreenshotDir(), { recursive: true });
      qrScreenshotPath = path.join(
        getScreenshotDir(),
        `login-qr-${Date.now()}.png`
      );
      await page.screenshot({ path: qrScreenshotPath, fullPage: true });
      if (fs.existsSync(qrScreenshotPath)) {
        try {
          const imgBuf = fs.readFileSync(qrScreenshotPath);
          qrDataUrl = `data:image/png;base64,${imgBuf.toString('base64')}`;
        } catch {}
      }
    }

    let account: AccountMeta | null = null;
    if (det.status === 'logged_in') {
      try {
        const probed = await probeCreatorProfile(page);
        const active = getActiveAccount();
        if (active) {
          account = updateAccount(active.id, {
            ...(probed.nickname ? { nickname: probed.nickname } : {}),
            ...(probed.avatarUrl ? { avatarUrl: probed.avatarUrl } : {}),
            ...(probed.redId ? { redId: probed.redId } : {}),
            lastLoginAt: at,
          });
        }
      } catch (e) {
        console.warn('[Probe] 创作者资料自动更新异常:', e);
      }
    }
    if (!account) {
      try {
        account = getActiveAccount();
      } catch {}
    }

    const snap = baseSnap(at, {
      status: det.status,
      message: `${det.hint}；CDP=${CDP_DEBUG_PORT}`,
      qrScreenshotPath,
      qrDataUrl,
      account,
    });
    if (det.status === 'need_qr' || det.status === 'offline') {
      emitGate(snap);
    } else {
      lastSnapshot = snap;
    }
    return snap;
  } catch (e) {
    // 连接失败时丢掉坏缓存，下次可重试/重启
    browser = null;
    const snap = baseSnap(at, {
      status: 'offline',
      message: String((e as Error).message || e),
    });
    emitGate(snap);
    return snap;
  }
}

/** 开跑前闸门：未登录则拒绝；并强制编辑区就绪；日常跑卡不强制捕获QR避免置顶窗口 */
export async function assertLoggedInForRun(): Promise<SessionSnapshot> {
  const snap = await checkLogin({ navigate: true, captureQr: false });
  if (snap.status !== 'logged_in') {
    const err = new Error(
      `登录闸门未通过：${snap.status} — ${snap.message}` +
        (snap.qrScreenshotPath ? `；扫码截图: ${snap.qrScreenshotPath}` : '')
    );
    (err as Error & { snapshot: SessionSnapshot }).snapshot = snap;
    throw err;
  }
  await waitForPublishEditor(undefined, 20_000);
  return snap;
}

export function getLastSession(): SessionSnapshot | null {
  return lastSnapshot;
}

/** 仅在扫码等确需人眼可见时调用；默认跑卡路径禁止置顶/恢复最大化 */
async function activatePage(page: PageLike): Promise<void> {
  const withFront = page as PageLike & { bringToFront?: () => Promise<void> };
  if (typeof withFront.bringToFront === 'function') {
    await withFront.bringToFront().catch(() => undefined);
  }
}

export async function getActivePage(opts?: {
  /** 默认 false：最小化时不弹窗置顶；扫码登录可传 true */
  activate?: boolean;
}): Promise<PageLike> {
  const b = await ensureBrowser();
  const page = await pickCreatorPage(b);
  if (opts?.activate) {
    await activatePage(page);
  }
  return page;
}

export async function evaluateOnPage<T>(
  expression: string
): Promise<T> {
  // 热路径不 activate，避免最小化浏览器被强行前置
  const page = await getActivePage();
  // Runtime.evaluate 风格：expression 为 async IIFE 字符串
  return page.evaluate((expr: string) => {
    // eslint-disable-next-line no-eval
    return eval(expr);
  }, expression) as Promise<T>;
}

/** 文档约定摘要（供 README / API） */
export const CHROME_SESSION_DOCS = {
  defaultUserDataDirWindows:
    '%LOCALAPPDATA%\\XhsDraftConsole\\chrome-profile',
  defaultCdpPort: 19222,
  envOverrides: ['XHS_CHROME_USER_DATA_DIR', 'XHS_CHROME_PATH', 'XHS_CHROME_CDP_PORT'],
  cookiePolicy: 'Cookie/用户目录仅本机；无上传远端逻辑',
  loginGate: 'need_qr 时拒绝开跑；扫码后复检可变为 logged_in',
  note: '勿与日常/Antigravity Chrome 共用 9222；默认 19222 + 孤立 profile',
};
