import { NextResponse } from 'next/server';
import { runBaotaSync } from '@/worker/sync-pipeline';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runBaotaSync({
      configPath: body.configPath,
      mdPath: body.mdPath,
      cardsDir: body.cardsDir,
      outDir: body.outDir,
      multiSuite: body.multiSuite !== false,
      suites: body.suites,
      defaultSuiteId: body.defaultSuiteId,
      silent: true,
    });

    return NextResponse.json({
      ok: true,
      mode: result.mode,
      distDir: result.distDir,
      zipPath: result.zipPath,
      publicUrl: result.publicUrl,
      fallbackReason: result.fallbackReason,
      manualSteps: result.manualSteps,
      totalCards: result.totalCards,
      totalSuites: result.totalSuites,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || '宝塔同步流水线执行失败',
      },
      { status: 500 }
    );
  }
}
