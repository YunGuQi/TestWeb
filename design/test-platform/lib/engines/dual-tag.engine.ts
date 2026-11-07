import { IScoringEngine, CalculateParams, FinalResult } from './engine.interface';

export interface AnswerVector {
  questionId?: string | number;
  questionOrder?: number;
  primaryTag?: string;
  secondaryTag?: string;
  scores?: Record<string, number>;
  rawOptionId?: string | number;
}

export interface AnswerItem {
  questionOrder: number;
  questionId: string | number;
  optionId: string | number;
  primaryTag?: string;
  secondaryTag?: string;
  scores?: Record<string, number>;
}

export interface VectorResult {
  tagScores: Record<string, number>;
  dominantTag: string;
  tiedTags: string[];
  resolvedByTieBreaker: boolean;
}

/**
 * 通用双标签矢量计分与平局仲裁引擎基类
 * 规范遵循：xhs-ll-quiz-engine (主标签+2 / 副标签+1 / 压轴逆序Q15->Q14->Q13仲裁 / 自然阶梯微扰)
 */
export abstract class DualTagScoringEngine implements IScoringEngine {
  abstract calculate(params: CalculateParams): Promise<FinalResult>;

  /**
   * 计算双标签矢量总分 (主标签 +2 / 副标签 +1，同时兼容 scores 字典累加)
   */
  public calculateDualTagScores(answers: AnswerVector[]): VectorResult {
    const tagScores: Record<string, number> = {};

    answers.forEach(ans => {
      // 1. 主副标签权重分配
      if (ans.primaryTag) {
        tagScores[ans.primaryTag] = (tagScores[ans.primaryTag] || 0) + 2;
      }
      if (ans.secondaryTag) {
        tagScores[ans.secondaryTag] = (tagScores[ans.secondaryTag] || 0) + 1;
      }

      // 2. 兼容自定义数值 scores 字典
      if (ans.scores && typeof ans.scores === 'object') {
        Object.entries(ans.scores).forEach(([k, v]) => {
          if (typeof v === 'number' && !isNaN(v)) {
            tagScores[k] = (tagScores[k] || 0) + v;
          }
        });
      }
    });

    // 寻找最高分标签与平局情况
    let maxScore = -Infinity;
    let candidates: string[] = [];

    Object.entries(tagScores).forEach(([tag, score]) => {
      if (score > maxScore) {
        maxScore = score;
        candidates = [tag];
      } else if (score === maxScore) {
        candidates.push(tag);
      }
    });

    if (candidates.length === 0) {
      return {
        tagScores,
        dominantTag: '',
        tiedTags: [],
        resolvedByTieBreaker: false
      };
    }

    if (candidates.length === 1) {
      return {
        tagScores,
        dominantTag: candidates[0],
        tiedTags: [],
        resolvedByTieBreaker: false
      };
    }

    // 存在并列最高分，记录并列项
    return {
      tagScores,
      dominantTag: candidates[0],
      tiedTags: candidates,
      resolvedByTieBreaker: false
    };
  }

  /**
   * 压轴题逆序平局仲裁 (Tie-Breaker)：
   * 从 Q15 -> Q14 -> Q13... 逆序遍历用户作答，若题目选项命中了平局候选中的 tag，则优先裁决该 tag 胜出。
   */
  public resolveTieBreaker(tiedTags: string[], answerSequence: AnswerItem[]): string {
    if (!tiedTags || tiedTags.length === 0) return '';
    if (tiedTags.length === 1) return tiedTags[0];
    if (!answerSequence || answerSequence.length === 0) return tiedTags[0];

    // 按 questionOrder 降序排序（如 15, 14, 13...）
    const sortedAnswers = [...answerSequence].sort((a, b) => (b.questionOrder || 0) - (a.questionOrder || 0));

    for (const ans of sortedAnswers) {
      // 1. 优先检查主标签
      if (ans.primaryTag && tiedTags.includes(ans.primaryTag)) {
        return ans.primaryTag;
      }
      // 2. 检查副标签
      if (ans.secondaryTag && tiedTags.includes(ans.secondaryTag)) {
        return ans.secondaryTag;
      }
      // 3. 检查 scores 中得分最高的平局候选标签
      if (ans.scores) {
        let maxSubScore = -Infinity;
        let bestSubTag = '';
        tiedTags.forEach(t => {
          const val = ans.scores?.[t] || 0;
          if (val > maxSubScore && val > 0) {
            maxSubScore = val;
            bestSubTag = t;
          }
        });
        if (bestSubTag) {
          return bestSubTag;
        }
      }
    }

    // 默认兜底返回第一个候选标签
    return tiedTags[0];
  }

  /**
   * 注入自然阶梯噪点 (±5%~10% 微扰动)：
   * 主导维度保持 100% 原始权重，非主导次级维度叠加微扰动并保留 1 位小数，
   * 彻底避免千人一面或极端整百重复。
   */
  public applyNaturalJitter(
    scores: Record<string, number>,
    dominantKey: string,
    seedOffset: number = 0
  ): Record<string, number> {
    const result: Record<string, number> = {};
    const keys = Object.keys(scores);

    keys.forEach((k, idx) => {
      const original = scores[k];
      if (k === dominantKey) {
        // 主导维度保持 100% 真实权重，仅在必要时格式化为 1 位小数
        result[k] = parseFloat(original.toFixed(1));
      } else {
        // 生成确定性伪随机扰动因子 [-0.08, +0.08] (约 ±5%~8%)
        const pseudoRandom = Math.sin((idx + 1) * 12.9898 + (seedOffset + 7) * 78.233) * 43758.5453;
        const normalized = (pseudoRandom - Math.floor(pseudoRandom)) * 2 - 1; // [-1, 1]
        const jitterRate = normalized * 0.08; // [-0.08, +0.08]
        const jittered = original * (1 + jitterRate);
        result[k] = parseFloat(Math.max(0, jittered).toFixed(1));
      }
    });

    return result;
  }
}
