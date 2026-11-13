/**
 * 单卡执行器（工单 03）
 * 复用 draft-one-card.buildSteps；draft 暂存+回写；ready 不停点发布/暂存。
 */
import fs from 'fs';
import path from 'path';
import {
  DRAFT_ONE_CARD_PATH,
  DEFAULT_IMAGE_SERVER,
  CREATOR_PUBLISH_URL,
  getScreenshotDir,
  getRuntimeDir,
} from './config';
import {
  evaluateOnPage,
  getActivePage,
  waitForPublishEditor,
  type PageLike,
} from './chrome-session';
import { rewriteCardAsDrafted } from '../lib/md/rewrite';
import { findMasterPoster, generateDynamicRandomSlice } from './slice-helper';

export type RunMode = 'draft' | 'ready';

export interface ExecutorCard {
  id: string;
  coverLines: string[];
  title: string;
  body: string;
  tags: string[];
  imageSlice: string;
  goodsKeyword: string;
  imageServer?: string;
  /** 切片物理文件根（cards 目录）；缺文件时失败可读 */
  cardsDir?: string;
  /** 源 md 路径（draft 成功后回写状态/看板；不回写正文覆盖） */
  mdPath?: string;
  /**
   * 平台定时 ISO。有值时配方含 platform_schedule；
   * v1 = 填开关+时间后停住，绝不点最终发布/定时确认。
   */
  platformScheduleAt?: string;
}

export interface StepResult {
  id: string;
  title: string;
  ok: boolean;
  detail?: unknown;
  err?: string;
}

export interface ExecuteOneCardResult {
  ok: boolean;
  mode: RunMode;
  cardId: string;
  steps: StepResult[];
  screenshotPath: string | null;
  screenshotNote?: string;
  rewritePlan?: { mdPath: string; cardId: string; written: boolean };
  err?: string;
}

type StepDef = { id: string; title: string; accept: string; expression: string };

function loadBuildSteps(): (card: Record<string, unknown>) => StepDef[] {
  // 配方常热改：清缓存避免 worker 长驻吃旧步骤
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    delete require.cache[require.resolve(DRAFT_ONE_CARD_PATH)];
  } catch {
    /* ignore */
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(DRAFT_ONE_CARD_PATH) as {
    buildSteps: (card: Record<string, unknown>) => StepDef[];
  };
  if (!mod?.buildSteps) {
    throw new Error(`无法加载 buildSteps: ${DRAFT_ONE_CARD_PATH}`);
  }
  return mod.buildSteps;
}

/** 每卡从干净发布页起步（上卡暂存后不再有「文字配图」） */
async function resetToPublishEditor(): Promise<void> {
  const page = await getActivePage();

  // 若当前页面已经是干净发布页且「文字配图」立即可见，无需强制全页 reload 避开长时间骨架屏
  const alreadyReady = await page
    .evaluate(() => {
      const el = [...document.querySelectorAll('button,div,span')].find(
        (node) =>
          node.innerText?.trim() === '文字配图' &&
          node.getBoundingClientRect().width > 0
      );
      return Boolean(el);
    })
    .catch(() => false);

  if (alreadyReady) return;

  const withGoto = page as typeof page & {
    goto: (url: string, opts?: object) => Promise<unknown>;
  };
  await withGoto.goto(CREATOR_PUBLISH_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await waitForPublishEditor(page, 50_000);
}

/**
 * 真机切片上传：HTTPS 创作者页 fetch(http://127.0.0.1) 会被 Private Network 拦截。
 * 改用 Playwright setInputFiles 灌本地文件。
 */
async function uploadSliceLocally(
  card: ExecutorCard
): Promise<{ ok: boolean; err?: string; count?: number }> {
  if (!card.cardsDir) {
    return { ok: false, err: 'cardsDir 缺失，无法本地灌切片' };
  }
  let filePath = path.join(card.cardsDir, card.imageSlice);
  let cleanupFn: (() => Promise<void>) | null = null;

  if (!fs.existsSync(filePath)) {
    try {
      const sliceResult = await generateDynamicRandomSlice({
        cardsDir: card.cardsDir,
        cardId: card.id,
        imageSlice: card.imageSlice,
      });
      filePath = sliceResult.tempPath;
      cleanupFn = sliceResult.cleanup;
    } catch (e) {
      return { ok: false, err: `动态切片生成失败: ${String((e as Error).message || e)}` };
    }
  }

  try {
    const page = await getActivePage();
    const withFiles = page as typeof page & {
      setInputFiles?: (
        selector: string,
        files: string | string[]
      ) => Promise<void>;
      locator?: (selector: string) => {
        setInputFiles: (files: string | string[]) => Promise<void>;
        first: () => { setInputFiles: (files: string | string[]) => Promise<void> };
      };
    };
    try {
      if (typeof withFiles.setInputFiles === 'function') {
        await withFiles.setInputFiles(
          'input[type="file"][accept*="image"], input[type="file"][accept*="png"], input[type="file"]',
          filePath
        );
      } else if (typeof withFiles.locator === 'function') {
        await withFiles
          .locator('input[type="file"]')
          .first()
          .setInputFiles(filePath);
      } else {
        return { ok: false, err: 'page 无 setInputFiles' };
      }
    } catch (e) {
      return { ok: false, err: String((e as Error).message || e) };
    }

    // 轮询等待切片图片在小红书前端渲染完成（最多等待 10 秒）
    let count = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      count = await page
        .evaluate(() => {
          const m = document.body.innerText.match(/图片编辑\s*(\d+)\/18/);
          if (m) return Number(m[1]);
          // 退化：检查页面上是否有至少2张上传图片预览
          const previewImgs = document.querySelectorAll('.img.preview, [class*="preview"] img');
          return previewImgs.length;
        })
        .catch(() => 0);
      if (count >= 2) break;
    }
    // 额外缓冲 1 秒平息图片上传网络请求与自动保存防抖
    await new Promise((r) => setTimeout(r, 1000));

    // 封面已占 1，切片后应 ≥2；若 UI 文案变体则只要没报错也放行 ≥1
    return { ok: count >= 1, count };
  } finally {
    if (cleanupFn) {
      await cleanupFn();
    }
  }
}

