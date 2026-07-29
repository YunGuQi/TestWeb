import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { answers, deviceId } = await request.json();

    const configPath = path.join(process.cwd(), 'src', 'config', 'tests', 'destined-lover.json');
    const fileContents = await fs.readFile(configPath, 'utf8');
    const data = JSON.parse(fileContents);

    const scores: Record<string, number> = { R: 0, P: 0, D: 0, I: 0, S: 0, C: 0 };

    data.questions.forEach((q: any) => {
      const selectedOptionId = answers[q.id];
      if (!selectedOptionId) return;
      
      const option = q.options.find((o: any) => o.id === selectedOptionId);
      if (option && option.scores) {
        option.scores.forEach(({ axis, score }: { axis: string, score: number }) => {
          if (scores[axis] !== undefined) {
            scores[axis] += score;
          }
        });
      }
    });

    // Resolve axes (ties break toward P, I, C as per PRD "兜底规则")
    const axis1 = scores.R > scores.P ? 'R' : 'P';
    const axis2 = scores.D > scores.I ? 'D' : 'I';
    const axis3 = scores.S > scores.C ? 'S' : 'C'; 

    const resultId = `${axis1}${axis2}${axis3}`;
    const resultArchetype = data.results.find((r: any) => r.id === resultId) || data.results[0];

    // Attempt to hit the shared backend API for current_rank
    let current_rank = Math.floor(Math.random() * 1000) + 10000;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com';
      const submitRes = await fetch(`${API_BASE}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: 'destined-lover',
          deviceId: deviceId || 'anonymous'
        }),
        signal: AbortSignal.timeout(3000)
      });
      if (submitRes.ok) {
        const json = await submitRes.json();
        if (json.current_rank) current_rank = json.current_rank;
      }
    } catch (e) {
      console.error("Shared backend submit failed, using fallback rank:", e);
    }

    return NextResponse.json({
      success: true,
      result: resultArchetype,
      current_rank
    });
  } catch (error) {
    console.error('Error processing submit-dl:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process test results' },
      { status: 500 }
    );
  }
}
