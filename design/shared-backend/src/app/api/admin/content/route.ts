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
      // 默认空模板
      const defaultTemplate = {
        testId: testId,
        questions: [],
        results: []
      };
      return NextResponse.json(defaultTemplate);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error reading config for ${testId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');

  if (!testId) {
    return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    const dirPath = path.join(process.cwd(), 'src', 'config', 'tests');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const filePath = path.join(dirPath, `${testId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error writing config for ${testId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
