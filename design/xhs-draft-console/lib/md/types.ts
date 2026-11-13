import type { ResultLabel } from '../result-resolver';

/** 机读卡与解析结果类型（01 接缝） */

export type CardStatusKind = 'empty' | 'drafted' | 'published' | 'unknown';

export interface ParsedMeta {
  raw: string;
  /** 键值表（键名原样；含 cardId/切片/商品/状态 等） */
  fields: Record<string, string>;
  cardId?: string;
  slice?: string;
  goods?: string;
  statusRaw?: string;
  statusKind: CardStatusKind;
  statusDate?: string;
  resolvedResult?: ResultLabel;
}

export interface ParsedCard {
  index: number;
  /** text 块在源 md 中的起止（含围栏） */
  fenceStart: number;
  fenceEnd: number;
  /** 元数据行起止（整行，含反引号）；无则 -1 */
  metaStart: number;
  metaEnd: number;
  coverLines: string[];
  title: string;
  body: string;
  tags: string[];
  meta: ParsedMeta | null;
  resultLabel?: ResultLabel;
  boardChecked: boolean;
  runnable: boolean;
  skipReason?: string;
  errors: string[];
  /** 映射 draft-one-card 入参 */
  executorFields?: {
    id: string;
    coverLines: string[];
    title: string;
    body: string;
    tags: string[];
    imageSlice: string;
    goodsKeyword: string;
  };
}

export interface ParseResult {
  cards: ParsedCard[];
  boardTitlesChecked: string[];
  errors: string[];
  resultMap?: Record<string, string>;
}
