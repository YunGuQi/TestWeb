/**
 * 回写纯逻辑：卡状态行 + 头部看板 [x]
 */
import { parseAndValidateCopyMd, parseMetaLine } from './parse';

function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function upsertMetaField(inner: string, key: string, value: string): string {
  const parts = inner.split('｜').map((p) => p.trim()).filter(Boolean);
  let found = false;
  const next = parts.map((p) => {
    const i = p.indexOf('=');
    if (i <= 0) return p;
    const k = p.slice(0, i).trim();
    if (k === key) {
      found = true;
      return `${key}=${value}`;
    }
    return p;
  });
  if (!found) {
    // 插入到商品之后或末尾前
    const goodsIdx = next.findIndex((p) => p.startsWith('商品='));
    if (goodsIdx >= 0) next.splice(goodsIdx + 1, 0, `${key}=${value}`);
    else next.unshift(`${key}=${value}`);
  }
  return next.join('｜');
}

/**
 * 将指定 cardId 标为已存草稿并勾看板。返回新 md 全文。
 */
export function rewriteCardAsDrafted(
  mdText: string,
  cardId: string,
  date: string = todayISO()
): { ok: true; md: string } | { ok: false; err: string } {
  const parsed = parseAndValidateCopyMd(mdText);
  const card = parsed.cards.find((c) => c.meta?.cardId === cardId);
  if (!card) return { ok: false, err: `找不到 cardId=${cardId}` };
  if (!card.meta || card.metaStart < 0) {
    return { ok: false, err: `cardId=${cardId} 无元数据行，无法回写` };
  }

  const statusVal = `已存草稿(${date})`;
  const newInner = upsertMetaField(card.meta.raw, '状态', statusVal);
  const before = mdText.slice(0, card.metaStart);
  const after = mdText.slice(card.metaEnd);
  let md = `${before}\`${newInner}\`${after}`;

  // 看板：按标题把 `- [ ] **…**：\`title\`` 改为 [x]
  const title = card.title;
  const boardRe = new RegExp(
    `^(- \\[)[ ](\\]\\s+\\*\\*[^*]+\\*\\*：\`${escapeReg(title)}\`)`,
    'm'
  );
  if (boardRe.test(md)) {
    md = md.replace(boardRe, '$1x$2');
  } else {
    // 若看板尚无该项，在看板区末尾补一行（尽力）
    const insert = `- [x] **自动回写**：\`${title}\`（状态：【已存草稿】${date}，平台：小红书）\n`;
    const boardAnchor = md.indexOf('录入与发布进度看板');
    if (boardAnchor >= 0) {
      const afterBoard = md.indexOf('\n\n', boardAnchor);
      if (afterBoard > 0) {
        md = md.slice(0, afterBoard) + '\n' + insert + md.slice(afterBoard);
      }
    }
  }

  // 卡前可读状态行（若紧邻 fence 上方尚无【状态：已存草稿】则插入）
  const fenceStart = md.indexOf('```text', card.fenceStart >= 0 ? Math.max(0, card.fenceStart - 80) : 0);
  // 重新定位该卡 fence：用回写后再次解析更稳
  const again = parseAndValidateCopyMd(md);
  const againCard = again.cards.find((c) => c.meta?.cardId === cardId);
  if (againCard) {
    const pre = md.slice(Math.max(0, againCard.fenceStart - 120), againCard.fenceStart);
    if (!/【状态：已存草稿】/.test(pre)) {
      const mark = `\n> **【状态：已存草稿】**（${date} 已录入小红书草稿箱 · 请勿重复发布）\n\n`;
      md = md.slice(0, againCard.fenceStart) + mark + md.slice(againCard.fenceStart);
    }
  }

  void fenceStart;
  void parseMetaLine;
  return { ok: true, md };
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { todayISO };
