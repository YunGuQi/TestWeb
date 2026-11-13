import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { exportMobileHubData } from '@/lib/export/mobile-hub-exporter';

export const runtime = 'nodejs';

function resolveDefaultMdPath(): string {
  const candidates = [
    'design/product-docs/大女主觉醒测试/docs/2026-10-28_发帖文案.md',
    'design/product-docs/大女主觉醒测试/docs/2026-10-10_发帖文案.md',
    'design/xhs-draft-console/tests/fixtures/sample-copy.md',
  ];

  for (const c of candidates) {
    const full = path.resolve(process.cwd(), c);
    if (fs.existsSync(full)) return full;
    const fromConsole = path.resolve(process.cwd(), '../../', c);
    if (fs.existsSync(fromConsole)) return fromConsole;
  }

  return path.resolve(process.cwd(), 'tests/fixtures/sample-copy.md');
}

function resolveDefaultCardsDir(): string | undefined {
  const candidates = [
    'design/product-docs/大女主觉醒测试/assets',
    'design/product-docs/大女主觉醒测试',
  ];
  for (const c of candidates) {
    const full = path.resolve(process.cwd(), c);
    if (fs.existsSync(full)) return full;
    const fromConsole = path.resolve(process.cwd(), '../../', c);
    if (fs.existsSync(fromConsole)) return fromConsole;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mdPath = body.mdPath ? path.resolve(body.mdPath) : resolveDefaultMdPath();
    const cardsDir = body.cardsDir ? path.resolve(body.cardsDir) : resolveDefaultCardsDir();

    const result = await exportMobileHubData({
      mdPath,
      cardsDir,
      outDir: body.outDir,
      accessPassword: body.accessPassword || body.password,
      accounts: body.accounts,
      generateZip: body.generateZip !== false,
      productName: body.productName,
    });

    return NextResponse.json({
      ok: true,
      outDir: result.outDir,
      zipPath: result.zipPath,
      totalCards: result.totalCards,
      productName: result.data.productName,
      generatedAt: result.data.generatedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || '导出 Mobile Post Hub 失败',
      },
      { status: 500 }
    );
  }
}
