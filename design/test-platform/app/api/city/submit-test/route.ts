import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { answers, deviceId } = await req.json(); 
    
    // 1. Fetch questions from DB
    const questions = await prisma.question.findMany({
      where: { testId: 'city-personality' },
      orderBy: { order: 'asc' },
      include: { options: true }
    });

    // 2. Calculate coordinates
    let userCoords = [5, 5, 5, 5, 5]; // Default coords for rhythm, env, temp, social, taste
    if (Array.isArray(answers)) {
      answers.forEach((optIndex, qIndex) => {
        const q = questions[qIndex];
        if (q && q.options[optIndex]) {
          try {
            const scoresObj = JSON.parse(q.options[optIndex].scores);
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

    // 3. Find closest city
    const allCities = await prisma.resultConfig.findMany({ where: { testId: 'city-personality' } });
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
              id: extraData.id,
              name: extraData.name,
              title: cityObj.title, 
              desc: cityObj.desc,
              quote: cityObj.quote,
              theme: extraData.theme,
              tags: extraData.tags,
              coords: extraData.coords
            };
          }
        }
      } catch(e) {}
    });

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
