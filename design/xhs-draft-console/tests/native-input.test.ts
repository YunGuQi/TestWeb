import { describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  compileSteps,
  injectRichTextViaClipboard,
  nativeStepHandlers,
  type ExecutorCard,
} from '../worker/executor';
import type { PageLike } from '../worker/chrome-session';

const sampleCard: ExecutorCard = {
  id: 'r1_m1',
  coverLines: ['第一行封面', '第二行长封面测试'],
  title: '测试原生输入标题',
  body: '正文第一段其实很有趣。\n第二段真的让人清醒。',
  tags: ['标签一', '标签二', '标签三', '标签四', '标签五'],
  imageSlice: 'r1_m1_slice.png',
};

describe('native input & event authenticity', () => {
  it('用例 1.1: compileSteps 步骤表达式中完全不包含合成事件与 setContent 内存后门', () => {
    const compiled = compileSteps(sampleCard, 'draft');
    expect(compiled.steps.length).toBeGreaterThan(0);

    for (const step of compiled.steps) {
      if (step.expr) {
        expect(step.expr).not.toContain('dispatchEvent(new MouseEvent');
        expect(step.expr).not.toContain('dispatchEvent(new PointerEvent');
        expect(step.expr).not.toContain('commands.setContent');
      }
    }
  });

  it('用例 1.2: 模拟 Page 桩对象，验证 injectRichTextViaClipboard 驱动原生 click 与 keyboard 调用链', async () => {
    const events: string[] = [];

    const mockEditor = {
      click: vi.fn(async () => {
        events.push('editor.click');
      }),
      evaluate: vi.fn(async () => '正文第一段其实很有趣。\n第二段真的让人清醒。'),
      textContent: vi.fn(async () => '正文第一段其实很有趣。\n第二段真的让人清醒。'),
      innerText: vi.fn(async () => '正文第一段其实很有趣。\n第二段真的让人清醒。'),
    };

    const mockPage: PageLike = {
      locator: vi.fn((_selector: string) => ({
        first: () => mockEditor,
      })) as unknown as PageLike['locator'],
      keyboard: {
        press: vi.fn(async (key: string) => {
          events.push(`keyboard.press:${key}`);
        }),
        insertText: vi.fn(async (text: string) => {
          events.push(`keyboard.insertText:${text.slice(0, 4)}...`);
        }),
        type: vi.fn(async (text: string) => {
          events.push(`keyboard.type:${text}`);
        }),
      },
      evaluate: vi.fn(async () => undefined),
    };

    const res = await injectRichTextViaClipboard(mockPage, sampleCard.body);
    expect(res.ok).toBe(true);
    expect(mockEditor.click).toHaveBeenCalledTimes(1);
    expect(events).toContain('editor.click');
    expect(events.some((e) => e.startsWith('keyboard.press:'))).toBe(true);
    expect(events.some((e) => e.startsWith('keyboard.insertText:'))).toBe(true);
  });

  it('用例 1.3: nativeStepHandlers.title_body 原生输入标题与正文分段保持', async () => {
    let filledTitle = '';
    const mockTitleInput = {
      fill: vi.fn(async (val: string) => {
        filledTitle = val;
      }),
    };
    const mockEditor = {
      click: vi.fn(async () => undefined),
      textContent: vi.fn(async () => sampleCard.body),
    };

    const mockPage: PageLike = {
      locator: vi.fn((sel: string) => {
        if (sel.includes('标题')) {
          return { first: () => mockTitleInput };
        }
        return { first: () => mockEditor };
      }) as unknown as PageLike['locator'],
      keyboard: {
        press: vi.fn(async () => undefined),
        insertText: vi.fn(async () => undefined),
      },
      evaluate: vi.fn(async () => undefined),
    };

    const stepDef = { id: 'title_body', title: '标题与正文输入', kind: 'native' as const };
    const res = await nativeStepHandlers.title_body(mockPage, sampleCard, stepDef);

    expect(res).not.toBeNull();
    expect(res?.ok).toBe(true);
    expect(filledTitle).toBe(sampleCard.title);
    expect(mockTitleInput.fill).toHaveBeenCalledWith(sampleCard.title);
  });

  it('用例 1.4: draft-one-card.js 脚本文件严格无 Mouse/PointerEvent 合成事件', () => {
    const scriptPath = path.resolve(
      __dirname,
      '../../../.cursor/skills/xhs-note-operator/scripts/draft-one-card.js'
    );
    expect(fs.existsSync(scriptPath)).toBe(true);
    const content = fs.readFileSync(scriptPath, 'utf8');

    expect(content).not.toContain('dispatchEvent(new MouseEvent');
    expect(content).not.toContain('dispatchEvent(new PointerEvent');
  });
});
