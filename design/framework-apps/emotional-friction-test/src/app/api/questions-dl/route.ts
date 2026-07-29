import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'tests', 'destined-lover.json');
    const fileContents = await fs.readFile(configPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    const safeQuestions = data.questions.map((q: any) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o: any) => ({
        id: o.id,
        text: o.text
      }))
    }));

    return NextResponse.json({
      success: true,
      questions: safeQuestions
    });
  } catch (error) {
    console.error('Error reading destined-lover config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load test configuration' },
      { status: 500 }
    );
  }
}
