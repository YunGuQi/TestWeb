import { NextRequest, NextResponse } from 'next/server';
import { executePickerPowerShell, type PickOptions } from '../../../../lib/picker';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let body: PickOptions = {};
    try {
      body = (await req.json()) as PickOptions;
    } catch {
      body = {};
    }
    const result = await executePickerPowerShell(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { path: null, cancelled: true, error: String((e as Error).message || e) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') === 'directory' ? 'directory' : 'file';
    const defaultPath = searchParams.get('defaultPath') || undefined;
    const filter = searchParams.get('filter') || undefined;

    const result = await executePickerPowerShell({ mode, defaultPath, filter });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { path: null, cancelled: true, error: String((e as Error).message || e) },
      { status: 500 }
    );
  }
}
