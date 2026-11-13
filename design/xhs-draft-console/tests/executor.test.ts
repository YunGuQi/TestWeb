import { describe, expect, it } from 'vitest';
import {
  compileSteps,
  executeOneCard,
  mapCardToBuildInput,
  type ExecutorCard,
} from '../worker/executor';

const sample: ExecutorCard = {
  id: 'r1_m4',
  coverLines: ['不争不抢', '难道就会饿死吗'],
  title: '不争不抢难道会饿死？下班关机吃碗面',
  body: '三十岁我悟出了一个硬道理。\n职场勾心斗角全当耳边风。',
  tags: ['大女主觉醒', '原生家庭测试', '专注自我', '静水流深', '清醒独立'],
  imageSlice: 'r1_m4_slice.png',
  goodsKeyword: '大女主觉醒自测模板',
};

describe('executor compile / stub', () => {
  it('映射 buildSteps 字段', () => {
    const m = mapCardToBuildInput(sample);
    expect(m.id).toBe('r1_m4');
    expect(m.imageSlice).toBe('r1_m4_slice.png');
    expect(m.goodsKeyword).toBe('大女主觉醒自测模板');
  });

  it('draft 含 save_draft；ready 剔除暂存且步骤表无最终发布', () => {
    const d = compileSteps(sample, 'draft');
    expect(d.steps.some((s) => s.id === 'save_draft')).toBe(true);
    const r = compileSteps(sample, 'ready');
    expect(r.steps.some((s) => s.id === 'save_draft')).toBe(false);
    expect(r.skippedIds).toContain('save_draft');
    expect(r.steps.every((s) => s.id !== 'publish')).toBe(true);
    expect(
      r.steps.every(
        (s) =>
          !/最终.*发布|定时发布确认|自动点.*发布/.test(s.title) &&
          s.id !== 'confirm_publish'
      )
    ).toBe(true);
  });

  it('无 platformScheduleAt 时不含平台定时步', () => {
    const d = compileSteps(sample, 'draft');
    expect(d.steps.some((s) => s.id === 'platform_schedule')).toBe(false);
    const r = compileSteps(sample, 'ready');
    expect(r.steps.some((s) => s.id === 'platform_schedule')).toBe(false);
  });

  it('有 platformScheduleAt：含定时步、无 save_draft、无最终发布 id', () => {
    const iso = new Date(Date.now() + 86400_000).toISOString();
    const card = { ...sample, platformScheduleAt: iso };
    const r = compileSteps(card, 'ready');
    expect(r.steps.some((s) => s.id === 'platform_schedule')).toBe(true);
    expect(r.steps.some((s) => s.id === 'save_draft')).toBe(false);
    expect(
      r.steps.every(
        (s) =>
          ![
            'publish',
            'final_publish',
            'confirm_publish',
            'schedule_confirm',
          ].includes(s.id)
      )
    ).toBe(true);
    const sched = r.steps.find((s) => s.id === 'platform_schedule')!;
    expect(sched.expression).not.toMatch(/\.click\(\).*发布/);
    expect(sched.title).toMatch(/Safe Stop/);
  });

  it('桩测：逐步 ok，ready 不调用暂存；失败短路', async () => {
    const called: string[] = [];
    const { steps } = compileSteps(sample, 'ready');
    let i = 0;
    const res = await executeOneCard(sample, 'ready', {
      skipBrowser: true,
      runExpression: async () => {
        const id = steps[i++]?.id || 'unknown';
        called.push(id);
        return { ok: true };
      },
    });
    expect(res.ok).toBe(true);
    expect(called).not.toContain('save_draft');

    const fail = await executeOneCard(sample, 'draft', {
      skipBrowser: true,
      runExpression: async () => ({ ok: false, err: 'boom' }),
    });
    expect(fail.ok).toBe(false);
    expect(fail.steps.length).toBe(1);
    expect(fail.steps[0].ok).toBe(false);
  });

  it('桩测：平台定时路径走完且不点发布', async () => {
    const iso = new Date(Date.now() + 86400_000).toISOString();
    const card = { ...sample, platformScheduleAt: iso };
    const { steps } = compileSteps(card, 'ready');
    expect(steps.map((s) => s.id)).toContain('platform_schedule');
    expect(steps.map((s) => s.id)).not.toContain('save_draft');
    let i = 0;
    const called: string[] = [];
    const res = await executeOneCard(card, 'ready', {
      skipBrowser: true,
      runExpression: async () => {
        called.push(steps[i++]?.id || 'unknown');
        return { ok: true, safeStop: true };
      },
    });
    expect(res.ok).toBe(true);
    expect(called).toContain('platform_schedule');
    expect(called).not.toContain('save_draft');
    expect(called).not.toContain('publish');
  });

  it('切片缺失可读错误', async () => {
    const res = await executeOneCard(
      { ...sample, cardsDir: 'E:/__no_such_cards_dir__' },
      'draft',
      { skipBrowser: true, runExpression: async () => ({ ok: true }) }
    );
    expect(res.ok).toBe(false);
    expect(res.err).toMatch(/切片文件缺失/);
    expect(res.err).toMatch(/crop-slice/);
  });

  it('静态切片缺失但母本长图存在时，通过校验不阻断执行', async () => {
    const dnvzhuCardsDir = 'e:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/assets/结果测试截图/cards';
    const res = await executeOneCard(
      {
        ...sample,
        cardsDir: dnvzhuCardsDir,
        imageSlice: 'r1_m4_slice.png', // 已被清理，不存在静态切片
      },
      'draft',
      { skipBrowser: true, runExpression: async () => ({ ok: true }) }
    );
    expect(res.ok).toBe(true);
  });
});
