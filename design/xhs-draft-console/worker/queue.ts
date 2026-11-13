/**
 * 任务队列 worker 核心（工单 04 + 09/10 发布中心增量）
 * JSON 落 .scratch/xhs-draft-autofill/runtime/
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getRuntimeDir } from './config';
import { assertLoggedInForRun, onGateEvent, type SessionSnapshot } from './chrome-session';
import {
  executeOneCard,
  type ExecuteOneCardResult,
  type ExecutorCard,
  type RunMode,
} from './executor';
import {
  parseAndValidateCopyMd,
  pickRunnableCards,
} from '../lib/md/parse';
import type { ParsedCard } from '../lib/md/types';
import {
  mergeCardOverrides,
  validateCardOverrides,
  type CardOverride,
} from '../lib/run/overrides';

export type { CardOverride };

export interface RunConfig {
  mdPath: string;
  n?: number;
  mode?: RunMode;
  /** 条间间隔毫秒区间 [min, max]；默认 15～30 分钟 */
  intervalMs?: [number, number];
  cardsDir?: string;
  imageServer?: string;
  /** ISO 本机开跑时刻；缺省=立即。已过期 → 拒绝入队 */
  scheduleAt?: string;
  /** ISO；有值则填平台定时 UI；须配合 ready */
  platformScheduleAt?: string;
  /** 指定要跑的 cardId 列表（优先于盲取前 N 张） */
  cardIds?: string[];
  /** 本批覆盖（仅本 run；默认不写回 md 正文） */
  cardOverrides?: CardOverride[];
}

export type RunStatus =
  | 'queued'
  | 'scheduled'
  | 'running'
  | 'interrupted'
  | 'completed'
  | 'circuit_open'
  | 'rejected'
  | 'cancelled';

export interface RunCardProgress {
  cardId: string;
  title: string;
  status: 'pending' | 'running' | 'ok' | 'fail' | 'skipped';
  screenshotPath?: string | null;
  err?: string;
}

export interface RunState {
  runId: string;
  status: RunStatus;
  config: Required<Pick<RunConfig, 'mdPath' | 'n' | 'mode'>> & {
    intervalMs: [number, number];
    cardsDir?: string;
    scheduleAt?: string;
    platformScheduleAt?: string;
    cardIds?: string[];
    cardOverrides?: CardOverride[];
  };
  total: number;
  completed: number;
  currentCardId?: string;
  nextRunAt?: string;
  cards: RunCardProgress[];
  lastScreenshotPath?: string | null;
  circuitReason?: string;
  phase?: 'running' | 'cooldown' | 'interval';
  cooldownUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export const COOLDOWN_MIN_MS = 15_000;
export const COOLDOWN_MAX_MS = 35_000;

export function generateRandomCooldownMs(): number {
  return Math.floor(
    COOLDOWN_MIN_MS + Math.random() * (COOLDOWN_MAX_MS - COOLDOWN_MIN_MS)
  );
}

type Clock = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

const defaultClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) =>
    new Promise((r) =>
      setTimeout(r, process.env.VITEST ? 1 : ms)
    ),
};

let current: RunState | null = null;
let running = false;

export function isQueueActive(): boolean {
  if (running) return true;
  if (!current) return false;
  return (
    current.status === 'running' ||
    current.status === 'queued' ||
    current.status === 'scheduled'
  );
}

function ensureRuntime() {
  fs.mkdirSync(getRuntimeDir(), { recursive: true });
}

function runPath(runId: string) {
  return path.join(getRuntimeDir(), `run-${runId}.json`);
}

function latestPath() {
  return path.join(getRuntimeDir(), 'latest-run.json');
}

export function persistRun(state: RunState) {
  ensureRuntime();
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(runPath(state.runId), JSON.stringify(state, null, 2), 'utf8');
  fs.writeFileSync(latestPath(), JSON.stringify(state, null, 2), 'utf8');
  current = state;
}

