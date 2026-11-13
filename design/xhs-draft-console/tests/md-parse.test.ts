import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
  parseAndValidateCopyMd,
  pickRunnableCards,
  rewriteCardAsDrafted,
} from '../lib/md';

const fixture = readFileSync(
  join(__dirname, 'fixtures/sample-copy.md'),
  'utf8'
);

describe('parseAndValidateCopyMd', () => {
  it('抽出封面/标题/正文/话题/元数据', () => {
    const r = parseAndValidateCopyMd(fixture);
    expect(r.cards.length).toBe(3);
    const ok = r.cards[2];
    expect(ok.coverLines).toEqual(['不争不抢', '难道就会饿死吗', '真没那回事']);
    expect(ok.title).toContain('不争不抢');
    expect(ok.tags).toHaveLength(5);
    expect(ok.meta?.cardId).toBe('r1_m4');
    expect(ok.meta?.slice).toBe('r1_m4_slice.png');
    expect(ok.meta?.goods).toBe('大女主觉醒自测模板');
  });

  it('缺字段 → runnable=false', () => {
    const r = parseAndValidateCopyMd(fixture);
    const bad = r.cards[1];
    expect(bad.runnable).toBe(false);
    expect(bad.errors.some((e) => e.includes('cardId'))).toBe(true);
    expect(bad.errors.some((e) => e.includes('切片'))).toBe(true);
    expect(bad.errors.some((e) => e.includes('商品'))).toBe(true);
  });

  it('已存草稿跳过；合法空状态可入队', () => {
    const r = parseAndValidateCopyMd(fixture);
    expect(r.cards[0].runnable).toBe(false);
    expect(r.cards[0].skipReason).toMatch(/已存草稿/);
    expect(r.cards[2].runnable).toBe(true);
    expect(pickRunnableCards(r, 3)).toHaveLength(1);
  });

  it('回写后再解析状态正确且看板勾选', () => {
    const wr = rewriteCardAsDrafted(fixture, 'r1_m4', '2026-10-28');
    expect(wr.ok).toBe(true);
    if (!wr.ok) return;
    const r = parseAndValidateCopyMd(wr.md);
    const card = r.cards.find((c) => c.meta?.cardId === 'r1_m4');
    expect(card?.meta?.statusKind).toBe('drafted');
    expect(card?.runnable).toBe(false);
    expect(r.boardTitlesChecked).toContain(
      '不争不抢难道会饿死？下班关机吃碗面'
    );
  });
});
