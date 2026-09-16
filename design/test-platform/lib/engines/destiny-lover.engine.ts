import { prisma } from '../prisma';
import { destinyLoverQuestions, destinyLoverResults, DestinyLoverProfile } from '../destiny-lover-data';
import { IScoringEngine, CalculateParams, FinalResult } from './engine.interface';

export class DestinyLoverEngine implements IScoringEngine {
  async calculate({ optionIds, metadata }: CalculateParams): Promise<FinalResult> {
    let L = 0, G = 0, D = 0, S = 0, A = 0, C = 0, R = 0, P = 0;
    
    // 1. 优先从数据库根据 numericIds 读取已存入的 options.scores
    const numericIds = optionIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    let dbOptions: any[] = [];
    if (numericIds.length > 0) {
      try {
        dbOptions = await prisma.option.findMany({ where: { id: { in: numericIds } } });
      } catch (e) {
        console.warn('DestinyLoverEngine db query fallback', e);
      }
    }

    if (dbOptions.length > 0) {
      dbOptions.forEach(opt => {
        try {
          const scores: any = opt.scores ? (typeof opt.scores === 'string' ? JSON.parse(opt.scores) : opt.scores) : {};
          L += Number(scores.L) || 0;
          G += Number(scores.G) || 0;
          D += Number(scores.D) || 0;
          S += Number(scores.S) || 0;
          A += Number(scores.A) || 0;
          C += Number(scores.C) || 0;
          R += Number(scores.R) || 0;
          P += Number(scores.P) || 0;
        } catch (e) {}
      });
    }

    // 2. 回退兜底：如果数据库未命中（如本地离线仿真传入 "o1_1" 等本地常数ID）
    if (L === 0 && G === 0 && D === 0 && S === 0 && A === 0 && C === 0 && R === 0 && P === 0) {
      destinyLoverQuestions.forEach(q => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            L += opt.scores.L; G += opt.scores.G; D += opt.scores.D; S += opt.scores.S;
            A += opt.scores.A; C += opt.scores.C; R += opt.scores.R; P += opt.scores.P;
          }
        });
      });
    }

    // 计算 4 维二分极性：引领/守护(L/G)、直球/细节(D/S)、冒险/居家(A/C)、浪漫/务实(R/P)
    const dim1 = L >= G ? 'l' : 'g';
    const dim2 = D >= S ? 'd' : 's';
    const dim3 = A >= C ? 'a' : 'c';
    const dim4 = R >= P ? 'r' : 'p';
    const userCombo = dim1 + dim2 + dim3 + dim4; 

    // 基于 4 维特征进行无死锁的最短汉明距离（Hamming Distance）匹配
    let bestMatch: DestinyLoverProfile = destinyLoverResults[0];
    let minDistance = 999;

    for (const res of destinyLoverResults) {
      let dist = 0;
      for (let i = 0; i < 4; i++) {
        if (res.key[i] !== userCombo[i]) {
          dist++;
        }
      }
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = res;
        // 如果汉明距离为 0（即完全吻合目标原型），可直接锁定
        if (minDistance === 0) break;
      }
    }

    const nickname = metadata?.nickname || '你';
    const userStatus = metadata?.status || 'single';
    
    let finalDesc = bestMatch.description.replace(/{name}/g, nickname);
    if (userStatus === 'dating') {
      finalDesc = finalDesc.replace(/你的命定恋人/g, '你现在的另一半(如果是命定的话)');
    }

    // 1. 动态雷达维度精算流水线
    // 掌控力 (Control): 由 L（引领）驱动，基准区间 65% ~ 98%
    const isL = bestMatch.key.includes('l');
    const baseControl = isL ? 67.5 : 65.0;
    let controlVal = baseControl + (L / 5) * 30;

    // 陪伴感 (Companionship): 由 G（守护）与 C（居家）驱动，基准区间 75% ~ 99%
    const isGC = bestMatch.key.includes('g') || bestMatch.key.includes('c');
    const baseCompanion = isGC ? 75.0 : 73.5;
    let companionVal = baseCompanion + ((G + C) / 10) * 25;

    // 惊喜度 (Surprise): 由 D（直球）与 A（冒险）驱动，基准区间 68% ~ 99%
    const isDA = bestMatch.key.includes('d') || bestMatch.key.includes('a');
    const baseSurprise = isDA ? 69.0 : 67.5;
    let surpriseVal = baseSurprise + ((D + A) / 10) * 30;

    // 安全感 (Security): 由 S（细节）与 P（务实）驱动，基准区间 78% ~ 99%
    const isSP = bestMatch.key.includes('s') || bestMatch.key.includes('p');
    const baseSecurity = isSP ? 78.0 : 76.5;
    let securityVal = baseSecurity + ((S + P) / 10) * 22;

    // 2. 伪随机平滑微扰动 ([-0.4%, +0.4%])，确保同一答题路径可复现且具单小数位呼吸感
    const calcJitter = (dimIndex: number) => {
      const hash = (L * 13 + G * 7 + D * 17 + S * 19 + A * 23 + C * 29 + R * 31 + P * 37 + dimIndex * 43) % 100;
      return ((hash - 50) / 100) * 0.8;
    };

    let rawRadar = [
      { label: "陪伴感", value: companionVal + calcJitter(1) },
      { label: "安全感", value: securityVal + calcJitter(2) },
      { label: "惊喜度", value: surpriseVal + calcJitter(3) },
      { label: "掌控力", value: controlVal + calcJitter(4) }
    ];

    // 3. 第一优势特质高光自尊赋能：确保第一高光特质落入 92% ~ 98.8% 高光自尊区间
    let maxIdx = 0;
    let maxVal = rawRadar[0].value;
    for (let i = 1; i < rawRadar.length; i++) {
      if (rawRadar[i].value > maxVal) {
        maxVal = rawRadar[i].value;
        maxIdx = i;
      }
    }

    if (maxVal < 92.0) {
      // 若最高特质不足 92%，适度赋能拉伸至 92.0% ~ 96.5% 自尊击败区间
      const boost = 92.0 + ((maxVal - 70) / 22) * 4.5;
      rawRadar[maxIdx].value = Math.max(rawRadar[maxIdx].value, boost);
    } else if (maxVal > 98.8) {
      rawRadar[maxIdx].value = 98.8;
    }

    // 格式化为单小数位并收敛在安全边界内
    const dynamicRadar = rawRadar.map(item => ({
      label: item.label,
      value: Number(Math.min(98.8, Math.max(65.0, item.value)).toFixed(1))
    }));

    // 4. 灵魂合盘契合度动态精算 (92.0% ~ 98.8%)
    // 由 4 轴极性差距总和（diffSum in [4, 20]）决定契合深浅
    const diffSum = Math.abs(L - G) + Math.abs(D - S) + Math.abs(A - C) + Math.abs(R - P);
    const synergyJitter = calcJitter(9) * 0.5; // [-0.2, +0.2]
    const rawSynergyScore = 92.0 + ((diffSum - 4) / 16) * 6.5 + synergyJitter;
    const dynamicSynergyScore = Number(Math.min(98.8, Math.max(92.0, rawSynergyScore)).toFixed(1));

    const dynamicSynergy = {
      ...bestMatch.synergy,
      score: dynamicSynergyScore
    };

    return {
      id: bestMatch.id,
      key: bestMatch.key,
      title: bestMatch.title,
      subtitle: bestMatch.subtitle,
      tags: bestMatch.tags,
      description: finalDesc,
      quote: bestMatch.quote,
      visualMotif: bestMatch.visualMotif,
      radar: dynamicRadar,
      firstMeet: bestMatch.firstMeet,
      redFlags: bestMatch.redFlags,
      synergy: dynamicSynergy,
      loveAdvice: bestMatch.loveAdvice,
      rawScores: { L, G, D, S, A, C, R, P, userCombo, hammingDistance: minDistance }
    };
  }
}