export function getRunStatus(runId?: string): RunState | null {
  let state: RunState | null = null;
  if (runId) {
    if (current && current.runId === runId) {
      state = current;
    } else {
      const p = runPath(runId);
      if (fs.existsSync(p)) {
        try {
          state = JSON.parse(fs.readFileSync(p, 'utf8')) as RunState;
        } catch {}
      }
    }
  } else {
    if (current) {
      state = current;
    } else if (fs.existsSync(latestPath())) {
      try {
        state = JSON.parse(fs.readFileSync(latestPath(), 'utf8')) as RunState;
      } catch {}
    }
  }

  if (!state) return null;

  // 孤儿/中断任务智能识别与自愈检查：
  // 若内存中 worker 并没有在跑 (!running) 或正在跑其他 runId
  if (!running || (current && current.runId !== state.runId)) {
    const hasPendingOrRunning = (state.cards || []).some(
      (c) => c.status === 'pending' || c.status === 'running'
    );
    if (!hasPendingOrRunning) {
      if (state.status === 'running' || state.status === 'queued') {
        state.status = 'completed';
        state.nextRunAt = undefined;
        persistRun(state);
      }
    } else if (state.status === 'running') {
      const isExpired =
        !state.nextRunAt || Date.parse(state.nextRunAt) <= Date.now();
      if (isExpired) {
        state.status = 'interrupted';
        if (!state.circuitReason) {
          state.circuitReason = 'Worker 重启或执行中断，可断点续跑';
        }
        for (const c of state.cards) {
          if (c.status === 'running') {
            c.status = 'pending';
          }
        }
        persistRun(state);
      }
    }
  }

  return state;
}

/** 校验 scheduleAt：非法/已过期 → 拒绝（拍板：过期拒跑，不立即开跑） */
export function validateScheduleAt(
  scheduleAt: string | undefined,
  nowMs: number
): { ok: true; atMs?: number } | { ok: false; err: string } {
  if (scheduleAt == null || scheduleAt === '') return { ok: true };
  const atMs = Date.parse(scheduleAt);
  if (!Number.isFinite(atMs)) {
    return { ok: false, err: 'scheduleAt 非法 ISO 时刻' };
  }
  if (atMs < nowMs) {
    return { ok: false, err: 'scheduleAt 已过期，拒绝入队' };
  }
  return { ok: true, atMs };
}

export function validateRunConfig(
  config: RunConfig,
  nowMs: number = Date.now()
): {
  ok: true;
  n: number;
  mode: RunMode;
  intervalMs: [number, number];
  scheduleAtMs?: number;
} | { ok: false; err: string } {
  const n =
    config.cardIds && config.cardIds.length > 0
      ? config.cardIds.length
      : config.n == null
        ? 3
        : Number(config.n);
  if (!Number.isFinite(n) || n < 1 || n > 10) {
    return { ok: false, err: 'N 须在 1～10' };
  }
  const mode = config.mode || 'draft';
  if (mode !== 'draft' && mode !== 'ready') {
    return { ok: false, err: 'mode 仅 draft|ready' };
  }
  if (config.platformScheduleAt && mode === 'draft') {
    return {
      ok: false,
      err: 'platformScheduleAt 不可与 mode=draft 同用，请改用 ready（平台定时填完即停，不暂存）',
    };
  }
  if (config.platformScheduleAt) {
    const pt = Date.parse(config.platformScheduleAt);
    if (!Number.isFinite(pt)) {
      return { ok: false, err: 'platformScheduleAt 非法 ISO 时刻' };
    }
  }
  const sched = validateScheduleAt(config.scheduleAt, nowMs);
  if (!sched.ok) return sched;

  let intervalMs = config.intervalMs;
  if (!intervalMs) {
    intervalMs = [15 * 60 * 1000, 30 * 60 * 1000];
  }
  if (
    !Array.isArray(intervalMs) ||
    intervalMs.length !== 2 ||
    intervalMs[0] < 0 ||
    intervalMs[1] < intervalMs[0]
  ) {
    return { ok: false, err: 'intervalMs 须为 [min,max] 且 max>=min' };
  }
  if (!config.mdPath || !fs.existsSync(config.mdPath)) {
    return { ok: false, err: `md 不存在: ${config.mdPath}` };
  }
  return {
    ok: true,
    n,
    mode,
    intervalMs,
    scheduleAtMs: sched.atMs,
  };
}

function randomInterval([min, max]: [number, number], clock: Clock): number {
  if (max === min) return min;
  const t = clock.now();
  const r = (Math.sin(t) + 1) / 2;
  return Math.floor(min + r * (max - min));
}

/**
 * 单卡成功后的随机物理冷静期 (15~35s) 与发布间隔协同
 */
