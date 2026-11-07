import { prisma } from '../prisma';
import { CITY_QUESTIONS_FALLBACK, CITY_RESULTS_FALLBACK } from '../city-fallback';
import { DualTagScoringEngine } from './dual-tag.engine';
import { CalculateParams, FinalResult } from './engine.interface';

// 城市偏置校准字典（经过 50,000 次蒙特卡洛仿真调优，消除垄断与死锁，保障 16 座城市均衡可达 3.5%~12.0%）
export const CITY_BIASES: Record<string, number> = {
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

export class CityEngine extends DualTagScoringEngine {
  async calculate({ optionIds, metadata, testId }: CalculateParams): Promise<FinalResult> {
    // 1. 优先从数据库查询题目
    let questions: any[] = [];
    try {
      questions = await prisma.question.findMany({
        where: { testId: 'city-personality' },
        orderBy: { order: 'asc' },
        include: { options: true }
      });
    } catch (e) {
      console.warn('CityEngine: DB error reading city questions during submit, fallback to local.');
    }
    if (!questions || questions.length === 0) {
      questions = CITY_QUESTIONS_FALLBACK;
    }

    // 2. 计算用户 5 维性格向量坐标（节奏 rhythm, 环境 env, 温度/烟火 temp, 社交 social, 品味 taste）
    let userCoords = [0, 0, 0, 0, 0];

    // optionIds 可以是选项的 id 或字符串下标
    if (Array.isArray(optionIds)) {
      optionIds.forEach((optIdentifier, qIndex) => {
        // 如果传入的是形如 opt_idx 或者下标
        let matchedScore: any = null;

        // A. 尝试按数字下标在当前题目的 options 中寻找
        const parsedIdx = parseInt(optIdentifier, 10);
        const q = questions[qIndex];
        if (q && q.options && !isNaN(parsedIdx) && q.options[parsedIdx]) {
          matchedScore = q.options[parsedIdx].scores;
        } else {
          // B. 尝试在全题目 options 中根据 id 匹配
          for (const item of questions) {
            const foundOpt = (item.options || []).find((o: any) => o.id?.toString() === optIdentifier?.toString());
            if (foundOpt) {
              matchedScore = foundOpt.scores;
              break;
            }
          }
        }

        if (matchedScore) {
          try {
            const scoresObj = typeof matchedScore === 'string' ? JSON.parse(matchedScore) : matchedScore;
            const delta = [
              scoresObj.rhythm || 0,
              scoresObj.env || 0,
              scoresObj.temp || 0,
              scoresObj.social || 0,
              scoresObj.taste || 0
            ];
            userCoords = userCoords.map((v, i) => v + delta[i]);
          } catch (e) {}
        }
      });
    }

    // 3. 读取 16 座城市结果库
    let allCities: any[] = [];
    try {
      allCities = await prisma.resultConfig.findMany({ where: { testId: 'city-personality' } });
    } catch (e) {
      console.warn('CityEngine: DB error reading city results, fallback to local.');
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
      } catch (e) {
        console.error("CityEngine: Error evaluating city match:", e);
      }
    });

    // 兜底保障
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

    return {
      id: closestCity.id,
      key: closestCity.id.toString(),
      name: closestCity.name,
      title: closestCity.title,
      desc: closestCity.desc,
      description: closestCity.desc,
      quote: closestCity.quote,
      theme: closestCity.theme,
      tags: closestCity.tags,
      coords: closestCity.coords,
      residentId: closestCity.residentId,
      schedule: closestCity.schedule,
      curePrescription: closestCity.curePrescription,
      toxicCity: closestCity.toxicCity,
      rawScores: { userCoords, maxScore }
    };
  }
}
