/**
 * parseAndValidateCopyMd — Spec 测试接缝 #1
 * 纯函数：解析 *发帖文案.md → { cards, errors }
 */
import type { CardStatusKind, ParseResult, ParsedCard, ParsedMeta } from './types';

const FENCE_RE = /```text\r?\n([\s\S]*?)```/g;
const META_LINE_RE = /^`([^`]+)`\s*$/;
const BOARD_ITEM_RE = /^- \[([ xX])\]\s+\*\*[^*]+\*\*：`([^`]+)`/gm;

function parseStatus(raw: string | undefined): {
  kind: CardStatusKind;
  date?: string;
} {
  if (raw == null || String(raw).trim() === '') return { kind: 'empty' };
  const s = String(raw).trim();
  let m = s.match(/^已存草稿\((\d{4}-\d{2}-\d{2})\)$/);
  if (m) return { kind: 'drafted', date: m[1] };
  m = s.match(/^已发布\((\d{4}-\d{2}-\d{2})\)$/);
  if (m) return { kind: 'published', date: m[1] };
  // 兼容「已存草稿」无日期
  if (/^已存草稿/.test(s)) return { kind: 'drafted' };
  if (/^已发布/.test(s)) return { kind: 'published' };
  return { kind: 'unknown' };
}

export function parseMetaLine(inner: string): ParsedMeta {
  const fields: Record<string, string> = {};
  for (const part of inner.split('｜')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    fields[k] = v;
  }
  const statusRaw = fields['状态'];
  const st = parseStatus(statusRaw);
  return {
    raw: inner,
    fields,
    cardId: fields['cardId'] || undefined,
    slice: fields['切片'] || undefined,
    goods: fields['商品'] || undefined,
    statusRaw,
    statusKind: st.kind,
    statusDate: st.date,
  };
}

function parseTextBlock(body: string): {
  coverLines: string[];
  title: string;
  body: string;
  tags: string[];
} {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const coverLines: string[] = [];
  let title = '';
  const bodyLines: string[] = [];
  let tags: string[] = [];
  let mode: 'pre' | 'cover' | 'afterCover' | 'body' = 'pre';

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (t.startsWith('[封面]')) {
      mode = 'cover';
      const rest = t.slice('[封面]'.length).trim();
      if (rest) coverLines.push(rest);
      continue;
    }
    if (t.startsWith('[标题]')) {
      mode = 'body';
      title = t.slice('[标题]'.length).trim();
      continue;
    }
    if (mode === 'cover') {
      if (!t) {
        mode = 'afterCover';
        continue;
      }
      coverLines.push(t);
      continue;
    }
    if (mode === 'body' || mode === 'afterCover') {
      if (/^#[^\s#]/.test(t) || /^#\S/.test(t)) {
        // 话题行：#a #b #c …
        const found = t.match(/#[^\s#]+/g) || [];
        tags = found.map((x) => x.replace(/^#/, ''));
        continue;
      }
      if (t) bodyLines.push(t);
      mode = 'body';
    }
  }

  return {
    coverLines,
    title,
    body: bodyLines.join('\n'),
    tags,
  };
}

function extractBoardChecked(md: string): string[] {
  const out: string[] = [];
  BOARD_ITEM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BOARD_ITEM_RE.exec(md))) {
    if (m[1].toLowerCase() === 'x') out.push(m[2].trim());
  }
  return out;
}

function findMetaAfterFence(md: string, fenceEnd: number): {
  meta: ParsedMeta | null;
  start: number;
  end: number;
} {
  const rest = md.slice(fenceEnd);
  const lineMatch = rest.match(/^\r?\n(`([^`]+)`)\s*(?:\r?\n|$)/);
  if (!lineMatch) return { meta: null, start: -1, end: -1 };
  const full = lineMatch[1];
  const inner = lineMatch[2];
  const start = fenceEnd + (lineMatch[0].startsWith('\r\n') ? 2 : 1);
  const end = start + full.length;
  return { meta: parseMetaLine(inner), start, end };
}

/**
 * 解析并校验发帖文案 md。
 */
export function parseAndValidateCopyMd(mdText: string): ParseResult {
  const errors: string[] = [];
  const boardTitlesChecked = extractBoardChecked(mdText);
  const cards: ParsedCard[] = [];
  const checkedSet = new Set(boardTitlesChecked);

  FENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let index = 0;
  while ((m = FENCE_RE.exec(mdText))) {
    const fenceStart = m.index;
    const fenceEnd = m.index + m[0].length;
    const block = parseTextBlock(m[1]);
    const { meta, start: metaStart, end: metaEnd } = findMetaAfterFence(
      mdText,
      fenceEnd
    );

    const cardErrors: string[] = [];
    if (!block.coverLines.length) cardErrors.push('缺少封面行');
    if (!block.title) cardErrors.push('缺少标题');
    if (block.tags.length !== 5) {
      cardErrors.push(`话题数应为 5，实际 ${block.tags.length}`);
    }

    const boardChecked = checkedSet.has(block.title);
    let runnable = true;
    let skipReason: string | undefined;

    if (!meta?.cardId) {
      cardErrors.push('缺 cardId');
      runnable = false;
    }
    if (!meta?.slice) {
      cardErrors.push('缺切片');
      runnable = false;
    }
    if (!meta?.goods) {
      cardErrors.push('缺商品');
      runnable = false;
    }

    if (meta?.statusKind === 'drafted' || meta?.statusKind === 'published') {
      runnable = false;
      skipReason =
        meta.statusKind === 'drafted' ? '已存草稿（防重）' : '已发布（防重）';
    } else if (boardChecked) {
      runnable = false;
      skipReason = '看板已勾（防重）';
    } else if (cardErrors.some((e) => e.startsWith('缺'))) {
      runnable = false;
      skipReason = '缺必填机读字段';
    } else if (cardErrors.length) {
      runnable = false;
      skipReason = cardErrors.join('；');
    }

    const executorFields =
      meta?.cardId && meta.slice && meta.goods
        ? {
            id: meta.cardId,
            coverLines: block.coverLines,
            title: block.title,
            body: block.body,
            tags: block.tags,
            imageSlice: meta.slice,
            goodsKeyword: meta.goods,
          }
        : undefined;

    cards.push({
      index,
      fenceStart,
      fenceEnd,
      metaStart,
      metaEnd,
      coverLines: block.coverLines,
      title: block.title,
      body: block.body,
      tags: block.tags,
      meta,
      boardChecked,
      runnable,
      skipReason,
      errors: cardErrors,
      executorFields,
    });
    index += 1;
  }

  if (!cards.length) errors.push('未找到任何 ```text 卡块');

  return { cards, boardTitlesChecked, errors };
}

/** 按防重顺序取可跑卡，至多 N 张 */
export function pickRunnableCards(result: ParseResult, n: number): ParsedCard[] {
  const limit = Math.max(0, Math.min(10, Math.floor(n)));
  return result.cards.filter((c) => c.runnable).slice(0, limit);
}

/** 快捷提取所有解析卡片 */
export function parseMarkdownCards(mdText: string): ParsedCard[] {
  return parseAndValidateCopyMd(mdText).cards;
}