export async function runCooldownAndInterval(
  state: RunState,
  intervalMs: [number, number],
  clock: Clock
): Promise<'continue' | 'break'> {
  if (state.status === 'cancelled') {
    return 'break';
  }
  const cooldownMs = generateRandomCooldownMs();
  const now = clock.now();
  state.phase = 'cooldown';
  state.cooldownUntil = new Date(now + cooldownMs).toISOString();
  state.nextRunAt = state.cooldownUntil;
  persistRun(state);

  const sleepRes = await interruptibleSleep(cooldownMs, clock);
  state.phase = undefined;
  state.cooldownUntil = undefined;
  state.nextRunAt = undefined;
  persistRun(state);

  const live = getRunStatus(state.runId) || state;
  if (sleepRes === 'interrupted' || live.status === 'cancelled') {
    if (live.status === 'cancelled') {
      return 'break';
    }
  }

  const wait = randomInterval(intervalMs, clock);
  if (wait > 0) {
    state.phase = 'interval';
    state.nextRunAt = new Date(clock.now() + wait).toISOString();
    persistRun(state);
    const intervalSleepRes = await interruptibleSleep(wait, clock);
    state.phase = undefined;
    state.nextRunAt = undefined;
    persistRun(state);
    const liveAfter = getRunStatus(state.runId) || state;
    if (intervalSleepRes === 'interrupted' || liveAfter.status === 'cancelled') {
      if (liveAfter.status === 'cancelled') {
        return 'break';
      }
    }
  }
  return 'continue';
}

export type EnqueueDeps = {
  clock?: Clock;
  loginGate?: () => Promise<SessionSnapshot>;
  execute?: (
    card: ExecutorCard,
    mode: RunMode
  ) => Promise<ExecuteOneCardResult>;
  /** 测试用：同步跑完（仍走 sleep） */
  awaitCompletion?: boolean;
};

/**
 * 下发开跑。无 scheduleAt 时开跑前验登录；有未来 scheduleAt 则先入队 scheduled，到点后再验登录。
 */
