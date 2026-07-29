import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');

  if (!testId) {
    return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'config', 'tests', `${testId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Test config not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // 对于 C 端公开接口，如果需要可以在此打乱选项顺序等，目前原样返回
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error reading config for ${testId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
