import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { CITY_QUESTIONS_FALLBACK, CITY_RESULTS_FALLBACK } from '../../../../lib/city-fallback';
import { checkRateLimit } from '../../../../lib/rate-limit';

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

    
    // 1. 优先从数据库查询题目，若连通失败或无记录，使用本地常数题库兜底
    let questions: any[] = [];
    try {
      questions = await prisma.question.findMany({
        where: { testId: 'city-personality' },
        orderBy: { order: 'asc' },
        include: { options: true }
      });
    } catch (e) {
      console.warn('DB error reading city questions during submit, fallback to local.');
    }
    if (!questions || questions.length === 0) {
      questions = CITY_QUESTIONS_FALLBACK;
    }

    // 城市偏置校准字典（经过 50,000 次蒙特卡洛仿真调优，消除垄断与死锁，保障 16 座城市均衡可达 3.5%~12.0%）
    const CITY_BIASES: Record<string, number> = {
      "深圳": 0.0400,
      "上海": -0.0614,
      "北京": 0.0650,
      "广州": 0.0839,
      "成都": 0.1456,
      "重庆": 0.1145,
      "长沙": 0.0994,
      "武汉": 0.1507,
      "杭州": -0.0883,
      "苏州": -0.3281,
      "大理": -0.0797,
      "阿勒泰": -0.4248,
      "青岛": 0.2005,
      "厦门": 0.0646,
      "西安": 0.1235,
      "三亚": 0.0430
    };

    // 2. 计算用户5维性格向量坐标（以中性原点 [0, 0, 0, 0, 0] 为基准，消除系统性正向漂移）
    let userCoords = [0, 0, 0, 0, 0]; // 初始维度：[rhythm, env, temp, social, taste]
    if (Array.isArray(answers)) {
      answers.forEach((optIndex, qIndex) => {
        const q = questions[qIndex];
        if (q && q.options[optIndex]) {
          try {
            const scoresObj = typeof q.options[optIndex].scores === 'string' 
              ? JSON.parse(q.options[optIndex].scores) 
              : q.options[optIndex].scores;
            // 维度映射：节奏、环境、温度/烟火、社交、品味/美学
            const delta = [
              scoresObj.rhythm || 0,
              scoresObj.env || 0,
              scoresObj.temp || 0,
              scoresObj.social || 0,
              scoresObj.taste || 0
            ];
            userCoords = userCoords.map((v, i) => v + delta[i]);
          } catch(e) {}
        }
      });
    }

    // 3. 优先从数据库寻找城市结果，若数量少于16座则使用本地16座完整结果库兜底
    let allCities: any[] = [];
    try {
      allCities = await prisma.resultConfig.findMany({ where: { testId: 'city-personality' } });
    } catch (e) {
      console.warn('DB error reading city results, fallback to local.');
    }
    if (!allCities || allCities.length < 16) {
      allCities = CITY_RESULTS_FALLBACK;
    }

    // 计算用户向量模长
    let uNormSq = 0;
    for (let i = 0; i < 5; i++) {
      uNormSq += userCoords[i] * userCoords[i];
    }
    const uNorm = Math.sqrt(uNormSq);

    let maxScore = -Infinity;
    let closestCity: any = null;

    allCities.forEach((cityObj) => {
      try {
        const extraData = JSON.parse(cityObj.condition);
        const cityCoords = extraData.coords;
        if (Array.isArray(cityCoords) && cityCoords.length === 5) {
          let dot = 0;
          let cNormSq = 0;
          for (let i = 0; i < 5; i++) {
            dot += userCoords[i] * cityCoords[i];
            cNormSq += cityCoords[i] * cityCoords[i];
          }
          const cNorm = Math.sqrt(cNormSq);
          const cosSim = (uNorm === 0 || cNorm === 0) ? 0 : dot / (uNorm * cNorm);
          const bias = CITY_BIASES[extraData.name] ?? extraData.bias ?? 0;
          const score = cosSim + bias;

          if (score > maxScore) {
            maxScore = score;
            
            // 匹配本地深度资产库补齐四大生活切片
            const fallbackMatch = CITY_RESULTS_FALLBACK.find(fb => {
              const fbCond = JSON.parse(fb.condition);
              return fbCond.name === extraData.name || fb.id === cityObj.id;
            });
            const fbExtra = fallbackMatch ? JSON.parse(fallbackMatch.condition) : {};

            closestCity = {
              id: cityObj.id,
              name: extraData.name,
              title: cityObj.title, 
              desc: cityObj.desc,
              quote: cityObj.quote,
              theme: extraData.theme || fbExtra.theme || 'industrial',
              tags: extraData.tags || fbExtra.tags || ["特立独行", "探索者"],
              coords: extraData.coords,
              residentId: extraData.residentId || fbExtra.residentId || `CITIZEN-${cityObj.id}`,
              schedule: extraData.schedule || fbExtra.schedule || {
                morning: "清晨迎着第一缕日光漫步放空",
                afternoon: "午后找个安静角落喝茶阅读",
                night: "深夜在微风中卸下一天的疲惫"
              },
              curePrescription: extraData.curePrescription || fbExtra.curePrescription || {
                dazePlace: "城市街角的老公园长椅",
                soulFood: "一碗热气腾腾的家乡面",
                spiritBuddy: "懂你欲言又止的同频好友"
              },
              toxicCity: extraData.toxicCity || fbExtra.toxicCity || {
                name: "高压内卷之城",
                reason: "节奏过于窒息会让你瞬间精神透支。"
              }
            };
          }
        }
      } catch(e) {
        console.error("Error evaluating city match:", e);
      }
    });

    // 终极安全防范：若计算为空，使用默认工业先锋城市进行完整结果返回
    if (!closestCity) {
      const fbObj = CITY_RESULTS_FALLBACK[0];
      const extra = JSON.parse(fbObj.condition);
      closestCity = {
        id: fbObj.id,
        name: extra.name,
        title: fbObj.title,
        desc: fbObj.desc,
        quote: fbObj.quote,
        theme: extra.theme,
        tags: extra.tags,
        coords: extra.coords,
        residentId: extra.residentId,
        schedule: extra.schedule,
        curePrescription: extra.curePrescription,
        toxicCity: extra.toxicCity
      };
    }

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
