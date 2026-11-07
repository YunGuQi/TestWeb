import { prisma } from '../prisma';
import { questions, results } from '../data';
import { CalculateParams, FinalResult } from './engine.interface';
import { DualTagScoringEngine, AnswerItem } from './dual-tag.engine';

// 统计学标准正态累积分布函数（高斯误差函数多项式逼近）
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function normCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// 平滑常模百分位转换：强制保留 1 位小数，底噪平滑托举至 28%+ 饱满视觉区间，主导维度冲击 88%+，附加动态防重叠微扰动
function toPercentileWithJitter(z: number, dimensionOffset: number = 0, rawScore: number = 0): number {
  const rawPct = normCDF(z) * 100;
  
  // 采用单调递增平滑增强曲线：底噪提升至 28%~35%，中位收敛至 58%~72%，高位冲刺 88%~99.2%
  const t = rawPct / 100;
  const enhancedPct = 28.0 + (t * 43.5) + (t * t * 26.8);

  // 加上基于维度特异性与原始分数的微弱动态扰动 (±0.2%~0.6%)
  const jitter = (((dimensionOffset * 37 + (Math.abs(rawScore) % 11) * 7 + 13) % 19) / 19 - 0.5) * 0.9;
  const result = Math.max(26.5, Math.min(99.2, enhancedPct + jitter));
  return parseFloat(result.toFixed(1));
}

