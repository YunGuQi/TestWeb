import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { CITY_QUESTIONS_FALLBACK, CITY_RESULTS_FALLBACK } from '../../../../lib/city-fallback';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { EngineFactory } from '../../../../lib/engines';

export async function POST(req: Request) {
  try {
    // ==== 1. 频控保护：防止恶意脚本并发刷爆数据库 ====
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkRateLimit(`city_submit:${ip}`, 10, 60000);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: '提交太频繁，请稍后再试' }, { status: 429 });
    }

    const { answers, deviceId, turnstileToken } = await req.json(); 

    if (!answers) {
      return NextResponse.json({ success: false, error: '无有效答案数据' }, { status: 400 });
    }
    
    // ==== 2. Cloudflare Turnstile 校验（智能弹性防御） ====
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && turnstileToken) {
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}`
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          console.warn('[City Submit API] Turnstile verification failed:', verifyData);
        }
      } catch (e) {
        console.warn('Turnstile verification network timeout, gracefully continuing for city test:', e);
      }
    }

    // ==== 3. 委托给标准化 EngineFactory.getEngine('city-personality') 进行计算 ====
    const engine = EngineFactory.getEngine('city-personality');
    const optionIds = Array.isArray(answers) ? answers.map(a => String(a)) : [];
    const closestCity: any = await engine.calculate({
      optionIds,
      metadata: { deviceId },
      testId: 'city-personality'
    });
    const userCoords = closestCity.rawScores?.userCoords || [0, 0, 0, 0, 0];

    // 4. Save to TestRecord first so count is updated
    let recordCount = 1;
    try {
      await prisma.testRecord.create({
        data: {
          testId: 'city-personality',
          deviceId: deviceId || 'unknown',
          answers: JSON.stringify(answers || []),
          resultId: closestCity?.id || 1
        }
      });
      recordCount = await prisma.testRecord.count({
        where: { testId: 'city-personality' }
      });
    } catch (e) {
      console.error("Error creating TestRecord for city:", e);
    }

    // 5. Calculate rank from local DB & GlobalConfig (matching admin dashboard)
    let current_rank = 1263;
    try {
      const config = await prisma.globalConfig.findFirst({
        where: { testId: 'city-personality' }
      });
      const baseCount = config?.baseCount || 1260;
      current_rank = baseCount + recordCount;
    } catch (e) {
      console.error("Error calculating rank:", e);
    }

    // 物理剥离后 70% 生活切片敏感字段，切断网络抓包白嫖
    const safeCity = {
      id: closestCity.id,
      name: closestCity.name,
      title: closestCity.title, 
      desc: closestCity.desc,
      quote: closestCity.quote,
      theme: closestCity.theme,
      tags: closestCity.tags,
      coords: closestCity.coords,
      residentId: closestCity.residentId
      // 物理排除: schedule, curePrescription, toxicCity
    };

    return NextResponse.json({
      success: true,
      data: {
        city: safeCity,
        rank: current_rank,
        userCoords
      }
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
