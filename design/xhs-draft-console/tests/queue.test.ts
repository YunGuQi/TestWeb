import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, beforeEach } from 'vitest';
import {
  chooseIntervalMs,
  enqueueRun,
  resumeRun,
  getRunStatus,
  validateRunConfig,
  validateScheduleAt,
  triggerNextNow,
  cancelRun,
  _resetQueueStateForTest,
} from '../worker/queue';
import {
  mergeCardOverrides,
  normalizeTopics,
  validateCardOverrides,
} from '../lib/run/overrides';

const fixtureSrc = join(__dirname, 'fixtures/sample-copy.md');
const tmpDir = join(__dirname, '../.tmp-test-runtime');
const tmpMd = join(tmpDir, 'run-copy.md');

const loggedIn = async () =>
  ({
    status: 'logged_in' as const,
    userDataDir: 'x',
    publishUrl: 'x',
    message: 'ok',
    cookieStaysLocal: true as const,
    at: new Date().toISOString(),
  });

beforeEach(() => {
  _resetQueueStateForTest();
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(tmpMd, readFileSync(fixtureSrc, 'utf8'), 'utf8');
  process.env.XHS_DRAFT_RUNTIME_DIR = join(tmpDir, 'runtime');
});

describe('queue validate + circuit', () => {
  it('N 默认 3 硬顶校验', () => {
    expect(validateRunConfig({ mdPath: tmpMd, n: 0 }).ok).toBe(false);
    expect(validateRunConfig({ mdPath: tmpMd, n: 11 }).ok).toBe(false);
    const v = validateRunConfig({ mdPath: tmpMd });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.n).toBe(3);
      expect(v.mode).toBe('draft');
    }
  });

  it('间隔落在区间', () => {
    const clock = { now: () => 1000, sleep: async () => {} };
    const ms = chooseIntervalMs([100, 200], clock);
    expect(ms).toBeGreaterThanOrEqual(100);
    expect(ms).toBeLessThanOrEqual(200);
  });

  it('未登录拒绝；失败熔断不再跑下一卡', async () => {
    await expect(
      enqueueRun(
        { mdPath: tmpMd, n: 3, intervalMs: [0, 0] },
        {
          awaitCompletion: true,
          loginGate: async () => {
            throw new Error('need_qr');
          },
        }
      )
    ).rejects.toThrow(/need_qr/);

    let calls = 0;
    const state = await enqueueRun(
      { mdPath: tmpMd, n: 3, intervalMs: [0, 0] },
      {
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async () => {
          calls += 1;
          return {
            ok: false,
            mode: 'draft' as const,
            cardId: 'r1_m4',
            steps: [],
            screenshotPath: null,
            err: 'injected fail',
          };
        },
      }
    );
    const live = getRunStatus(state.runId)!;
    expect(live.status).toBe('circuit_open');
    expect(calls).toBe(1);
    expect(live.circuitReason).toMatch(/injected fail/);
  });
});

