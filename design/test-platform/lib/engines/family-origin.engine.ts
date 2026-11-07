import { prisma } from '../prisma';
import { familyOriginQuestions, familyOriginResults } from '../family-origin-data';
import { IScoringEngine, CalculateParams, FinalResult } from './engine.interface';

export class FamilyOriginEngine implements IScoringEngine {
  async calculate({ optionIds, metadata, testId }: CalculateParams): Promise<FinalResult> {
    let totalScore = 0;
    let I = 0, B = 0, H = 0;
    
    // 1. 尝试从数据库读取已配置的选项分值
    const numericIds = optionIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    let dbOptions: any[] = [];
    if (numericIds.length > 0) {
      try {
        dbOptions = await prisma.option.findMany({ where: { id: { in: numericIds } } });
      } catch (e) {}
    }

    if (dbOptions.length > 0) {
      dbOptions.forEach(opt => {
        try {
          const scores: any = opt.scores ? (typeof opt.scores === 'string' ? JSON.parse(opt.scores) : opt.scores) : {};
          if (typeof scores.score === 'number') {
            totalScore += scores.score;
          } else if (scores.I !== undefined) {
            // 兼容旧分数格式
            I += Number(scores.I) || 0;
            B += Number(scores.B) || 0;
            H += Number(scores.H) || 0;
          }
        } catch (e) {}
      });
    }

    // 2. 若数据库未配置 score 或总分为 0，从本地题库精准匹配
    if (totalScore === 0) {
      familyOriginQuestions.forEach(q => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            totalScore += opt.scores.score || 0;
            I += opt.scores.I || 0;
            B += opt.scores.B || 0;
            H += opt.scores.H || 0;
          }
        });
      });
    }

    // 3. 兜底保障
    if (totalScore === 0) {
      totalScore = 39; // 中轴健康分
    }

    // 4. 蒙特卡洛 50,000 次校准区间判定 (各占 14%~18.5% 黄金区间)
    // <=34: r1(16.8%), 35~37: r5(18.4%), 38~39: r2(15.4%), 40~41: r3(14.9%), 42~44: r6(18.1%), >=45: r4(16.4%)
    let targetId = 'r4';
    if (totalScore <= 34) {
      targetId = 'r1';
    } else if (totalScore <= 37) {
      targetId = 'r5';
    } else if (totalScore <= 39) {
      targetId = 'r2';
    } else if (totalScore <= 41) {
      targetId = 'r3';
    } else if (totalScore <= 44) {
      targetId = 'r6';
    } else {
      targetId = 'r4';
    }

    const bestMatch = familyOriginResults.find(r => r.id === targetId) || familyOriginResults[0];

    // 5. 专属核心性格指标：严格遵循 B站原案核心性格指标（如：共情 97% · 悦己 85% · 信任感 93%）
    const fixedRadar = (bestMatch.radar || []).map((item: any) => ({
      subject: item.subject,
      A: item.A
    }));

    const nickname = metadata?.nickname || '你';
    const finalDesc = (bestMatch.content || '').replace(/{name}/g, nickname);

    return {
      id: bestMatch.id,
      key: bestMatch.id.toString(),
      title: bestMatch.name,
      name: bestMatch.name,
      acquiredTrait: bestMatch.acquiredTrait,
      subtitle: bestMatch.subtitle,
      attachmentType: bestMatch.attachmentType,
      tags: bestMatch.tags,
      description: finalDesc,
      content: finalDesc,
      childhoodMark: bestMatch.childhoodMark,
      triggers: bestMatch.triggers,
      antidoteList: bestMatch.antidoteList,
      quote: bestMatch.quote,
      radar: fixedRadar,
      rawScores: { totalScore, I, B, H }
    };
  }
}

