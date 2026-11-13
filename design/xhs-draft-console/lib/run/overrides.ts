/**
 * 本批覆盖字段合并（工单 09）
 * 话题与 draft-one-card 约定：tags 不含 #，执行时再拼 #
 */

export type CardOverride = {
  cardId: string;
  coverLines?: string[];
  title?: string;
  body?: string;
  /** 可含或不含 #；合并后统一去 # */
  topics?: string[];
};

export type MergeableCard = {
  id: string;
  coverLines: string[];
  title: string;
  body: string;
  tags: string[];
  imageSlice: string;
  goodsKeyword: string;
  imageServer?: string;
  cardsDir?: string;
  mdPath?: string;
  platformScheduleAt?: string;
};

/** 去掉前导 #，去空白；空串丢弃 */
export function normalizeTopics(topics: string[]): string[] {
  return topics
    .map((t) => String(t ?? '').replace(/^#/, '').trim())
    .filter(Boolean);
}

/**
 * 按 cardId 合并覆盖到执行卡。override.cardId 须与 card.id 一致（调用方先校验）。
 */
export function mergeCardOverrides(
  card: MergeableCard,
  override?: CardOverride | null
): MergeableCard {
  if (!override) return { ...card };
  if (override.cardId && override.cardId !== card.id) {
    throw new Error(
      `覆盖 cardId=${override.cardId} 与卡 ${card.id} 不一致，拒绝套错卡`
    );
  }
  const next: MergeableCard = { ...card };
  if (override.coverLines != null) {
    // 封面大字允许 1～5 行（MD 常见 3～4 行；硬顶 5 防失控）
    next.coverLines = override.coverLines
      .slice(0, 5)
      .map((l) => String(l).trim())
      .filter(Boolean);
  }
  if (override.title != null) next.title = String(override.title);
  if (override.body != null) next.body = String(override.body);
  if (override.topics != null) next.tags = normalizeTopics(override.topics);
  return next;
}

/** 校验覆盖列表；缺 cardId / 未知 cardId → 拒绝 */
export function validateCardOverrides(
  overrides: CardOverride[] | undefined,
  allowedCardIds: Set<string>
): { ok: true } | { ok: false; err: string } {
  if (!overrides || overrides.length === 0) return { ok: true };
  for (const o of overrides) {
    if (!o || !o.cardId || !String(o.cardId).trim()) {
      return { ok: false, err: 'cardOverrides 项缺 cardId，已拒绝' };
    }
    if (!allowedCardIds.has(o.cardId)) {
      return {
        ok: false,
        err: `未知 cardId「${o.cardId}」不在本批可跑卡中，已拒绝`,
      };
    }
  }
  return { ok: true };
}