describe('overrides + scheduleAt + platformScheduleAt', () => {
  it('normalizeTopics 去 #；merge 按 cardId', () => {
    expect(normalizeTopics(['#大女主', '松弛感', '#'])).toEqual([
      '大女主',
      '松弛感',
    ]);
    const merged = mergeCardOverrides(
      {
        id: 'r1_m4',
        coverLines: ['a'],
        title: '旧标题',
        body: '旧正文',
        tags: ['t1'],
        imageSlice: 'x.png',
        goodsKeyword: 'g',
      },
      {
        cardId: 'r1_m4',
        title: '新标题',
        topics: ['#新话题'],
        coverLines: ['一行', '二行'],
      }
    );
    expect(merged.title).toBe('新标题');
    expect(merged.tags).toEqual(['新话题']);
    expect(merged.coverLines).toEqual(['一行', '二行']);
    expect(merged.body).toBe('旧正文');
    expect(() =>
      mergeCardOverrides(
        {
          id: 'r1_m4',
          coverLines: [],
          title: '',
          body: '',
          tags: [],
          imageSlice: '',
          goodsKeyword: '',
        },
        { cardId: 'other', title: 'x' }
      )
    ).toThrow(/不一致/);
  });

  it('缺 cardId / 未知 cardId 拒绝', () => {
    const allowed = new Set(['r1_m4']);
    expect(
      validateCardOverrides([{ cardId: '', title: 'x' }], allowed).ok
    ).toBe(false);
    expect(
      validateCardOverrides([{ cardId: 'ghost', title: 'x' }], allowed).ok
    ).toBe(false);
    expect(
      validateCardOverrides([{ cardId: 'r1_m4', title: 'x' }], allowed).ok
    ).toBe(true);
  });

  it('platformScheduleAt + draft 拒配', () => {
    const v = validateRunConfig({
      mdPath: tmpMd,
      mode: 'draft',
      platformScheduleAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.err).toMatch(/ready/);
  });

  it('过期 scheduleAt 拒绝入队', () => {
    const now = 10_000;
    expect(validateScheduleAt(new Date(5000).toISOString(), now).ok).toBe(
      false
    );
    const v = validateRunConfig(
      { mdPath: tmpMd, scheduleAt: new Date(now - 1).toISOString() },
      now
    );
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.err).toMatch(/过期/);
  });

  it('未来 scheduleAt：到点前零执行；到点后执行且熔断仍生效', async () => {
    let now = 1000;
    const clock = {
      now: () => now,
      sleep: async (ms: number) => {
        now += ms;
      },
    };
    const scheduleAt = new Date(5000).toISOString();
    let calls = 0;
    let loginCalls = 0;

    const state = await enqueueRun(
      {
        mdPath: tmpMd,
        n: 2,
        intervalMs: [10, 10],
        scheduleAt,
        mode: 'draft',
      },
      {
        clock,
        awaitCompletion: true,
        loginGate: async () => {
          loginCalls += 1;
          // 到点前不应调用；到点后 now>=5000
          expect(now).toBeGreaterThanOrEqual(5000);
          return loggedIn();
        },
        execute: async () => {
          calls += 1;
          if (calls === 1) {
            return {
              ok: false,
              mode: 'draft' as const,
              cardId: 'r1_m4',
              steps: [],
              screenshotPath: null,
              err: 'fail after schedule',
            };
          }
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: 'x',
            steps: [],
            screenshotPath: null,
          };
        },
      }
    );

    expect(state.status === 'scheduled' || state.status === 'circuit_open').toBe(
      true
    );
    const live = getRunStatus(state.runId)!;
    expect(loginCalls).toBe(1);
    expect(calls).toBe(1);
    expect(live.status).toBe('circuit_open');
    expect(live.circuitReason).toMatch(/fail after schedule/);
    expect(now).toBeGreaterThanOrEqual(5000);
  });

  it('覆盖字段传入执行器；无覆盖路径仍可跑', async () => {
    let seenTitle = '';
    await enqueueRun(
      {
        mdPath: tmpMd,
        n: 1,
        intervalMs: [0, 0],
        cardOverrides: [
          {
            cardId: 'r1_m4',
            title: '覆盖后的标题',
            topics: ['#话题A', '话题B'],
          },
        ],
      },
      {
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async (card) => {
          seenTitle = card.title;
          expect(card.tags).toEqual(['话题A', '话题B']);
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: null,
          };
        },
      }
    );
    expect(seenTitle).toBe('覆盖后的标题');

    let baselineTitle = '';
    await enqueueRun(
      { mdPath: tmpMd, n: 1, intervalMs: [0, 0] },
      {
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async (card) => {
          baselineTitle = card.title;
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: null,
          };
        },
      }
    );
    expect(baselineTitle).toMatch(/不争不抢/);
  });

  it('未知 cardId 覆盖拒绝入队', async () => {
    await expect(
      enqueueRun(
        {
          mdPath: tmpMd,
          n: 1,
          intervalMs: [0, 0],
          cardOverrides: [{ cardId: 'not_exist', title: 'x' }],
        },
        { awaitCompletion: true, loginGate: loggedIn }
      )
    ).rejects.toThrow(/未找到|未知 cardId/);
  });

  it('支持指定 cardIds 列表跳选执行（避免盲取前 N 导致未选卡冲突）', async () => {
    const executed: string[] = [];
    await enqueueRun(
      {
        mdPath: tmpMd,
        cardIds: ['r1_m4'],
        intervalMs: [0, 0],
        cardOverrides: [
          {
            cardId: 'r1_m4',
            title: '跳选后的标题',
          },
        ],
      },
      {
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async (card) => {
          executed.push(card.id);
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: null,
          };
        },
      }
    );
    expect(executed).toEqual(['r1_m4']);
  });

  it('cancelRun 可在队列等待或执行期间取消发布', async () => {
    // 将 r1_m1 状态改为未存，使其可跑
    const content = readFileSync(tmpMd, 'utf8').replace('状态=已存草稿(2026-10-27)', '状态=');
    writeFileSync(tmpMd, content, 'utf8');

    let cancelRes: { ok: boolean; msg: string } | null = null;
    const executed: string[] = [];

    await enqueueRun(
      {
        mdPath: tmpMd,
        cardIds: ['r1_m1', 'r1_m4'],
        intervalMs: [0, 0],
      },
      {
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async (card) => {
          executed.push(card.id);
          // 在执行第 1 张时调用取消
          cancelRes = cancelRun();
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: null,
          };
        },
      }
    );

    expect(cancelRes?.ok).toBe(true);
    expect(executed).toEqual(['r1_m1']);
    // r1_m4 应当被跳过，不再执行
  });

  it('triggerNextNow 在无运行任务或无等待时安全返回', () => {
    const res = triggerNextNow();
    expect(res.ok).toBe(false);
  });

  describe('孤儿与中断任务恢复 (Orphan & Interrupted Run Recovery)', () => {
    it('磁盘上有 running 态但已过期的 nextRunAt 时，getRunStatus 自动纠正为 interrupted', () => {
      const runId = 'test-orphan-expired-1';
      const expiredIso = new Date(Date.now() - 3600000).toISOString(); // 1小时前
      const fakeState = {
        runId,
        status: 'running' as const,
        config: {
          mdPath: tmpMd,
          n: 3,
          mode: 'draft' as const,
          intervalMs: [1000, 2000] as [number, number],
        },
        total: 3,
        completed: 1,
        nextRunAt: expiredIso,
        cards: [
          { cardId: 'r1_m1', title: '卡1', status: 'ok' as const },
          { cardId: 'r1_m4', title: '卡2', status: 'pending' as const },
          { cardId: 'r2_m1', title: '卡3', status: 'pending' as const },
        ],
        createdAt: expiredIso,
        updatedAt: expiredIso,
      };

      const runtimeDir = join(tmpDir, 'runtime');
      mkdirSync(runtimeDir, { recursive: true });
      writeFileSync(join(runtimeDir, `run-${runId}.json`), JSON.stringify(fakeState), 'utf8');
      writeFileSync(join(runtimeDir, 'latest-run.json'), JSON.stringify(fakeState), 'utf8');

      // 模拟进程刚重启，内存中 current 为 null, running 为 false
      _resetQueueStateForTest();

      const st = getRunStatus(runId);
      expect(st).not.toBeNull();
      expect(st!.status).toBe('interrupted');
      expect(st!.circuitReason).toMatch(/重启或执行中断/);
      expect(st!.nextRunAt).toBe(expiredIso); // 保留时间供前端展示超时
    });

    it('任务中断后通过 resumeRun 能够从 pending 卡片断点续跑直至 completed', async () => {
      const runId = 'test-orphan-resume-2';
      const fakeState = {
        runId,
        status: 'interrupted' as const,
        config: {
          mdPath: tmpMd,
          n: 2,
          mode: 'draft' as const,
          intervalMs: [0, 0] as [number, number],
          cardIds: ['r1_m1', 'r1_m4'],
        },
        total: 2,
        completed: 1,
        cards: [
          { cardId: 'r1_m1', title: '卡1', status: 'ok' as const },
          { cardId: 'r1_m4', title: '卡2', status: 'pending' as const },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const runtimeDir = join(tmpDir, 'runtime');
      mkdirSync(runtimeDir, { recursive: true });
      writeFileSync(join(runtimeDir, `run-${runId}.json`), JSON.stringify(fakeState), 'utf8');
      writeFileSync(join(runtimeDir, 'latest-run.json'), JSON.stringify(fakeState), 'utf8');

      _resetQueueStateForTest();

      const executedCards: string[] = [];
      const resumed = await resumeRun(runId, {
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async (card) => {
          executedCards.push(card.id);
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: 'fake.png',
          };
        },
      });

      // 仅执行了未完成的 r1_m4，没有重复执行已完成的 r1_m1
      expect(executedCards).toEqual(['r1_m4']);
      expect(resumed.status).toBe('completed');
      expect(resumed.completed).toBe(2);
      expect(resumed.cards.every((c) => c.status === 'ok')).toBe(true);

      const live = getRunStatus(runId);
      expect(live?.status).toBe('completed');
    });

    it('任务中断时调用 triggerNextNow 能够成功唤醒断点续跑', async () => {
      const runId = 'test-orphan-trigger-3';
      const fakeState = {
        runId,
        status: 'running' as const,
        config: {
          mdPath: tmpMd,
          n: 2,
          mode: 'draft' as const,
          intervalMs: [0, 0] as [number, number],
          cardIds: ['r1_m1', 'r1_m4'],
        },
        total: 2,
        completed: 1,
        nextRunAt: new Date(Date.now() - 50000).toISOString(),
        cards: [
          { cardId: 'r1_m1', title: '卡1', status: 'ok' as const },
          { cardId: 'r1_m4', title: '卡2', status: 'pending' as const },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const runtimeDir = join(tmpDir, 'runtime');
      mkdirSync(runtimeDir, { recursive: true });
      writeFileSync(join(runtimeDir, `run-${runId}.json`), JSON.stringify(fakeState), 'utf8');
      writeFileSync(join(runtimeDir, 'latest-run.json'), JSON.stringify(fakeState), 'utf8');

      _resetQueueStateForTest();

      let executed = false;
      const res = triggerNextNow({
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async (card) => {
          executed = true;
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: null,
          };
        },
      });

      expect(res.ok).toBe(true);
      expect(res.msg).toMatch(/已恢复中断任务/);

      // 等待异步任务微任务处理完毕
      await new Promise((r) => setTimeout(r, 50));
      expect(executed).toBe(true);

      const live = getRunStatus(runId);
      expect(live?.status).toBe('completed');
    });

    it('内存中 current 为空时，cancelRun 也能取消磁盘上的僵尸任务并回写', () => {
      const runId = 'test-orphan-cancel-4';
      const fakeState = {
        runId,
        status: 'running' as const,
        config: {
          mdPath: tmpMd,
          n: 2,
          mode: 'draft' as const,
          intervalMs: [1000, 2000] as [number, number],
        },
        total: 2,
        completed: 0,
        cards: [
          { cardId: 'r1_m1', title: '卡1', status: 'pending' as const },
          { cardId: 'r1_m4', title: '卡2', status: 'pending' as const },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const runtimeDir = join(tmpDir, 'runtime');
      mkdirSync(runtimeDir, { recursive: true });
      writeFileSync(join(runtimeDir, `run-${runId}.json`), JSON.stringify(fakeState), 'utf8');
      writeFileSync(join(runtimeDir, 'latest-run.json'), JSON.stringify(fakeState), 'utf8');

      _resetQueueStateForTest();

      // 无参数调用 cancelRun，测试自动从磁盘 latest-run 读取并取消
      const res = cancelRun();
      expect(res.ok).toBe(true);
      expect(res.msg).toMatch(/已取消发布/);

      const disk = JSON.parse(readFileSync(join(runtimeDir, 'latest-run.json'), 'utf8'));
      expect(disk.status).toBe('cancelled');
      expect(disk.cards.every((c: { status: string }) => c.status === 'skipped')).toBe(true);
    });
  });
});