/** 将解析卡映射为 buildSteps 入参（桩测可直接调用） */
export function mapCardToBuildInput(card: ExecutorCard): Record<string, unknown> {
  return {
    id: card.id,
    coverLines: card.coverLines,
    title: card.title,
    body: card.body,
    tags: card.tags,
    imageSlice: card.imageSlice,
    goodsKeyword: card.goodsKeyword,
    imageServer: card.imageServer || DEFAULT_IMAGE_SERVER,
    platformScheduleAt: card.platformScheduleAt || undefined,
  };
}

/** 最终提交类步骤 id（禁止出现在步骤表） */
const FORBIDDEN_PUBLISH_IDS = new Set([
  'publish',
  'final_publish',
  'confirm_publish',
  'schedule_confirm',
  'confirm_schedule_publish',
]);

export function compileSteps(
  card: ExecutorCard,
  mode: RunMode
): { steps: StepDef[]; skippedIds: string[] } {
  const buildSteps = loadBuildSteps();
  let steps = buildSteps(mapCardToBuildInput(card));
  const skippedIds: string[] = [];
  // ready 或带平台定时：不点暂存离开；平台定时路径强制 Safe Stop
  const dropDraft = mode === 'ready' || !!card.platformScheduleAt;
  if (dropDraft) {
    steps = steps.filter((s) => {
      if (s.id === 'save_draft') {
        skippedIds.push(s.id);
        return false;
      }
      return true;
    });
  }
  // 硬剔最终发布类 id（双保险）
  steps = steps.filter((s) => {
    if (FORBIDDEN_PUBLISH_IDS.has(s.id)) {
      skippedIds.push(s.id);
      return false;
    }
    return true;
  });
  return { steps, skippedIds };
}

function assertSliceExists(card: ExecutorCard): string | null {
  if (!card.cardsDir) return null;
  const p = path.join(card.cardsDir, card.imageSlice);
  if (fs.existsSync(p)) return null;

  // 若静态切片不存在，检查是否能匹配到母本长图
  const master = findMasterPoster(card.cardsDir, card.id, card.imageSlice);
  if (master) return null;

  return (
    `切片文件缺失: ${p}；且未找到母本长图；请先预热 image-server / 运行 crop-slice.py 生成切片，` +
    `勿在执行中重新探索 DOM 选择器`
  );
}

