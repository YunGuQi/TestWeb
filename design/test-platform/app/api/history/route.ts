import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifySessionToken } from '../../../lib/session';
import { EngineFactory } from '../../../lib/engines';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const testId = searchParams.get('testId') || 'emotional-friction';

    // 提取当前客户端 Cookie 会话中的 participantId
    let participantId: string | null = null;
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/test_session=([^;]+)/);
    if (match && match[1]) {
      try {
        const payload = await verifySessionToken(match[1]);
        if (payload && payload.participantId) {
          participantId = payload.participantId;
        }
      } catch (e) {}
    }

    const targetDeviceIds = [deviceId, participantId].filter(Boolean) as string[];

    if (targetDeviceIds.length === 0) {
      return NextResponse.json({ success: true, history: [] });
    }

    const records = await prisma.testRecord.findMany({
      where: {
        deviceId: { in: targetDeviceIds },
        testId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const engine = EngineFactory.getEngine(testId);

    const history = await Promise.all(records.map(async (rec) => {
      let answers: Record<string, any> = {};
      try {
        answers = JSON.parse(rec.answers || '{}');
      } catch (e) {}

      const optionIds: string[] = Object.values(answers).map((v: any) => {
        if (typeof v === 'string' || typeof v === 'number') return v.toString();
        return v?.id?.toString();
      }).filter(Boolean);

      const calculated = await engine.calculate({ optionIds, testId });

      return {
        id: rec.id,
        timestamp: new Date(rec.createdAt).getTime(),
        result: {
          ...calculated,
          recordId: rec.id
        }
      };
    }));

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json({ success: false, error: '获取历史记录失败' }, { status: 500 });
  }
}

