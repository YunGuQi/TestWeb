import { prisma } from '../prisma';
import { loveSpeciesQuestions, loveSpeciesResults } from '../love-species-data';
import { IScoringEngine, CalculateParams, FinalResult } from './engine.interface';

export class LoveSpeciesEngine implements IScoringEngine {
  async calculate({ optionIds, metadata, testId }: CalculateParams): Promise<FinalResult> {
    let A = 0, D = 0, E = 0, H = 0, S = 0, C = 0, I = 0, R = 0;
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
      dbOptions.forEach(opt => {
        try {
          const scores = opt.scores ? (typeof opt.scores === 'string' ? JSON.parse(opt.scores) : opt.scores) : {};
          A += scores.A || 0; D += scores.D || 0; E += scores.E || 0; H += scores.H || 0;
          S += scores.S || 0; C += scores.C || 0; I += scores.I || 0; R += scores.R || 0;
        } catch (e) {}
      });
    } else {
      loveSpeciesQuestions.forEach(q => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id)) {
            if (opt.scores) {
              A += opt.scores.A || 0; D += opt.scores.D || 0; E += opt.scores.E || 0; H += opt.scores.H || 0;
              S += opt.scores.S || 0; C += opt.scores.C || 0; I += opt.scores.I || 0; R += opt.scores.R || 0;
            }
          }
        });
      });
    }

    // 基于题库偏置的正交去偏平滑校准（使16种动物原型均处于4%~8%黄金正态平衡区间）
    // 1. A vs D: 归一化选项频次偏差 (20/21)
    const normA = A * (20 / 21);
    const diffAD = normA - D;

    // 2. E vs H: 消除 A-D 共线性拖累 (alpha1 = 0.22)
    const diffEH = (E - H) - 0.22 * diffAD;

    // 3. S vs C: 消除 A-D 共线性拖累 (alpha2 = 0.30)
    const diffSC = (S - C) - 0.30 * diffAD;

    // 4. I vs R: 消除 S-C 共线性拖累 (alpha3 = 0.15)
    const diffIR = (I - R) - 0.15 * diffSC;

    const d1 = diffAD >= 0 ? 'A' : 'D';
    const d2 = diffEH >= 0 ? 'E' : 'H';
    const d3 = diffSC >= 0 ? 'S' : 'C';
    const d4 = diffIR >= 0 ? 'I' : 'R';
    const userCombo = d1 + d2 + d3 + d4;

    const fallbackRes = loveSpeciesResults.find(r => r.key === userCombo) || loveSpeciesResults[0];

    let resConfig: any = null;
    try {
      resConfig = await prisma.resultConfig.findFirst({
        where: { condition: userCombo, testId }
      });
    } catch (e) {}

    const baseTitle = resConfig?.title || fallbackRes.title;
    const baseDesc = resConfig?.desc || fallbackRes.description;
    const nickname = metadata?.nickname || '你';
    const finalDesc = baseDesc.replace(/{name}/g, nickname);

    // 动态 6 维机能雷达指标与高光自尊流水线
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

    const rawDims = [
      { key: 'boundary', label: '边界感', base: baseBoundary },
      { key: 'expression', label: '表达欲', base: baseExpression },
      { key: 'neuroticism', label: '神经质', base: baseNeuroticism },
      { key: 'focus', label: '关注点', base: baseFocus },
      { key: 'clinginess', label: '粘人度', base: baseClinginess },
      { key: 'wildness', label: '野性值', base: baseWildness },
    ];

    let maxIdx = 0;
    for (let i = 1; i < rawDims.length; i++) {
      if (rawDims[i].base > rawDims[maxIdx].base) {
        maxIdx = i;
      }
    }

    const seed = (A * 7 + D * 13 + E * 17 + H * 19 + S * 23 + C * 29 + I * 31 + R * 37) % 100;
    const highlightScore = parseFloat((91.5 + (seed % 71) * 0.1).toFixed(1)); // 91.5 ~ 98.5

    const chart = rawDims.map((dim, idx) => {
      if (idx === maxIdx) {
        return {
          label: dim.label,
          value: highlightScore,
          isHighlight: true
        };
      } else {
        const delta = (seed * (idx + 1)) % 10 - 5;
        let val = dim.base + delta * 0.3;
        val = Math.max(18.0, Math.min(88.0, val));
        return {
          label: dim.label,
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
      key: fallbackRes.key, // userCombo
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
      rawScores: { A, D, E, H, S, C, I, R, userCombo }
    };
  }
}