async function shot(label: string): Promise<string | null> {
  try {
    fs.mkdirSync(getScreenshotDir(), { recursive: true });
    const p = path.join(getScreenshotDir(), `${label}-${Date.now()}.png`);
    const page = await getActivePage();
    // 最小化或无前置渲染时设置较短超时（3s），避免阻塞或强制唤起渲染恢复窗口
    await page.screenshot({ path: p, timeout: 3000 }).catch(() => undefined);
    return fs.existsSync(p) ? p : null;
  } catch (e) {
    return null;
  }
}

/**
 * 原生富文本输入/剪贴板注入
 */
export async function injectRichTextViaClipboard(
  page: PageLike,
  text: string,
  selector: string = 'div[contenteditable="true"], .tiptap'
): Promise<{ ok: boolean; count?: number; err?: string }> {
  try {
    const editor = page.locator(selector).first();
    await editor.click();

    // 聚焦并全选现有内容准备覆盖
    const ctrlKey = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
    if (page.keyboard && typeof page.keyboard.press === 'function') {
      await page.keyboard.press(ctrlKey);
    }

    // 真实物理键盘或原生输入接口注入，保留换行
    if (page.keyboard && typeof page.keyboard.insertText === 'function') {
      await page.keyboard.insertText(text);
    } else if (page.keyboard && typeof page.keyboard.type === 'function') {
      await page.keyboard.type(text);
    } else {
      await editor.evaluate((el: unknown, val: unknown) => {
        const node = el as HTMLElement;
        node.focus();
        document.execCommand('selectAll', false, undefined);
        document.execCommand('insertText', false, String(val));
      }, text);
    }

    // 校验输入后 editor 文本非空
    let content: string | null = null;
    if (typeof editor.textContent === 'function') {
      content = await editor.textContent();
    } else if (typeof editor.innerText === 'function') {
      content = await editor.innerText();
    } else if (typeof editor.evaluate === 'function') {
      content = await editor.evaluate((el: unknown) => {
        const node = el as HTMLElement;
        return node.innerText || node.textContent || '';
      });
    }

    if (!content || !content.trim()) {
      return { ok: false, err: '富文本注入后内容为空' };
    }

    return { ok: true, count: content.length };
  } catch (err) {
    return { ok: false, err: String((err as Error).message || err) };
  }
}

export type NativeStepHandler = (
  page: PageLike,
  card: ExecutorCard,
  step: StepDef
) => Promise<{ ok: boolean; err?: string; [k: string]: unknown } | null>;

export const nativeStepHandlers: Record<string, NativeStepHandler> = {
  slice_upload: async (_page, card) => {
    return uploadSliceLocally(card);
  },
  title_body: async (page, card) => {
    try {
      const titleInput = page.locator(
        'input[placeholder*="填写标题"], input[placeholder*="标题"], textarea[placeholder*="填写标题"], textarea[placeholder*="标题"]'
      ).first();
      await titleInput.fill(card.title);

      const bodyRes = await injectRichTextViaClipboard(
        page,
        card.body,
        'div.tiptap.ProseMirror, div[contenteditable="true"], .tiptap'
      );
      if (!bodyRes.ok) {
        return { ok: false, err: `正文原生输入失败: ${bodyRes.err}` };
      }

      return { ok: true, title: card.title, bodyLength: card.body.length };
    } catch (err) {
      return { ok: false, err: String((err as Error).message || err) };
    }
  },
};

export interface ExecuteDeps {
  runExpression?: (expr: string) => Promise<{ ok?: boolean; err?: string; [k: string]: unknown }>;
  skipBrowser?: boolean;
  page?: PageLike;
}

/**
 * 执行单卡。deps 可注入以做步骤表/桩测（不碰真浏览器）。
 */
