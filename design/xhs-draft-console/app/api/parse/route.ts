import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { parseAndValidateCopyMd, pickRunnableCards } from '@/lib/md';
import { scanResultMapFromCardsDir } from '@/lib/result-resolver.server';
import { resolveResultLabel } from '@/lib/result-resolver';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { mdPath?: string; mdText?: string; cardsDir?: string };
    let text = body.mdText || '';
    if (body.mdPath) {
      if (!fs.existsSync(body.mdPath)) {
        return NextResponse.json(
          { ok: false, err: `文件不存在: ${body.mdPath}` },
          { status: 400 }
        );
      }
      text = fs.readFileSync(body.mdPath, 'utf8');
    }
    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, err: '需要 mdPath 或 mdText' },
        { status: 400 }
      );
    }
    const parsed = parseAndValidateCopyMd(text);
    const resultMap = scanResultMapFromCardsDir(body.cardsDir);

    for (const card of parsed.cards) {
      const res = resolveResultLabel(
        { id: card.meta?.cardId, meta: card.meta, title: card.title },
        resultMap,
        card.executorFields?.goodsKeyword
      );
      if (card.meta) {
        card.meta.resolvedResult = res;
      }
      card.resultLabel = res;
    }

    return NextResponse.json({
      ok: true,
      ...parsed,
      resultMap,
      runnableCount: pickRunnableCards(parsed, 10).length,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, err: String((e as Error).message || e) },
      { status: 500 }
    );
  }
}
