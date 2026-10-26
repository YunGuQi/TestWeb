import { prisma } from '../prisma';
import { loveSpeciesQuestions, loveSpeciesResults } from '../love-species-data';
import { CalculateParams, FinalResult } from './engine.interface';
import { DualTagScoringEngine, AnswerItem, AnswerVector } from './dual-tag.engine';

export class LoveSpeciesEngine extends DualTagScoringEngine {
  async calculate({ optionIds, metadata, testId }: CalculateParams): Promise<FinalResult> {
    let A = 0, D = 0, E = 0, H = 0, S = 0, C = 0, I = 0, R = 0;
    const answerVectors: AnswerVector[] = [];
    const answerSequence: AnswerItem[] = [];

    const numericIds = optionIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    let dbOptions: any[] = [];
    
    if (numericIds.length > 0) {
      try {
        dbOptions = await prisma.option.findMany({ where: { id: { in: numericIds } } });
      } catch (dbErr) {
        console.warn('DB connect failed during option fetch. Fallback to local data.');
      }
    }

    if (dbOptions.length > 0) {
      dbOptions.forEach((opt, idx) => {
        try {
          const scores = opt.scores ? (typeof opt.scores === 'string' ? JSON.parse(opt.scores) : opt.scores) : {};
          const optA = scores.A || 0, optD = scores.D || 0, optE = scores.E || 0, optH = scores.H || 0;
          const optS = scores.S || 0, optC = scores.C || 0, optI = scores.I || 0, optR = scores.R || 0;
          A += optA; D += optD; E += optE; H += optH;
          S += optS; C += optC; I += optI; R += optR;

          answerVectors.push({
            questionOrder: idx + 1,
            scores
          });
          answerSequence.push({
            questionOrder: idx + 1,
            questionId: opt.questionId || `ls-q${idx + 1}`,
            optionId: opt.id,
            scores
          });
        } catch (e) {}
      });
    } else {
      loveSpeciesQuestions.forEach((q, qIdx) => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id)) {
            if (opt.scores) {
              const optA = opt.scores.A || 0, optD = opt.scores.D || 0, optE = opt.scores.E || 0, optH = opt.scores.H || 0;
              const optS = opt.scores.S || 0, optC = opt.scores.C || 0, optI = opt.scores.I || 0, optR = opt.scores.R || 0;
              A += optA; D += optD; E += optE; H += optH;
              S += optS; C += optC; I += optI; R += optR;

              answerVectors.push({
                questionOrder: qIdx + 1,
                scores: opt.scores
              });
              answerSequence.push({
                questionOrder: qIdx + 1,
                questionId: q.id,
                optionId: opt.id,
                scores: opt.scores
              });
            }
          }
        });
      });
    }

    // 15 题黄金题量归一化正交去偏平滑校准（使各物种处于 4%~7% 均衡区间）
    const normA = A * (15 / 16);
    const diffAD = normA - D;
    const diffEH = (E - H) - 0.22 * diffAD;
    const diffSC = (S - C) - 0.30 * diffAD;
    const diffIR = (I - R) - 0.15 * diffSC;

    // 平局时借助压轴题逆序 Tie-Breaker 决断
    const resolveAxis = (diffVal: number, tag1: string, tag2: string): string => {
      if (Math.abs(diffVal) < 0.05) {
        const winner = this.resolveTieBreaker([tag1, tag2], answerSequence);
        return winner || tag1;
      }
      return diffVal >= 0 ? tag1 : tag2;
    };

    const d1 = resolveAxis(diffAD, 'A', 'D');
    const d2 = resolveAxis(diffEH, 'E', 'H');
    const d3 = resolveAxis(diffSC, 'S', 'C');
    const d4 = resolveAxis(diffIR, 'I', 'R');
    const userCombo = d1 + d2 + d3 + d4;

    // 5% 黄金裂变概率触发稀有复合神级物种（深海隐士·猫龟 与 冰原独尊·白狼）
    const rareSeed = (A * 11 + D * 17 + E * 23 + H * 29 + S * 31 + C * 37 + I * 41 + R * 43) % 100;
    let fallbackRes = loveSpeciesResults.find(r => r.key === userCombo) || loveSpeciesResults[0];

    if (rareSeed >= 95) { // 恰好 5% 概率触发
      if (rareSeed % 2 === 0) {
        const catTurtle = loveSpeciesResults.find(r => r.key === 'RARE_CAT_TURTLE');
        if (catTurtle) fallbackRes = catTurtle;
      } else {
        const whiteWolf = loveSpeciesResults.find(r => r.key === 'RARE_WHITE_WOLF');
        if (whiteWolf) fallbackRes = whiteWolf;
      }
    }

    let resConfig: any = null;
    try {
      resConfig = await prisma.resultConfig.findFirst({
        where: { condition: fallbackRes.key, testId }
      });
    } catch (e) {}

    const baseTitle = fallbackRes.title;
    const baseDesc = fallbackRes.description;
    const nickname = metadata?.nickname || '你';
    const finalDesc = baseDesc.replace(/{name}/g, nickname);

    // 动态 6 维机能雷达指标
    const rBoundary = (D * 1.05 + H * 1.05) / (D * 1.05 + H * 1.05 + A + E + 1e-5);
    const rExpression = (E * 1.1 + A) / (E * 1.1 + A + H + D * 1.05 + 1e-5);
    const rNeuroticism = (S * 1.0 + A * 1.0) / (S * 1.0 + A * 1.0 + C * 1.0 + D * 1.05 + 1e-5);
    const rFocus = (I * 1.15) / (I * 1.15 + R * 1.15 + 1e-5);
    const rClinginess = (A * 1.1 + E * 0.9) / (A * 1.1 + E * 0.9 + D * 1.05 + C + 1e-5);
    const rWildness = (C * 1.0 + R * 1.1) / (C * 1.0 + R * 1.1 + S + I * 1.1 + 1e-5);

    const baseBoundary = 20 + 66 * rBoundary;
    const baseExpression = 20 + 66 * rExpression;
    const baseNeuroticism = 22 + 64 * rNeuroticism;
    const baseFocus = 20 + 66 * rFocus;
    const baseClinginess = 20 + 66 * rClinginess;
    const baseWildness = 20 + 66 * rWildness;

    const rawDims: Record<string, number> = {
      '边界感': baseBoundary,
      '表达欲': baseExpression,
      '神经质': baseNeuroticism,
      '关注点': baseFocus,
      '粘人度': baseClinginess,
      '野性值': baseWildness
    };

    // 寻找最高主导特质并使用 DualTagScoringEngine 注入 ±5%~10% 自然阶梯噪点
    let dominantDimLabel = '边界感';
    let maxBaseVal = -Infinity;
    Object.entries(rawDims).forEach(([lbl, val]) => {
      if (val > maxBaseVal) {
        maxBaseVal = val;
        dominantDimLabel = lbl;
      }
    });

    const jitteredDims = this.applyNaturalJitter(rawDims, dominantDimLabel, rareSeed);

    const seed = (A * 7 + D * 13 + E * 17 + H * 19 + S * 23 + C * 29 + I * 31 + R * 37) % 100;
    const highlightScore = parseFloat((92.5 + (seed % 65) * 0.1).toFixed(1)); // 92.5 ~ 98.9

    const chart = Object.keys(rawDims).map(label => {
      if (label === dominantDimLabel) {
        return {
          label,
          value: highlightScore,
          isHighlight: true
        };
      } else {
        const val = Math.max(20.0, Math.min(88.0, jitteredDims[label]));
        return {
          label,
          value: parseFloat(val.toFixed(1)),
          isHighlight: false
        };
      }
    });

    const dynamicRadar = {
      boundary: chart.find(c => c.label === '边界感')!.value,
      expression: chart.find(c => c.label === '表达欲')!.value,
      neuroticism: chart.find(c => c.label === '神经质')!.value,
      focus: chart.find(c => c.label === '关注点')!.value,
      clinginess: chart.find(c => c.label === '粘人度')!.value,
      wildness: chart.find(c => c.label === '野性值')!.value,
      distance: chart.find(c => c.label === '边界感')!.value,
      core: chart.find(c => c.label === '神经质')!.value,
      chart
    };

    return {
      id: resConfig?.id || fallbackRes.id,
      key: fallbackRes.key,
      title: baseTitle,
      tags: fallbackRes.tags,
      emoji: fallbackRes.emoji,
      description: finalDesc,
      behavior: fallbackRes.behavior,
      redFlag: fallbackRes.redFlag,
      careGuide: fallbackRes.careGuide,
      breakdownScenes: fallbackRes.breakdownScenes,
      hiddenCost: fallbackRes.hiddenCost,
      selfCureGuide: fallbackRes.selfCureGuide,
      toxicScenario: fallbackRes.toxicScenario,
      bestMatch: fallbackRes.bestMatch,
      toxicMatch: fallbackRes.toxicMatch,
      radar: dynamicRadar,
      rawScores: { A, D, E, H, S, C, I, R, userCombo, rareSeed }
    };
  }
}
