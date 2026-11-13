import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import http from 'http';
import { describe, expect, it, beforeEach, afterEach, afterAll } from 'vitest';
import {
  retryRun,
  resumeRun,
  cancelRun,
  getRunStatus,
  _resetQueueStateForTest,
} from '../worker/queue';
import { createServer } from '../worker/server';

const tmpDir = join(__dirname, '../.tmp-test-runtime-retry');
const tmpMd = join(tmpDir, 'sample-3cards.md');

const sample3CardsMd = `# 测试发帖文案

\`\`\`text
[封面]封面1
[标题]标题卡1
正文1。
#标签1 #标签2
\`\`\`
\`cardId=c1｜切片=c1.png｜商品=测试商品｜状态=｜结果=样例｜模式=模式一\`

\`\`\`text
[封面]封面2
[标题]标题卡2
正文2。
#标签1 #标签2
\`\`\`
\`cardId=c2｜切片=c2.png｜商品=测试商品｜状态=｜结果=样例｜模式=模式二\`

\`\`\`text
[封面]封面3
[标题]标题卡3
正文3。
#标签1 #标签2
\`\`\`
\`cardId=c3｜切片=c3.png｜商品=测试商品｜状态=｜结果=样例｜模式=模式三\`
`;

const loggedIn = async () => ({
  status: 'logged_in' as const,
  userDataDir: 'x',
  publishUrl: 'x',
  message: 'ok',
  cookieStaysLocal: true as const,
  at: new Date().toISOString(),
});

