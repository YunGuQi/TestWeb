import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { questions, results } from '../../../lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const testId = searchParams.get('testId') || 'emotional-friction';

    if (!deviceId) {
      return NextResponse.json({ success: true, history: [] });
    }

    const records = await prisma.testRecord.findMany({
      where: {
        deviceId,
        testId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const resultConfigs = await prisma.resultConfig.findMany({
      where: { testId }
    });
    const resultConfigMap = new Map(resultConfigs.map(r => [r.condition, r]));
    const resultConfigMapById = new Map(resultConfigs.map(r => [r.id, r]));

    const allOptionIds = new Set<string>();
    records.forEach(rec => {
      try {
        const answers = JSON.parse(rec.answers || '{}');
        Object.values(answers).forEach((v: any) => {
          if (v) allOptionIds.add(v.toString());
        });
      } catch(e) {}
    });

    const numericIds = Array.from(allOptionIds).map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    let dbOptionsMap = new Map<number, any>();
    if (numericIds.length > 0) {
      const dbOptions = await prisma.option.findMany({
        where: { id: { in: numericIds } }
      });
      dbOptions.forEach(opt => dbOptionsMap.set(opt.id, opt));
    }

    const history = records.map(rec => {
      let answers: Record<string, any> = {};
      try {
        answers = JSON.parse(rec.answers || '{}');
      } catch (e) {}

      // 在服务端为历史记录重算账单分值与项
      const optionIds: string[] = Object.values(answers).map((v: any) => {
        if (typeof v === 'string' || typeof v === 'number') return v.toString();
        return v?.id?.toString();
      }).filter(Boolean);

      let sen = 0, rum = 0, pls = 0, bnd = 0;
      const billItems: Array<{ name: string; cost: number }> = [];

      questions.forEach(q => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            sen += opt.senScore || 0;
            rum += opt.rumScore || 0;
            pls += opt.plsScore || 0;
            bnd += opt.bndScore || 0;

            const cost = ((opt.senScore || 0) * 300) + ((opt.rumScore || 0) * 250) + ((opt.plsScore || 0) * 280);
            if (opt.billName && cost > 0) {
              billItems.push({ name: opt.billName, cost });
            }
          }
        });
      });
      
      optionIds.forEach(id => {
        const numId = parseInt(id, 10);
        const opt = dbOptionsMap.get(numId);
        if (opt) {
          try {
            const scores = JSON.parse(opt.scores || '{}');
            const senScore = scores.sen || 0;
            const rumScore = scores.rum || 0;
            const plsScore = scores.pls || 0;
            const bndScore = scores.bnd || 0;

            sen += senScore;
            rum += rumScore;
            pls += plsScore;
            bnd += bndScore;

            const cost = (senScore * 300) + (rumScore * 250) + (plsScore * 280);
            if (scores.billName && cost > 0) {
              billItems.push({ name: scores.billName, cost });
            }
          } catch (e) {}
        }
      });

      let totalFriction = (sen * 300) + (rum * 250) + (pls * 280) - (bnd * 100);
      if (totalFriction < 0) totalFriction = 0;

      let resultKey = 'bnd';
      const maxVal = Math.max(sen, rum, pls, bnd);

      if (sen >= 35 && rum >= 35 && pls >= 35) {
        resultKey = 'high';
      } else if (sen >= 30 && pls >= 30) {
        resultKey = 'sen_pls';
      } else if (rum >= 40 && bnd <= 10) {
        resultKey = 'rum_low_bnd';
      } else if (bnd >= 40 && sen <= 15) {
        resultKey = 'low';
      } else if (pls === maxVal) {
        resultKey = 'pls';
      } else if (rum === maxVal) {
        resultKey = 'rum';
      } else if (sen === maxVal) {
        resultKey = 'sen';
      } else if (bnd === maxVal) {
        resultKey = 'bnd';
      }

      const fallbackRes = results.find(r => r.key === resultKey) || results[0];
      const resConfig = resultConfigMapById.get(rec.resultId) || resultConfigMap.get(resultKey);

      return {
        id: rec.id,
        timestamp: new Date(rec.createdAt).getTime(),
        result: {
          id: rec.resultId || resConfig?.id || 1,
          key: resultKey,
          title: resConfig?.title || fallbackRes.title,
          tags: resConfig ? '' : (fallbackRes.tags || '#钝感力王者,#反PUA大师'),
          description: resConfig?.desc || fallbackRes.description,
          quote: resConfig?.quote || fallbackRes.quote,
          sen,
          rum,
          pls,
          bnd,
          totalFriction,
          maxScore: 100,
          billItems
        }
      };
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json({ success: false, error: '获取历史记录失败' }, { status: 500 });
  }
}
