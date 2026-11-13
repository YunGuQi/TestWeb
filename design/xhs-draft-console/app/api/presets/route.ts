import { NextResponse } from 'next/server';
import { scanProductPresets } from '@/lib/scan-presets';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const presets = scanProductPresets();
    return NextResponse.json({ ok: true, presets });
  } catch (e) {
    return NextResponse.json(
      { ok: false, err: String((e as Error).message || e), presets: [] },
      { status: 500 }
    );
  }
}