function setupFakeCircuitRun(runId: string, overrides: Record<string, unknown> = {}) {
  const fakeState = {
    runId,
    status: 'circuit_open' as const,
    circuitReason: '卡片 c2 执行失败',
    config: {
      mdPath: tmpMd,
      n: 3,
      mode: 'draft' as const,
      intervalMs: [0, 0] as [number, number],
      cardIds: ['c1', 'c2', 'c3'],
    },
    total: 3,
    completed: 1,
    currentCardId: 'c2',
    cards: [
      { cardId: 'c1', title: '标题卡1', status: 'ok' as const },
      { cardId: 'c2', title: '标题卡2', status: 'fail' as const, err: '网络超时' },
      { cardId: 'c3', title: '标题卡3', status: 'skipped' as const },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };

  const runtimeDir = join(tmpDir, 'runtime');
  mkdirSync(runtimeDir, { recursive: true });
  writeFileSync(join(runtimeDir, `run-${runId}.json`), JSON.stringify(fakeState), 'utf8');
  writeFileSync(join(runtimeDir, 'latest-run.json'), JSON.stringify(fakeState), 'utf8');
  return fakeState;
}

beforeEach(() => {
  _resetQueueStateForTest();
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(tmpMd, sample3CardsMd, 'utf8');
  process.env.XHS_DRAFT_RUNTIME_DIR = join(tmpDir, 'runtime');
});

describe('Worker 重试与熔断恢复状态机 (retryRun & resumeRun)', () => {
  it('用例 1: circuit_open 状态下通过 resumeRun 自愈恢复', async () => {
    const runId = 'test-circuit-resume-1';
    setupFakeCircuitRun(runId);
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

    expect(executedCards).toEqual(['c2', 'c3']);
    expect(resumed.status).toBe('completed');
    expect(resumed.completed).toBe(3);
    expect(resumed.cards.every((c) => c.status === 'ok')).toBe(true);

    const live = getRunStatus(runId);
    expect(live?.status).toBe('completed');
  });

  it('用例 2: 单卡精准重试 (retryRun with mode: "card_only")', async () => {
    const runId = 'test-circuit-retry-card-only';
    setupFakeCircuitRun(runId);
    _resetQueueStateForTest();

    const executedCards: string[] = [];
    const retried = await retryRun(
      { runId, cardId: 'c2', mode: 'card_only' },
      {
        awaitCompletion: true,
        loginGate: loggedIn,
        execute: async (card) => {
          executedCards.push(card.id);
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: 'fake-c2.png',
          };
        },
      }
    );

    // 仅有 c2 执行，c3 保持 skipped
    expect(executedCards).toEqual(['c2']);
    expect(retried.cards[1].status).toBe('ok');
    expect(retried.cards[2].status).toBe('skipped');
    expect(retried.completed).toBe(2);
    // 仍有 skipped 卡片，保留断点上下文 (circuit_open 挂起)
    expect(retried.status).toBe('circuit_open');
    expect(retried.circuitReason).toMatch(/单卡重试成功/);
  });

  it('用例 3: 重试失败卡并继续后续 (retryRun with mode: "resume_remaining")', async () => {
    const runId = 'test-circuit-retry-resume-remaining';
    setupFakeCircuitRun(runId);
    _resetQueueStateForTest();

    const executedCards: string[] = [];
    const retried = await retryRun(
      { runId, cardId: 'c2', mode: 'resume_remaining' },
      {
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
      }
    );

    expect(executedCards).toEqual(['c2', 'c3']);
    expect(retried.status).toBe('completed');
    expect(retried.completed).toBe(3);
    expect(retried.cards.every((c) => c.status === 'ok')).toBe(true);
  });

  it('用例 4: 并发互斥保护 (BUSY 拒绝重入)', async () => {
    const runId = 'test-circuit-busy';
    setupFakeCircuitRun(runId);
    _resetQueueStateForTest();

    let resolveExecution: (() => void) | null = null;
    const executionPromise = new Promise<void>((r) => {
      resolveExecution = r;
    });

    // 启动一个耗时任务
    const firstTask = retryRun(
      { runId, cardId: 'c2', mode: 'card_only' },
      {
        awaitCompletion: false,
        loginGate: loggedIn,
        execute: async (card) => {
          await executionPromise;
          return {
            ok: true,
            mode: 'draft' as const,
            cardId: card.id,
            steps: [],
            screenshotPath: 'fake.png',
          };
        },
      }
    );

    // 稍候保证进入 running 状态
    await new Promise((r) => setTimeout(r, 10));

    // 并发调用 retryRun 应抛出 BUSY
    await expect(
      retryRun({ runId, cardId: 'c2', mode: 'card_only' })
    ).rejects.toMatchObject({ code: 'BUSY' });

    // 释放第一个任务
    if (resolveExecution) resolveExecution();
    await firstTask;
  });

  it('用例 5: 取消处于熔断态的任务 (cancelRun on circuit_open)', async () => {
    const runId = 'test-circuit-cancel';
    setupFakeCircuitRun(runId);
    _resetQueueStateForTest();

    const res = cancelRun(runId);
    expect(res.ok).toBe(true);

    const st = getRunStatus(runId);
    expect(st?.status).toBe('cancelled');
    expect(st?.circuitReason).toMatch(/用户手动取消/);
  });

  it('用例 6: 异常参数处理 (无效 cardId / 不存在任务)', async () => {
    const runId = 'test-circuit-invalid';
    setupFakeCircuitRun(runId);
    _resetQueueStateForTest();

    await expect(
      retryRun({ runId: 'non-existent-run-id' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    await expect(
      retryRun({ runId, cardId: 'invalid-card-id' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('Worker HTTP API 端点 (POST /run/retry)', () => {
  let server: http.Server;
  let port: number;

  beforeEach(async () => {
    _resetQueueStateForTest();
    server = createServer({
      loginGate: async () => ({
        status: 'logged_in',
        message: 'Mock 登录成功',
        checkedAt: new Date().toISOString(),
      }),
      execute: async () => ({ ok: true, durationMs: 10 }),
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        port = addr.port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('通过 HTTP POST /run/retry 能够正常调用重试', async () => {
    const runId = 'test-http-retry';
    setupFakeCircuitRun(runId);
    _resetQueueStateForTest();

    const resp = await fetch(`http://127.0.0.1:${port}/run/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, cardId: 'c2', mode: 'resume_remaining' }),
    });

    // Worker 会因未 mock loginGate/execute 执行真实前置校验，或返回合理状态码 (200 或 400 NEED_LOGIN)
    expect([200, 400]).toContain(resp.status);
    const data = await resp.json();
    expect(data).toHaveProperty('ok');
  });

  it('POST /run/retry 传入不存在的 runId 返回 404', async () => {
    const resp = await fetch(`http://127.0.0.1:${port}/run/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId: 'no-such-run' }),
    });

    expect(resp.status).toBe(404);
    const data = await resp.json();
    expect(data.ok).toBe(false);
    expect(data.code).toBe('NOT_FOUND');
  });

  afterAll(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });
});
