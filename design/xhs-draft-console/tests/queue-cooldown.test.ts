import { describe, expect, it, vi } from 'vitest';
import {
  COOLDOWN_MIN_MS,
  COOLDOWN_MAX_MS,
  generateRandomCooldownMs,
  interruptibleSleep,
  runCooldownAndInterval,
  cancelRun,
  type RunState,
} from '../worker/queue';

describe('queue cooldown & rate limit hardening', () => {
  it('用例 2.1: generateRandomCooldownMs 严格在 15,000ms ~ 35,000ms 区间内', () => {
    for (let i = 0; i < 50; i++) {
      const ms = generateRandomCooldownMs();
      expect(ms).toBeGreaterThanOrEqual(COOLDOWN_MIN_MS);
      expect(ms).toBeLessThanOrEqual(COOLDOWN_MAX_MS);
    }
  });

  it('用例 2.2: runCooldownAndInterval 进入冷静期并记录 phase 与 cooldownUntil', async () => {
    let capturedPhase: string | undefined;
    let capturedCooldownUntil: string | undefined;
    let capturedNextRunAt: string | undefined;
    let sleptMs = 0;

    const fakeNow = 1700000000000;
    const mockClock = {
      now: () => fakeNow,
      sleep: vi.fn(async (ms: number) => {
        sleptMs = ms;
        capturedPhase = state.phase;
        capturedCooldownUntil = state.cooldownUntil;
        capturedNextRunAt = state.nextRunAt;
      }),
    };

    const state: RunState = {
      runId: 'test-run-cooldown-1',
      status: 'running',
      config: {
        mdPath: 'dummy.md',
        n: 2,
        mode: 'draft',
        intervalMs: [0, 0],
      },
      total: 2,
      completed: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await runCooldownAndInterval(state, [0, 0], mockClock);
    expect(res).toBe('continue');
    expect(sleptMs).toBeGreaterThanOrEqual(COOLDOWN_MIN_MS);
    expect(sleptMs).toBeLessThanOrEqual(COOLDOWN_MAX_MS);
    expect(capturedPhase).toBe('cooldown');
    expect(capturedCooldownUntil).toBeDefined();
    expect(capturedNextRunAt).toBe(capturedCooldownUntil);
    // 完成后应清理 cooldown 状态
    expect(state.phase).toBeUndefined();
    expect(state.cooldownUntil).toBeUndefined();
  });

  it('用例 2.3: 在冷静期休眠期间触发 cancelRun 可立即中断响应', async () => {
    const mockClock = {
      now: () => Date.now(),
      sleep: vi.fn(async (ms: number) => {
        // 模拟外部触发 cancel
        cancelRun();
        return new Promise((resolve) => setTimeout(resolve, 5));
      }),
    };

    const state: RunState = {
      runId: 'test-run-cooldown-cancel',
      status: 'running',
      config: {
        mdPath: 'dummy.md',
        n: 2,
        mode: 'draft',
        intervalMs: [0, 0],
      },
      total: 2,
      completed: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await runCooldownAndInterval(state, [0, 0], mockClock);
    expect(res).toBe('break');
  });

  it('用例 2.4: interruptibleSleep 中途被 cancel 时返回 interrupted', async () => {
    let sleepFinished = false;
    const mockClock = {
      now: () => Date.now(),
      sleep: vi.fn(async (ms: number) => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        sleepFinished = true;
      }),
    };

    const sleepPromise = interruptibleSleep(10000, mockClock);
    // 立即触发中断
    setTimeout(() => {
      cancelRun();
    }, 5);

    const result = await sleepPromise;
    expect(result).toBe('interrupted');
  });
});
