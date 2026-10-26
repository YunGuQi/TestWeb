import { prisma } from '../prisma';
import { familyOriginQuestions, familyOriginResults } from '../family-origin-data';
import { CalculateParams, FinalResult } from './engine.interface';
import { DualTagScoringEngine, AnswerItem, AnswerVector } from './dual-tag.engine';

export class FamilyOriginEngine extends DualTagScoringEngine {
  async calculate({ optionIds, metadata, testId }: CalculateParams): Promise<FinalResult> {
    let totalScore = 0;
    let I = 0, B = 0, H = 0;
    const answerVectors: AnswerVector[] = [];
    const answerSequence: AnswerItem[] = [];
    
    // 1. 尝试从数据库读取已配置的选项分值
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
          const scores: any = opt.scores ? (typeof opt.scores === 'string' ? JSON.parse(opt.scores) : opt.scores) : {};
          if (typeof scores.score === 'number') {
            totalScore += scores.score;
          }
          I += Number(scores.I) || 0;
          B += Number(scores.B) || 0;
          H += Number(scores.H) || 0;

          const pTag = scores.primaryTag || '';
          const sTag = scores.secondaryTag || '';
          answerVectors.push({
            questionOrder: idx + 1,
            primaryTag: pTag,
            secondaryTag: sTag,
            scores
          });
          answerSequence.push({
            questionOrder: idx + 1,
            questionId: opt.questionId || `q${idx + 1}`,
            optionId: opt.id,
            primaryTag: pTag,
            secondaryTag: sTag,
            scores
          });
        } catch (e) {}
      });
    }

    // 2. 本地题库精准匹配兜底
    if (totalScore === 0) {
      familyOriginQuestions.forEach((q, qIdx) => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            totalScore += opt.scores.score || 0;
            I += opt.scores.I || 0;
            B += opt.scores.B || 0;
            H += opt.scores.H || 0;

            const pTag = opt.primaryTag || '';
            const sTag = opt.secondaryTag || '';
            answerVectors.push({
              questionOrder: qIdx + 1,
              primaryTag: pTag,
              secondaryTag: sTag,
              scores: opt.scores
            });
            answerSequence.push({
              questionOrder: qIdx + 1,
              questionId: q.id,
              optionId: opt.id,
              primaryTag: pTag,
              secondaryTag: sTag,
              scores: opt.scores
            });
          }
        });
      });
    }

    if (totalScore === 0) {
      totalScore = 32; // 中轴健康分
    }

    // 3. 计算双标签防御机制矢量权重（SEC 安全, RES 理性, CMP 补偿/追求完美, ANX 焦虑防御, AVD 回避隔离, IND 独立自渡）
    const vectorRes = this.calculateDualTagScores(answerVectors);
    let dominantMechanism = vectorRes.dominantTag;

    // 若存在并列主标签，使用压轴题 Q15 -> Q14 -> Q13... 逆序平局仲裁
    if (vectorRes.tiedTags.length > 1) {
      dominantMechanism = this.resolveTieBreaker(vectorRes.tiedTags, answerSequence);
    }

    // 4. 复合人设判定：结合总分层级与核心主导防御机制
    let targetId = 'r1';

    // 梯队 1：高安全型与阳光剧本 (总分 <= 24 或 SEC 主导)
    if (totalScore <= 22 || (totalScore <= 26 && dominantMechanism === 'SEC')) {
      targetId = 'r1'; // 内核超稳的满级大女主
    } else if (dominantMechanism === 'EXP' || dominantMechanism === 'EXP_RES') {
      targetId = 'r14'; // 温润自洽的灵魂疗愈师
    }
    // 梯队 2：担当、秩序与进取 (总分 23~33)
    else if (totalScore <= 32) {
      if (dominantMechanism === 'RES') {
        targetId = 'r7'; // 秩序井然的理性掌舵人
      } else if (dominantMechanism === 'CMP') {
        targetId = 'r13'; // 破壁突围的跨界破局客
      } else if (dominantMechanism === 'IND') {
        targetId = 'r8'; // 无畏破壁的旷野拓荒者
      } else {
        targetId = 'r5'; // 气场全开的六边形女王
      }
    }
    // 梯队 3：傲骨黑莲花、清冷结界与觉醒探索 (总分 33~43)
    else if (totalScore <= 42) {
      if (dominantMechanism === 'AVD') {
        targetId = 'r3'; // 清冷清醒的结界女王
      } else if (dominantMechanism === 'ANX') {
        targetId = 'r2'; // 带刺盛开的傲骨黑莲花
      } else if (dominantMechanism === 'IND') {
        targetId = 'r12'; // 傲立风雪的苍原独行者
      } else if (dominantMechanism === 'RES') {
        targetId = 'r11'; // 深思自省的觉醒先锋
      } else {
        targetId = 'r9'; // 重构心境的情绪炼金士
      }
    }
    // 梯队 4：破茧涅槃与暗夜蔷薇 (总分 >= 43)
    else {
      if (dominantMechanism === 'IND' || totalScore >= 52) {
        targetId = 'r4'; // 优雅自渡的暗夜蔷薇
      } else if (dominantMechanism === 'ANX') {
        targetId = 'r15'; // 涅槃自救的浴火凤凰
      } else if (dominantMechanism === 'AVD') {
        targetId = 'r16'; // 深邃沉静的幕后大格局家
      } else if (dominantMechanism === 'SEC' || dominantMechanism === 'RES') {
        targetId = 'r10'; // 独善其身的自在隐士
      } else {
        targetId = 'r6'; // 不被驯化的破茧大女主
      }
    }

    const bestMatch = familyOriginResults.find(r => r.id === targetId) || familyOriginResults[0];

    // 5. 注入 ±5%~10% 自然阶梯微扰动 (保留 1 位小数)，确保雷达图具备高光且不呆板
    const rawRadarMap: Record<string, number> = {};
    (bestMatch.radar || []).forEach(item => {
      rawRadarMap[item.subject] = item.A;
    });

    const dominantSubject = (bestMatch.radar || [])[0]?.subject || '共情';
    const jitteredScores = this.applyNaturalJitter(rawRadarMap, dominantSubject, totalScore);

    const fixedRadar = (bestMatch.radar || []).map(item => ({
      subject: item.subject,
      A: jitteredScores[item.subject] !== undefined ? jitteredScores[item.subject] : item.A
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
      rawScores: { totalScore, I, B, H, dominantMechanism, vectorScores: vectorRes.tagScores }
    };
  }
}
