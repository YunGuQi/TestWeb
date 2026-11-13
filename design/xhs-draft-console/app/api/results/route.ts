import { NextRequest, NextResponse } from 'next/server';
import { scanResultMapFromCardsDir } from '@/lib/result-resolver.server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cardsDir = searchParams.get('cardsDir') || undefined;
    const resultMap = scanResultMapFromCardsDir(cardsDir);
    return NextResponse.json({ ok: true, resultMap });
  } catch (e) {
    return NextResponse.json(
      { ok: false, err: String((e as Error).message || e), resultMap: {} },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { cardsDir?: string };
    const resultMap = scanResultMapFromCardsDir(body.cardsDir);
    return NextResponse.json({ ok: true, resultMap });
  } catch (e) {
    return NextResponse.json(
      { ok: false, err: String((e as Error).message || e), resultMap: {} },
      { status: 500 }
    );
  }
}