export class EmoEngine extends DualTagScoringEngine {
  async calculate({ optionIds, testId }: CalculateParams): Promise<FinalResult> {
    let sen = 0, rum = 0, pls = 0, bnd = 0, workScore = 0;
    const billItems: Array<{ name: string; cost: number }> = [];
    const answerSequence: AnswerItem[] = [];

    const numericIds = optionIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    let dbOptions: any[] = [];
    if (numericIds.length > 0) {
      try {
        dbOptions = await prisma.option.findMany({ where: { id: { in: numericIds } } });
      } catch (e) {}
    }

    if (dbOptions.length > 0) {
      dbOptions.forEach((opt, idx) => {
        try {
          const scores = JSON.parse(opt.scores || '{}');
          const senScore = scores.sen || 0;
          const rumScore = scores.rum || 0;
          const plsScore = scores.pls || 0;
          const bndScore = scores.bnd || 0;

          sen += senScore; rum += rumScore; pls += plsScore; bnd += bndScore;

          const cost = (senScore * 300) + (rumScore * 250) + (plsScore * 280);
          if (scores.billName && cost > 0) {
            billItems.push({ name: scores.billName, cost });
          }

          answerSequence.push({
            questionOrder: idx + 1,
            questionId: opt.questionId || `q${idx + 1}`,
            optionId: opt.id,
            scores: { sen: senScore, rum: rumScore, pls: plsScore, bnd: bndScore }
          });
        } catch (e) {}
      });
    } else {
      questions.forEach((q, qIdx) => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            const senScore = opt.senScore || 0;
            const rumScore = opt.rumScore || 0;
            const plsScore = opt.plsScore || 0;
            const bndScore = opt.bndScore || 0;

            sen += senScore; rum += rumScore; 
            pls += plsScore; bnd += bndScore;

            if (['q3', 'q12'].includes(q.id)) {
              workScore += (rumScore + senScore);
            }

            const cost = (senScore * 300) + (rumScore * 250) + (plsScore * 280);
            if (opt.billName && cost > 0) {
              billItems.push({ name: opt.billName, cost });
            }

            answerSequence.push({
              questionOrder: qIdx + 1,
              questionId: q.id,
              optionId: opt.id,
              scores: { sen: senScore, rum: rumScore, pls: plsScore, bnd: bndScore }
            });
          }
        });
      });
    }

    let totalFriction = (sen * 300) + (rum * 250) + (pls * 280) - (bnd * 100);
    if (totalFriction < 0) totalFriction = 0;

    // 15 题黄金题量归一化理论最高值
    const maxSen = 42, maxRum = 58, maxPls = 34, maxBnd = 60;
    const senPct = (sen / maxSen) * 100;
    const rumPct = (rum / maxRum) * 100;
    const plsPct = (pls / maxPls) * 100;
    const bndPct = (bnd / maxBnd) * 100;

    // Z-Score 相对离差计算
    const zSen = (senPct - 52.4) / 9.0;
    const zRum = (rumPct - 42.6) / 8.5;
    const zPls = (plsPct - 34.0) / 10.0;
    const zBnd = (bndPct - 31.8) / 9.0;

    // 正态分布累积常模百分位
    const rankSen = toPercentileWithJitter(zSen, 1, sen);
    const rankRum = toPercentileWithJitter(zRum, 2, rum);
    const rankPls = toPercentileWithJitter(zPls, 3, pls);
    const rankBnd = toPercentileWithJitter(zBnd, 4, bnd);

    // 复合潜变量推导
    const zAvd = 0.70 * zBnd - 0.30 * zPls + 0.15 * zSen;
    const zBlm = 0.65 * zRum + 0.30 * zPls - 0.25 * zBnd;

    const rankAvd = toPercentileWithJitter(zAvd, 5, bnd - pls);
    const rankBlm = toPercentileWithJitter(zBlm, 6, rum + pls);

    let resultKey = 'bnd';

    // 梯队 1：终极极端双极拦截
    if (totalFriction >= 23000 && bndPct <= 28 && (senPct + rumPct) >= 110) {
      resultKey = 'high'; // 灵魂透支大户
    } else if (bndPct >= 42 && totalFriction <= 12500) {
      resultKey = 'low'; // 人间铁壁
    } 
    // 梯队 2 与 3：基于核心主导优势升华与 16 个人设细化
    else {
      const wPls = 1.06, wRum = 1.33, wSen = 1.26, wBnd = 1.26;
      const scoresMap: Record<string, number> = {
        pls: zPls * wPls,
        rum: zRum * wRum,
        sen: zSen * wSen,
        bnd: zBnd * wBnd
      };

      const maxVal = Math.max(...Object.values(scoresMap));
      const tied = Object.keys(scoresMap).filter(k => Math.abs(scoresMap[k] - maxVal) < 0.05);

      // 若发生并列，激活第 15, 14, 13 题压轴逆序 Tie-Breaker 决断
      const dominantDimension = tied.length > 1
        ? this.resolveTieBreaker(tied, answerSequence)
        : tied[0];

      if (dominantDimension === 'rum') {
        if (workScore >= 10 && bndPct <= 28) {
          resultKey = 'burnout'; // 工伤级脆皮打工人
        } else if (zBnd <= -0.75) {
          resultKey = 'rum_low_bnd'; // 自我PUA带师
        } else if (zSen >= 0.70) {
          resultKey = 'overthinker_radar'; // 脑内风暴推演家
        } else if (bndPct >= 35) {
          resultKey = 'invisible_gladiator'; // 隐形决斗者
        } else {
          resultKey = 'rum'; // 深夜复盘家
        }
      } else if (dominantDimension === 'sen') {
        if (zPls >= 0.65 && totalFriction >= 21000) {
          resultKey = 'sen_pls'; // 情绪海绵
        } else if (zBnd <= -0.5) {
          resultKey = 'silent_absorber'; // 静默情绪滤网
        } else if (totalFriction >= 22000) {
          resultKey = 'perfectionist_freeze'; // 僵死型完美主义
        } else {
          resultKey = 'sen'; // 薛定谔的敏感
        }
      } else if (dominantDimension === 'pls') {
        if (zSen >= 0.65 && totalFriction >= 21000) {
          resultKey = 'sen_pls'; // 情绪海绵
        } else if (zBnd >= 0.5) {
          resultKey = 'social_chameleon'; // 高情商变色龙
        } else {
          resultKey = 'pls'; // 心软神明降临
        }
      } else {
        if (zBnd >= 0.98 && zPls <= 0.25 && zSen <= 0.25) {
          resultKey = 'isolated'; // 情绪断电绝缘体
        } else if (zRum >= 0.5 && zSen >= 0.5) {
          resultKey = 'chaos_navigator'; // 混沌破局者
        } else {
          resultKey = 'bnd'; // 精神守财奴
        }
      }
    }

    // 16 大画像专属高光击败话语体系
    const EXCLUSIVE_BEAT_MAP: Record<string, { label: string; getBase: () => number }> = {
      rum: { label: '多维思维推演深度', getBase: () => rankRum },
      burnout: { label: '极限复杂事务抗荷力', getBase: () => Math.max(rankRum, 85.0) },
      rum_low_bnd: { label: '内核极致进化自省度', getBase: () => Math.max(rankRum, 86.0) },
      sen: { label: '微表情直觉洞察力', getBase: () => rankSen },
      sen_pls: { label: '超感场域共情深度', getBase: () => Math.max(rankSen, rankPls) },
      pls: { label: '利他社交包容能量', getBase: () => rankPls },
      bnd: { label: '自我边界清醒掌控力', getBase: () => rankBnd },
      isolated: { label: '低质社交过滤定力', getBase: () => rankBnd },
      low: { label: '精神绝对防御力', getBase: () => Math.max(rankBnd, 90.0) },
      high: { label: '精神全域超频运转率', getBase: () => Math.max(rankSen, rankRum, 88.0) },
      perfectionist_freeze: { label: '精密秩序掌控度', getBase: () => Math.max(rankRum, 87.5) },
      social_chameleon: { label: '场域自适应柔韧度', getBase: () => Math.max(rankPls, 89.0) },
      invisible_gladiator: { label: '内在韧性爆发力', getBase: () => Math.max(rankBnd, 88.5) },
      overthinker_radar: { label: '高阶复杂场景推演力', getBase: () => Math.max(rankSen, rankRum, 89.5) },
      silent_absorber: { label: '深度精神承载量', getBase: () => Math.max(rankPls, 87.0) },
      chaos_navigator: { label: '突发逆境破局敏锐度', getBase: () => Math.max(rankBnd, 91.0) }
    };

    const beatConfig = EXCLUSIVE_BEAT_MAP[resultKey] || { label: '内核天赋掌控力', getBase: () => 88.0 };
    const baseVal = beatConfig.getBase();
    // 映射并稳定收敛在 [91.2%, 99.4%] 的高光击败区间
    const mappedRank = 91.0 + (Math.min(99.2, Math.max(50.0, baseVal)) - 50.0) * (8.2 / 49.2);
    const jitter = (((totalFriction * 19 + 7) % 13) / 13 - 0.5) * 0.7;
    const overallRank = parseFloat(Math.max(90.5, Math.min(99.4, mappedRank + jitter)).toFixed(1));
    const overallText = `${beatConfig.label}击败 ${overallRank}% 脆皮人类`;

    const fallbackRes = results.find(r => r.key === resultKey) || results[0];
    let resConfig = null;
    try {
      resConfig = await prisma.resultConfig.findFirst({ where: { condition: resultKey, testId } });
    } catch (e) {}

    return {
      id: resConfig?.id || fallbackRes.id || 1,
      key: resultKey,
      title: resConfig?.title || fallbackRes.title,
      tags: fallbackRes.tags || '#钝感力王者,#反PUA大师',
      description: resConfig?.desc || fallbackRes.description,
      quote: resConfig?.quote || fallbackRes.quote,
      scenarios: fallbackRes.scenarios || [],
      vampires: fallbackRes.vampires || '',
      bestMatch: (fallbackRes as any).bestMatch || '',
      hiddenCosts: fallbackRes.hiddenCosts || [],
      adviceList: fallbackRes.adviceList || [],
      danmaku: fallbackRes.danmaku || [],
      sen,
      rum,
      pls,
      bnd,
      senPct: Math.round(senPct),
      rumPct: Math.round(rumPct),
      plsPct: Math.round(plsPct),
      bndPct: Math.round(bndPct),
      rankSen,
      rankRum,
      rankPls,
      rankBnd,
      rankAvd,
      rankBlm,
      overallRank,
      overallText,
      totalFriction,
      maxScore: 100,
      billItems
    };
  }
}