export async function enqueueRun(
  config: RunConfig,
  deps: EnqueueDeps = {}
): Promise<RunState> {
  if (running) {
    throw Object.assign(new Error('已有任务在跑'), { code: 'BUSY' });
  }
  const clock = deps.clock || defaultClock;
  const v = validateRunConfig(config, clock.now());
  if (!v.ok) {
    throw Object.assign(new Error(v.err), { code: 'BAD_CONFIG' });
  }

  const deferredLogin = v.scheduleAtMs != null;
  const loginGate = deps.loginGate || assertLoggedInForRun;

  if (!deferredLogin) {
    try {
      await loginGate();
    } catch (e) {
      const state: RunState = {
        runId: randomUUID(),
        status: 'rejected',
        config: {
          mdPath: config.mdPath,
          n: v.n,
          mode: v.mode,
          intervalMs: v.intervalMs,
          cardsDir: config.cardsDir,
          scheduleAt: config.scheduleAt,
          platformScheduleAt: config.platformScheduleAt,
          cardIds: config.cardIds,
          cardOverrides: config.cardOverrides,
        },
        total: 0,
        completed: 0,
        cards: [],
        circuitReason: String((e as Error).message || e),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistRun(state);
      throw Object.assign(new Error(state.circuitReason), {
        code: 'NEED_LOGIN',
        run: state,
      });
    }
  }

  const mdText = fs.readFileSync(config.mdPath, 'utf8');
  const parsed = parseAndValidateCopyMd(mdText);

  let picked: ParsedCard[] = [];
  const targetCardIds =
    config.cardIds && config.cardIds.length > 0
      ? config.cardIds
      : config.cardOverrides && config.cardOverrides.length > 0
        ? config.cardOverrides.map((o) => o.cardId)
        : null;

  if (targetCardIds && targetCardIds.length > 0) {
    const cardMap = new Map(
      parsed.cards
        .filter((c) => c.meta?.cardId)
        .map((c) => [c.meta!.cardId!, c])
    );
    for (const id of targetCardIds) {
      const c = cardMap.get(id);
      if (!c) {
        throw Object.assign(new Error(`指定 cardId「${id}」在 md 中未找到`), {
          code: 'BAD_CONFIG',
        });
      }
      if (!c.runnable) {
        throw Object.assign(
          new Error(
            `指定 cardId「${id}」不可跑: ${c.skipReason || c.errors?.join('; ') || '不满足执行条件'}`
          ),
          { code: 'BAD_CONFIG' }
        );
      }
      picked.push(c);
    }
  } else {
    picked = pickRunnableCards(parsed, v.n);
  }

  const allowedIds = new Set(
    picked.map((c) => c.meta!.cardId!).filter(Boolean)
  );
  const ov = validateCardOverrides(config.cardOverrides, allowedIds);
  if (!ov.ok) {
    throw Object.assign(new Error(ov.err), { code: 'BAD_CONFIG' });
  }

  const overrideById = new Map(
    (config.cardOverrides || []).map((o) => [o.cardId, o])
  );

  const state: RunState = {
    runId: randomUUID(),
    status: deferredLogin ? 'scheduled' : 'queued',
    config: {
      mdPath: config.mdPath,
      n: picked.length,
      mode: v.mode,
      intervalMs: v.intervalMs,
      cardsDir: config.cardsDir,
      scheduleAt: config.scheduleAt,
      platformScheduleAt: config.platformScheduleAt,
      cardIds: config.cardIds,
      cardOverrides: config.cardOverrides,
    },
    total: picked.length,
    completed: 0,
    cards: picked.map((c) => ({
      cardId: c.meta!.cardId!,
      title: overrideById.get(c.meta!.cardId!)?.title ?? c.title,
      status: 'pending',
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  persistRun(state);

  const unsub = onGateEvent((ev) => {
    if (ev.status === 'need_qr' || ev.status === 'offline') {
      if (current && current.runId === state.runId && current.status === 'running') {
        current.status = 'circuit_open';
        current.circuitReason = `运行中登录闸门: ${ev.status} ${ev.message}`;
        persistRun(current);
      }
    }
  });

  const job = async () => {
    running = true;
    const execute =
      deps.execute ||
      ((card: ExecutorCard, mode: RunMode) => executeOneCard(card, mode));
    try {
      if (v.scheduleAtMs != null) {
        state.status = 'scheduled';
        persistRun(state);
        const rem = v.scheduleAtMs - clock.now();
        if (rem > 0) {
          await clock.sleep(rem);
        }
        const liveWait = getRunStatus(state.runId);
        if (
          liveWait?.status === 'cancelled' ||
          liveWait?.status === 'circuit_open'
        ) {
          return;
        }
        try {
          await loginGate();
        } catch (e) {
          state.status = 'rejected';
          state.circuitReason = String((e as Error).message || e);
          persistRun(state);
          return;
        }
      }

      state.status = 'running';
      persistRun(state);

      for (let i = 0; i < picked.length; i++) {
        const live = getRunStatus(state.runId);
        if (live?.status === 'circuit_open' || live?.status === 'cancelled') {
          break;
        }
        const pc = picked[i];
        const cardId = pc.meta!.cardId!;
        state.currentCardId = cardId;
        state.cards[i].status = 'running';
        persistRun(state);

        const baseCard: ExecutorCard = {
          id: cardId,
          coverLines: pc.coverLines,
          title: pc.title,
          body: pc.body,
          tags: pc.tags,
          imageSlice: pc.meta!.slice!,
          goodsKeyword: pc.meta!.goods!,
          imageServer: config.imageServer,
          cardsDir: config.cardsDir,
          mdPath: config.mdPath,
          platformScheduleAt: config.platformScheduleAt,
        };
        const execCard = mergeCardOverrides(
          baseCard,
          overrideById.get(cardId)
        ) as ExecutorCard;

        const result = await execute(execCard, v.mode);
        state.lastScreenshotPath = result.screenshotPath;
        if (result.ok) {
          state.cards[i].status = 'ok';
          state.cards[i].screenshotPath = result.screenshotPath;
          state.completed += 1;
          persistRun(state);
        } else {
          state.cards[i].status = 'fail';
          state.cards[i].err = result.err;
          state.cards[i].screenshotPath = result.screenshotPath;
          state.status = 'circuit_open';
          state.circuitReason = result.err || '单卡失败';
          for (let j = i + 1; j < state.cards.length; j++) {
            state.cards[j].status = 'skipped';
          }
          persistRun(state);
          break;
        }

        if (state.status === 'cancelled') {
          break;
        }

        if (i < picked.length - 1) {
          const action = await runCooldownAndInterval(state, v.intervalMs, clock);
          if (action === 'break') break;
        }
      }

      const live = getRunStatus(state.runId)!;
      if (live.status === 'running') {
        live.status = 'completed';
        persistRun(live);
      }
    } finally {
      running = false;
      unsub();
    }
  };

  if (deps.awaitCompletion) {
    await job();
  } else {
    void job();
  }
  return state;
}

let wakeResolver: (() => void) | null = null;

export function interruptibleSleep(
  ms: number,
  clock: Clock = defaultClock
): Promise<'timeout' | 'interrupted'> {
  return new Promise((resolve) => {
    let done = false;
    const cleanup = () => {
      done = true;
      wakeResolver = null;
    };
    wakeResolver = () => {
      if (!done) {
        cleanup();
        resolve('interrupted');
      }
    };
    clock.sleep(ms).then(() => {
      if (!done) {
        cleanup();
        resolve('timeout');
      }
    });
  });
}

export function triggerNextNow(deps: EnqueueDeps = {}): { ok: boolean; msg: string } {
  // 1. 如果当前正在运行且处于休眠等待中
  if (running && current) {
    if (wakeResolver) {
      wakeResolver();
      wakeResolver = null;
      current.nextRunAt = undefined;
      persistRun(current);
      return { ok: true, msg: '已跳过等待，立即发布下一张' };
    }
    return { ok: true, msg: '任务正在执行单卡中，完成后将无等待立即继续' };
  }

  // 2. 如果当前未在跑，但磁盘/内存中有中断或挂起的任务，支持断点续跑
  const target = current || getRunStatus();
  if (
    target &&
    (target.status === 'running' ||
      target.status === 'interrupted' ||
      target.status === 'scheduled' ||
      target.status === 'circuit_open')
  ) {
    const hasRunnable = target.cards.some(
      (c) =>
        c.status === 'pending' ||
        c.status === 'running' ||
        c.status === 'skipped' ||
        c.status === 'fail'
    );
    if (hasRunnable) {
      void resumeRun(target.runId, deps).catch((e) => {
        console.error('[triggerNextNow] 断点续跑失败:', e);
      });
      return { ok: true, msg: '已恢复中断任务，立即发布下一张' };
    }
    return { ok: false, msg: '当前任务所有卡片已完成，无待发布卡片' };
  }

  return { ok: false, msg: '当前没有正在运行或等待中的任务' };
}

export async function resumeRun(
  runId?: string,
  deps: EnqueueDeps = {}
): Promise<RunState> {
  if (running) {
    throw Object.assign(new Error('已有任务在跑'), { code: 'BUSY' });
  }

  const target = runId ? getRunStatus(runId) : (current || getRunStatus());
  if (!target) {
    throw Object.assign(new Error('未找到要恢复的任务'), { code: 'NOT_FOUND' });
  }

  if (['completed', 'rejected', 'cancelled'].includes(target.status)) {
    throw Object.assign(
      new Error(`任务已处于终态: ${target.status}，无法恢复`),
      { code: 'INVALID_STATUS' }
    );
  }

  // 检查是否有未完成的卡片，将中断时的 running 态卡片归位为 pending；若从 circuit_open 恢复，将 skipped 和 fail 卡片归位为 pending
  for (const c of target.cards) {
    if (c.status === 'running' || c.status === 'skipped' || c.status === 'fail') {
      c.status = 'pending';
      c.err = undefined;
    }
  }

  const pendingIndices = target.cards
    .map((c, i) => (c.status === 'pending' ? i : -1))
    .filter((i) => i >= 0);

  if (pendingIndices.length === 0) {
    target.status = 'completed';
    target.nextRunAt = undefined;
    persistRun(target);
    return target;
  }

  const clock = deps.clock || defaultClock;
  const loginGate = deps.loginGate || assertLoggedInForRun;

  try {
    await loginGate();
  } catch (e) {
    target.status = 'circuit_open';
    target.circuitReason = `恢复任务前登录失败: ${String((e as Error).message || e)}`;
    persistRun(target);
    throw Object.assign(new Error(target.circuitReason), {
      code: 'NEED_LOGIN',
      run: target,
    });
  }

  if (!target.config?.mdPath || !fs.existsSync(target.config.mdPath)) {
    target.status = 'circuit_open';
    target.circuitReason = `md 不存在: ${target.config?.mdPath}`;
    persistRun(target);
    throw Object.assign(new Error(target.circuitReason), { code: 'BAD_CONFIG' });
  }

  const mdText = fs.readFileSync(target.config.mdPath, 'utf8');
  const parsed = parseAndValidateCopyMd(mdText);
  const cardMap = new Map(
    parsed.cards.filter((c) => c.meta?.cardId).map((c) => [c.meta!.cardId!, c])
  );

  const overrideById = new Map(
    (target.config.cardOverrides || []).map((o) => [o.cardId, o])
  );

  target.status = 'running';
  target.nextRunAt = undefined;
  target.circuitReason = undefined;
  persistRun(target);

  const unsub = onGateEvent((ev) => {
    if (ev.status === 'need_qr' || ev.status === 'offline') {
      if (current && current.runId === target.runId && current.status === 'running') {
        current.status = 'circuit_open';
        current.circuitReason = `运行中登录闸门: ${ev.status} ${ev.message}`;
        persistRun(current);
      }
    }
  });

  const job = async () => {
    running = true;
    current = target;
    const execute =
      deps.execute ||
      ((card: ExecutorCard, mode: RunMode) => executeOneCard(card, mode));

    try {
      for (let k = 0; k < pendingIndices.length; k++) {
        const i = pendingIndices[k];
        const live = getRunStatus(target.runId);
        if (live?.status === 'circuit_open' || live?.status === 'cancelled') {
          break;
        }

        const cardProgress = target.cards[i];
        const pc = cardMap.get(cardProgress.cardId);
        if (!pc) {
          cardProgress.status = 'fail';
          cardProgress.err = `卡片「${cardProgress.cardId}」在 md 中未找到`;
          target.status = 'circuit_open';
          target.circuitReason = cardProgress.err;
          persistRun(target);
          break;
        }

        target.currentCardId = cardProgress.cardId;
        cardProgress.status = 'running';
        persistRun(target);

        const baseCard: ExecutorCard = {
          id: cardProgress.cardId,
          coverLines: pc.coverLines,
          title: pc.title,
          body: pc.body,
          tags: pc.tags,
          imageSlice: pc.meta!.slice!,
          goodsKeyword: pc.meta!.goods!,
          imageServer: target.config.imageServer,
          cardsDir: target.config.cardsDir,
          mdPath: target.config.mdPath,
          platformScheduleAt: target.config.platformScheduleAt,
        };
        const execCard = mergeCardOverrides(
          baseCard,
          overrideById.get(cardProgress.cardId)
        ) as ExecutorCard;

        const result = await execute(execCard, target.config.mode);
        target.lastScreenshotPath = result.screenshotPath;
        if (result.ok) {
          cardProgress.status = 'ok';
          cardProgress.screenshotPath = result.screenshotPath;
          target.completed = target.cards.filter((c) => c.status === 'ok').length;
          persistRun(target);
        } else {
          cardProgress.status = 'fail';
          cardProgress.err = result.err;
          cardProgress.screenshotPath = result.screenshotPath;
          target.status = 'circuit_open';
          target.circuitReason = result.err || '单卡失败';
          for (let j = i + 1; j < target.cards.length; j++) {
            if (target.cards[j].status === 'pending') {
              target.cards[j].status = 'skipped';
            }
          }
          persistRun(target);
          break;
        }

        if (target.status === 'cancelled') {
          break;
        }

        if (k < pendingIndices.length - 1) {
          const action = await runCooldownAndInterval(target, target.config.intervalMs, clock);
          if (action === 'break') break;
        }
      }

      const live = current || target;
      if (live && live.status === 'running') {
        live.status = 'completed';
        persistRun(live);
      }
    } finally {
      running = false;
      unsub();
    }
  };

  if (deps.awaitCompletion) {
    await job();
  } else {
    void job();
  }
  return current || target;
}

export interface RetryOptions {
  runId?: string;
  cardId?: string;
  mode?: 'resume_remaining' | 'card_only';
}

export async function retryRun(
  options: RetryOptions = {},
  deps: EnqueueDeps = {}
): Promise<RunState> {
  if (running) {
    throw Object.assign(new Error('已有任务正在执行中'), { code: 'BUSY' });
  }

  const target = options.runId ? getRunStatus(options.runId) : (current || getRunStatus());
  if (!target) {
    throw Object.assign(new Error('未找到要重试的任务'), { code: 'NOT_FOUND' });
  }

  if (['completed', 'rejected', 'cancelled'].includes(target.status)) {
    throw Object.assign(
      new Error(`任务已处于终态: ${target.status}，无法重试`),
      { code: 'INVALID_STATUS' }
    );
  }

  let targetIndex = -1;
  if (options.cardId) {
    targetIndex = target.cards.findIndex((c) => c.cardId === options.cardId);
    if (targetIndex < 0) {
      throw Object.assign(new Error(`未找到卡片: ${options.cardId}`), {
        code: 'NOT_FOUND',
      });
    }
  } else {
    targetIndex = target.cards.findIndex((c) => c.status === 'fail');
    if (targetIndex < 0) {
      targetIndex = target.cards.findIndex((c) => c.status === 'skipped');
    }
    if (targetIndex < 0) {
      targetIndex = target.cards.findIndex((c) => c.status === 'pending');
    }
    if (targetIndex < 0) {
      throw Object.assign(new Error('没有需要重试的卡片'), {
        code: 'NOT_FOUND',
      });
    }
  }

  const isCardOnly = options.mode === 'card_only';

  target.cards[targetIndex].status = 'pending';
  target.cards[targetIndex].err = undefined;

  let pendingIndices: number[] = [];
  if (isCardOnly) {
    pendingIndices = [targetIndex];
  } else {
    for (let j = targetIndex + 1; j < target.cards.length; j++) {
      if (target.cards[j].status === 'skipped') {
        target.cards[j].status = 'pending';
        target.cards[j].err = undefined;
      }
    }
    pendingIndices = target.cards
      .map((c, i) => (c.status === 'pending' ? i : -1))
      .filter((i) => i >= 0);
  }

  const clock = deps.clock || defaultClock;
  const loginGate = deps.loginGate || assertLoggedInForRun;

  try {
    await loginGate();
  } catch (e) {
    target.status = 'circuit_open';
    target.circuitReason = `重试前登录失败: ${String((e as Error).message || e)}`;
    persistRun(target);
    throw Object.assign(new Error(target.circuitReason), {
      code: 'NEED_LOGIN',
      run: target,
    });
  }

  if (!target.config?.mdPath || !fs.existsSync(target.config.mdPath)) {
    target.status = 'circuit_open';
    target.circuitReason = `md 不存在: ${target.config?.mdPath}`;
    persistRun(target);
    throw Object.assign(new Error(target.circuitReason), { code: 'BAD_CONFIG' });
  }

  const mdText = fs.readFileSync(target.config.mdPath, 'utf8');
  const parsed = parseAndValidateCopyMd(mdText);
  const cardMap = new Map(
    parsed.cards.filter((c) => c.meta?.cardId).map((c) => [c.meta!.cardId!, c])
  );

  const overrideById = new Map(
    (target.config.cardOverrides || []).map((o) => [o.cardId, o])
  );

  target.status = 'running';
  target.nextRunAt = undefined;
  target.circuitReason = undefined;
  persistRun(target);

  const unsub = onGateEvent((ev) => {
    if (ev.status === 'need_qr' || ev.status === 'offline') {
      if (current && current.runId === target.runId && current.status === 'running') {
        current.status = 'circuit_open';
        current.circuitReason = `运行中登录闸门: ${ev.status} ${ev.message}`;
        persistRun(current);
      }
    }
  });

  const job = async () => {
    running = true;
    current = target;
    const execute =
      deps.execute ||
      ((card: ExecutorCard, mode: RunMode) => executeOneCard(card, mode));

    try {
      for (let k = 0; k < pendingIndices.length; k++) {
        const i = pendingIndices[k];
        const live = getRunStatus(target.runId);
        if (live?.status === 'circuit_open' || live?.status === 'cancelled') {
          break;
        }

        const cardProgress = target.cards[i];
        const pc = cardMap.get(cardProgress.cardId);
        if (!pc) {
          cardProgress.status = 'fail';
          cardProgress.err = `卡片「${cardProgress.cardId}」在 md 中未找到`;
          target.status = 'circuit_open';
          target.circuitReason = cardProgress.err;
          persistRun(target);
          break;
        }

        target.currentCardId = cardProgress.cardId;
        cardProgress.status = 'running';
        persistRun(target);

        const baseCard: ExecutorCard = {
          id: cardProgress.cardId,
          coverLines: pc.coverLines,
          title: pc.title,
          body: pc.body,
          tags: pc.tags,
          imageSlice: pc.meta!.slice!,
          goodsKeyword: pc.meta!.goods!,
          imageServer: target.config.imageServer,
          cardsDir: target.config.cardsDir,
          mdPath: target.config.mdPath,
          platformScheduleAt: target.config.platformScheduleAt,
        };
        const execCard = mergeCardOverrides(
          baseCard,
          overrideById.get(cardProgress.cardId)
        ) as ExecutorCard;

        const result = await execute(execCard, target.config.mode);
        target.lastScreenshotPath = result.screenshotPath;
        if (result.ok) {
          cardProgress.status = 'ok';
          cardProgress.screenshotPath = result.screenshotPath;
          target.completed = target.cards.filter((c) => c.status === 'ok').length;
          persistRun(target);
        } else {
          cardProgress.status = 'fail';
          cardProgress.err = result.err;
          cardProgress.screenshotPath = result.screenshotPath;
          target.status = 'circuit_open';
          target.circuitReason = result.err || '单卡失败';
          if (!isCardOnly) {
            for (let j = i + 1; j < target.cards.length; j++) {
              if (target.cards[j].status === 'pending') {
                target.cards[j].status = 'skipped';
              }
            }
          }
          persistRun(target);
          break;
        }

        if (target.status === 'cancelled') {
          break;
        }

        if (k < pendingIndices.length - 1) {
          const action = await runCooldownAndInterval(target, target.config.intervalMs, clock);
          if (action === 'break') break;
        }
      }

      const live = current || target;
      if (live && live.status === 'running') {
        const allOk = live.cards.every((c) => c.status === 'ok');
        if (allOk) {
          live.status = 'completed';
        } else if (isCardOnly) {
          const hasRemaining = live.cards.some((c) => c.status === 'skipped' || c.status === 'fail');
          if (hasRemaining) {
            live.status = 'circuit_open';
            live.circuitReason = '单卡重试成功，剩余卡片等待继续';
          } else {
            live.status = 'completed';
          }
        } else {
          live.status = 'completed';
        }
        persistRun(live);
      }
    } finally {
      running = false;
      unsub();
    }
  };

  if (deps.awaitCompletion) {
    await job();
  } else {
    void job();
  }
  return current || target;
}

export function cancelRun(runId?: string): { ok: boolean; msg: string } {
  if (wakeResolver) {
    wakeResolver();
    wakeResolver = null;
  }
  const target = runId ? getRunStatus(runId) : (current || getRunStatus());
  if (!target) {
    return { ok: false, msg: '未找到对应任务' };
  }
  if (['completed', 'rejected', 'cancelled'].includes(target.status)) {
    return { ok: false, msg: `任务已处于终态: ${target.status}` };
  }
  target.status = 'cancelled';
  target.circuitReason = '用户手动取消发布';
  target.nextRunAt = undefined;
  if (Array.isArray(target.cards)) {
    for (let j = 0; j < target.cards.length; j++) {
      if (target.cards[j].status === 'pending' || target.cards[j].status === 'running') {
        target.cards[j].status = 'skipped';
      }
    }
  }
  persistRun(target);
  if (current && current.runId === target.runId) {
    current.status = 'cancelled';
    current.circuitReason = target.circuitReason;
    current.nextRunAt = undefined;
    if (Array.isArray(current.cards)) {
      for (const c of current.cards) {
        if (c.status === 'pending' || c.status === 'running') {
          c.status = 'skipped';
        }
      }
    }
  }
  return { ok: true, msg: '已取消发布任务' };
}

/** 测试辅助：清空队列内存状态，模拟重启 */
export function _resetQueueStateForTest() {
  current = null;
  running = false;
  wakeResolver = null;
}

/** 测试辅助：计算下一次间隔（暴露逻辑） */
export function chooseIntervalMs(
  intervalMs: [number, number],
  clock: Clock = defaultClock
): number {
  return randomInterval(intervalMs, clock);
}