export async function executeOneCard(
  card: ExecutorCard,
  mode: RunMode,
  deps?: ExecuteDeps
): Promise<ExecuteOneCardResult> {
  const sliceErr = assertSliceExists(card);
  if (sliceErr) {
    return {
      ok: false,
      mode,
      cardId: card.id,
      steps: [],
      screenshotPath: null,
      screenshotNote: '切片缺失，未截图',
      err: sliceErr,
    };
  }

  const { steps, skippedIds } = compileSteps(card, mode);
  const results: StepResult[] = [];
  let screenshotPath: string | null = null;
  const stub = !!deps?.skipBrowser || !!deps?.runExpression;

  const runExpr =
    deps?.runExpression ||
    (async (expr: string) => {
      return evaluateOnPage<{ ok?: boolean; err?: string }>(expr);
    });

  const maybeShot = async (label: string) => {
    if (stub) return null;
    return shot(label);
  };

  if (!stub) {
    try {
      await resetToPublishEditor();
    } catch (e) {
      return {
        ok: false,
        mode,
        cardId: card.id,
        steps: [],
        screenshotPath: await maybeShot(`fail-${card.id}-reset`),
        err: `发布页重置失败: ${String((e as Error).message || e)}`,
      };
    }
  }

  for (const step of steps) {
    // 硬禁：最终发布 / 定时确认；允许 platform_schedule（只填开关+时间）
    const isFinalPublish =
      FORBIDDEN_PUBLISH_IDS.has(step.id) ||
      (/自动点.*发布|红色.*发布|最终.*发布|定时发布确认/.test(step.title) &&
        step.id !== 'platform_schedule');
    if (isFinalPublish) {
      return {
        ok: false,
        mode,
        cardId: card.id,
        steps: results,
        screenshotPath,
        err: `拒绝执行发布类步骤: ${step.id}`,
      };
    }
    try {
      let detail: { ok?: boolean; err?: string; [k: string]: unknown };
      if (!stub && nativeStepHandlers[step.id]) {
        const page = deps?.page || (await getActivePage());
        const handled = await nativeStepHandlers[step.id](page, card, step);
        if (handled !== null) {
          detail = handled;
        } else {
          detail = await runExpr(step.expression);
        }
      } else if (!stub && step.id === 'slice_upload') {
        detail = await uploadSliceLocally(card);
      } else {
        detail = await runExpr(step.expression);
      }
      const ok = !!(detail && detail.ok !== false);
      results.push({
        id: step.id,
        title: step.title,
        ok,
        detail,
        err: ok ? undefined : String(detail?.err || 'step ok:false'),
      });
      if (!ok) {
        screenshotPath =
          (await maybeShot(`fail-${card.id}-${step.id}`)) || screenshotPath;
        return {
          ok: false,
          mode,
          cardId: card.id,
          steps: results,
          screenshotPath,
          screenshotNote: stub
            ? '桩测无截图'
            : screenshotPath
              ? undefined
              : '截图失败',
          err: `步骤失败 ${step.id}: ${detail?.err || 'ok:false'}`,
        };
      }
    } catch (e) {
      results.push({
        id: step.id,
        title: step.title,
        ok: false,
        err: String((e as Error).message || e),
      });
      screenshotPath =
        (await maybeShot(`err-${card.id}-${step.id}`)) || screenshotPath;
      return {
        ok: false,
        mode,
        cardId: card.id,
        steps: results,
        screenshotPath,
        err: String((e as Error).message || e),
      };
    }
  }

  // ready：断言未执行暂存
  if (mode === 'ready' && results.some((r) => r.id === 'save_draft')) {
    return {
      ok: false,
      mode,
      cardId: card.id,
      steps: results,
      screenshotPath,
      err: 'ready 模式误执行了 save_draft',
    };
  }
  void skippedIds;

  screenshotPath = (await maybeShot(`ok-${card.id}-${mode}`)) || screenshotPath;

  let rewritePlan: ExecuteOneCardResult['rewritePlan'];
  if (mode === 'draft' && card.mdPath && !deps?.skipBrowser) {
    try {
      const raw = fs.readFileSync(card.mdPath, 'utf8');
      const wr = rewriteCardAsDrafted(raw, card.id);
      if (wr.ok) {
        fs.writeFileSync(card.mdPath, wr.md, 'utf8');
        rewritePlan = { mdPath: card.mdPath, cardId: card.id, written: true };
      } else {
        rewritePlan = { mdPath: card.mdPath, cardId: card.id, written: false };
      }
    } catch (e) {
      rewritePlan = { mdPath: card.mdPath, cardId: card.id, written: false };
    }
  } else if (mode === 'draft' && card.mdPath && deps?.skipBrowser) {
    // 桩测：只生成回写计划，不写盘除非调用方处理
    rewritePlan = { mdPath: card.mdPath, cardId: card.id, written: false };
  }

  fs.mkdirSync(getRuntimeDir(), { recursive: true });
  return {
    ok: true,
    mode,
    cardId: card.id,
    steps: results,
    screenshotPath,
    screenshotNote: stub
      ? '桩测无截图'
      : screenshotPath
        ? undefined
        : '无截图（页面不可用）',
    rewritePlan,
  };
}
