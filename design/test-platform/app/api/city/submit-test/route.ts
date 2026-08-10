import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { CITY_QUESTIONS_FALLBACK, CITY_RESULTS_FALLBACK } from '../../../../lib/city-fallback';

export async function POST(req: Request) {
  try {
    const { answers, deviceId } = await req.json(); 
    
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

    // 2. Calculate coordinates
    let userCoords = [5, 5, 5, 5, 5]; // Default coords for rhythm, env, temp, social, taste
    if (Array.isArray(answers)) {
      answers.forEach((optIndex, qIndex) => {
        const q = questions[qIndex];
        if (q && q.options[optIndex]) {
          try {
            const scoresObj = typeof q.options[optIndex].scores === 'string' 
              ? JSON.parse(q.options[optIndex].scores) 
              : q.options[optIndex].scores;
            // The mapping is rhythm, env, temp, social, taste
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

    // 3. 优先从数据库寻找城市结果，若无则本地结果库兜底
    let allCities: any[] = [];
    try {
      allCities = await prisma.resultConfig.findMany({ where: { testId: 'city-personality' } });
    } catch (e) {
      console.warn('DB error reading city results, fallback to local.');
    }
    if (!allCities || allCities.length === 0) {
      allCities = CITY_RESULTS_FALLBACK;
    }

    let minDistance = Infinity;
    let closestCity = null;


    allCities.forEach((cityObj) => {
      try {
        const extraData = JSON.parse(cityObj.condition);
        const cityCoords = extraData.coords;
        if (Array.isArray(cityCoords) && cityCoords.length === 5) {
          let distance = 0;
          for (let i = 0; i < 5; i++) {
            distance += Math.pow(userCoords[i] - cityCoords[i], 2);
          }
          distance = Math.sqrt(distance);
          if (distance < minDistance) {
            minDistance = distance;
            closestCity = {
              id: cityObj.id,
              name: extraData.name,
              title: cityObj.title, 
              desc: cityObj.desc,
              quote: cityObj.quote,
              theme: extraData.theme,
              tags: extraData.tags || ["特立独行", "探索者"],
              coords: extraData.coords
            };
          }
        }
      } catch(e) {}
    });

    // 终极安全防范：若没选或匹配计算为空，使用默认工业先锋城市进行完美静态结果返回
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
        tags: ["效率第一", "不眠城市"],
        coords: extra.coords
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

    return NextResponse.json({
      success: true,
      data: {
        city: closestCity,
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
