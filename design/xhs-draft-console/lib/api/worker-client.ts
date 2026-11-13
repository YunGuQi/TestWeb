/** 控制台 → worker HTTP 客户端（本机 3722） */

export const WORKER_BASE =
  process.env.NEXT_PUBLIC_WORKER_BASE || 'http://127.0.0.1:3722';

export class WorkerUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerUnreachableError';
  }
}

export type CardOverridePayload = {
  cardId: string;
  coverLines?: string[];
  title?: string;
  body?: string;
  topics?: string[];
};

export type EnqueueRunBody = {
  mdPath: string;
  n?: number;
  mode?: 'draft' | 'ready';
  intervalMs?: [number, number];
  cardsDir?: string;
  scheduleAt?: string;
  platformScheduleAt?: string;
  cardIds?: string[];
  cardOverrides?: CardOverridePayload[];
};

async function fetchWorker(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${WORKER_BASE}${path}`, {
      ...init,
      cache: 'no-store',
    });
  } catch (e) {
    throw new WorkerUnreachableError(
      `worker 不可达 (${WORKER_BASE}): ${String((e as Error).message || e)}。请先在同机启动 npm run worker`
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data && (data.err || data.message)) || `HTTP ${res.status}`
    ) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getLoginStatus(refresh = true) {
  return fetchWorker(`/login?refresh=${refresh ? '1' : '0'}`);
}

export async function getRunStatus(runId?: string) {
  const q = runId ? `?runId=${encodeURIComponent(runId)}` : '';
  return fetchWorker(`/run${q}`);
}

export async function enqueueRun(body: EnqueueRunBody) {
  return fetchWorker('/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function healthCheck() {
  return fetchWorker('/health');
}

export interface AccountItem {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  redId?: string;
  profileDir: string;
  createdAt: string;
  lastLoginAt?: string;
}

export async function getAccounts(): Promise<{
  ok: boolean;
  activeId: string;
  accounts: AccountItem[];
}> {
  return fetchWorker('/accounts');
}

export async function switchAccount(accountId: string): Promise<{
  ok: boolean;
  activeId: string;
  account: AccountItem;
}> {
  return fetchWorker('/accounts/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
}

export async function createAccount(name?: string): Promise<{
  ok: boolean;
  account: AccountItem;
}> {
  return fetchWorker('/accounts/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function updateAccountMeta(
  id: string,
  patch: Partial<AccountItem>
): Promise<{
  ok: boolean;
  account: AccountItem;
}> {
  return fetchWorker('/accounts/update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, patch }),
  });
}

export async function launchBrowser(accountId?: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  return fetchWorker('/launch-browser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
}

export async function openNativePicker(
  mode: 'file' | 'directory' = 'file',
  defaultPath?: string
): Promise<{ path: string | null; cancelled: boolean; error?: string }> {
  try {
    const res = await fetch('/api/dialog/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, defaultPath }),
    });
    if (!res.ok) {
      return { path: null, cancelled: true, error: `HTTP ${res.status}` };
    }
    return (await res.json()) as {
      path: string | null;
      cancelled: boolean;
      error?: string;
    };
  } catch (e) {
    return {
      path: null,
      cancelled: true,
      error: String((e as Error).message || e),
    };
  }
}

export async function triggerNextRun(): Promise<{ ok: boolean; msg: string }> {
  return fetchWorker('/run/trigger-next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface RetryRunOptions {
  runId?: string;
  cardId?: string;
  mode?: 'resume_remaining' | 'card_only';
}

export async function retryRun(
  options: RetryRunOptions = {}
): Promise<{ ok: boolean; run?: unknown; err?: string; code?: string }> {
  return fetchWorker('/run/retry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
}

export async function resumeRun(
  runId?: string
): Promise<{ ok: boolean; run?: unknown; err?: string }> {
  return fetchWorker('/run/resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId }),
  });
}

export async function cancelRun(
  runId?: string
): Promise<{ ok: boolean; msg: string }> {
  return fetchWorker('/run/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId }),
  });
}

export async function fetchScannedPresets(): Promise<
  Array<{
    id: string;
    name: string;
    category: string;
    mdPath: string;
    cardsDir: string;
  }>
> {
  try {
    const res = await fetch('/api/presets');
    if (!res.ok) return [];
    const data = await res.json();
    return data.presets || [];
  } catch {
    return [];
  }
}

