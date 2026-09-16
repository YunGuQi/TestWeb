import { prisma } from '../prisma';
import { questions, results } from '../data';
import { IScoringEngine, CalculateParams, FinalResult } from './engine.interface';

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

// 平滑常模百分位转换：强制保留 1 位小数，底噪平滑托举至 26.5%+ 饱满视觉区间，主导维度冲击 88%+，附加动态防重叠微扰动
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

export class EmoEngine implements IScoringEngine {
  async calculate({ optionIds, testId }: CalculateParams): Promise<FinalResult> {
    let sen = 0, rum = 0, pls = 0, bnd = 0, workScore = 0;
    const billItems: Array<{ name: string; cost: number }> = [];

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
        } catch (e) {}
      });
    } else {
      questions.forEach(q => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            const senScore = opt.senScore || 0;
            const rumScore = opt.rumScore || 0;
            const plsScore = opt.plsScore || 0;
            const bndScore = opt.bndScore || 0;

            sen += senScore; rum += rumScore; 
            pls += plsScore; bnd += bndScore;

            if (['q3', 'q12', 'q18'].includes(q.id)) {
              workScore += (rumScore + senScore);
            }

            const cost = (senScore * 300) + (rumScore * 250) + (plsScore * 280);
            if (opt.billName && cost > 0) {
              billItems.push({ name: opt.billName, cost });
            }
          }
        });
      });
    }

    let totalFriction = (sen * 300) + (rum * 250) + (pls * 280) - (bnd * 100);
    if (totalFriction < 0) totalFriction = 0;

    // 理论最高值归一化换算
    const maxSen = 57, maxRum = 77, maxPls = 44, maxBnd = 80;
    const senPct = (sen / maxSen) * 100;
    const rumPct = (rum / maxRum) * 100;
    const plsPct = (pls / maxPls) * 100;
    const bndPct = (bnd / maxBnd) * 100;

    // Z-Score 相对离差计算 (大盘实测均值与平滑标准差)
    const zSen = (senPct - 52.4) / 9.0;
    const zRum = (rumPct - 42.6) / 8.5;
    const zPls = (plsPct - 34.0) / 10.0;
    const zBnd = (bndPct - 31.8) / 9.0;

    // 正态分布累积常模击败百分位 (强制带 1 位小数，加入维度偏置防重叠)
    const rankSen = toPercentileWithJitter(zSen, 1, sen);
    const rankRum = toPercentileWithJitter(zRum, 2, rum);
    const rankPls = toPercentileWithJitter(zPls, 3, pls);
    const rankBnd = toPercentileWithJitter(zBnd, 4, bnd);

    // 复合潜变量推导第 5 维（回避隔离 Avd）与第 6 维（自我苛责 Blm）
    // Avd: 边界防御主导，反感过度讨好，受高敏/高压驱动产生战术回避
    const zAvd = 0.70 * zBnd - 0.30 * zPls + 0.15 * zSen;
    // Blm: 深度反刍主导，伴随高讨好渴望被认可，但缺乏自我边界保护产生内伤自责
    const zBlm = 0.65 * zRum + 0.30 * zPls - 0.25 * zBnd;

    const rankAvd = toPercentileWithJitter(zAvd, 5, bnd - pls);
    const rankBlm = toPercentileWithJitter(zBlm, 6, rum + pls);

    let resultKey = 'bnd';

    // 梯队 1：终极极端双极拦截（自适应平衡阈值）
    if (totalFriction >= 25000 && bndPct <= 25 && (senPct + rumPct) >= 116) {
      resultKey = 'high'; // 灵魂透支大户 (全线重度内耗且几乎无有效边界)
    } else if (bndPct >= 45 && totalFriction <= 12000) {
      resultKey = 'low'; // 人间铁壁 (高边界且极低摩擦)
    } 
    // 梯队 2 与 3：基于核心主导优势的升华与复合分流 (实现 10 大画像黄金均衡)
    else {
      const wPls = 1.06, wRum = 1.33, wSen = 1.26, wBnd = 1.26;
      const maxZ = Math.max(zPls * wPls, zRum * wRum, zSen * wSen, zBnd * wBnd);

      if (zRum * wRum === maxZ) {
        if (workScore >= 12 && bndPct <= 27) {
          resultKey = 'burnout'; // 工伤级脆皮打工人 (职场高压集中反刍)
        } else if (zBnd <= -0.75) {
          resultKey = 'rum_low_bnd'; // 自我PUA带师 (反刍且自我保护偏低)
        } else {
          resultKey = 'rum'; // 深夜复盘家
        }
      } else if (zSen * wSen === maxZ) {
        if ((zPls >= 0.68 || zRum >= 0.68) && totalFriction >= 23500) {
          resultKey = 'sen_pls'; // 情绪海绵 (高敏同时高讨好/高反刍)
        } else {
          resultKey = 'sen'; // 薛定谔的敏感
        }
      } else if (zPls * wPls === maxZ) {
        if (zSen >= 0.68 && totalFriction >= 23500) {
          resultKey = 'sen_pls'; // 情绪海绵 (讨好同时高敏)
        } else {
          resultKey = 'pls'; // 心软神明降临
        }
      } else {
        if (zBnd >= 0.98 && zPls <= 0.25 && zSen <= 0.25) {
          resultKey = 'isolated'; // 情绪断电绝缘体 (界限分明且低社交卷入)
        } else {
          resultKey = 'bnd'; // 精神守财奴
        }
      }
    }

    // 10 大画像专属高光击败话语体系 (Marketing Psychology 认知重构：正向天赋赋能，彻底杜绝名称类似与负向词汇，全员击败 90+%)
    const EXCLUSIVE_BEAT_MAP: Record<string, { label: string; getBase: () => number }> = {
      rum: {
        label: '多维思维推演深度',
        getBase: () => rankRum
      },
      burnout: {
        label: '极限复杂事务抗荷力',
        getBase: () => Math.max(rankRum, 85.0)
      },
      rum_low_bnd: {
        label: '内核极致进化自省度',
        getBase: () => Math.max(rankRum, 86.0)
      },
      sen: {
        label: '微表情直觉洞察力',
        getBase: () => rankSen
      },
      sen_pls: {
        label: '超感场域共情深度',
        getBase: () => Math.max(rankSen, rankPls)
      },
      pls: {
        label: '利他社交包容能量',
        getBase: () => rankPls
      },
      bnd: {
        label: '自我边界清醒掌控力',
        getBase: () => rankBnd
      },
      isolated: {
        label: '低质社交过滤定力',
        getBase: () => rankBnd
      },
      low: {
        label: '精神绝对防御力',
        getBase: () => Math.max(rankBnd, 90.0)
      },
      high: {
        label: '精神全域超频运转率',
        getBase: () => Math.max(rankSen, rankRum, 88.0)
      }
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
