/**
 * 小红书老罗爆款测试标准计分与仲裁引擎
 * (Dual-Tag Vector Scoring & Tie-Breaking Engine)
 */

export interface Option {
  label: string;
  text: string;
  tags: [string, string]; // [主标签, 副标签]
}

export interface Question {
  id: number;
  title: string;
  options: Option[];
}

export interface ScoreOutput {
  scores: Record<string, number>;
  percentages: Record<string, number>;
  primary: string;
  secondary?: string;
  isCompound: boolean;
}

/**
 * 计算用户的测试结果
 * @param userAnswers 用户选择答案映射，如 { 0: 'A', 1: 'C', ... }
 * @param questions 题目数组
 * @param allDimensions 所有参与排名的维度列表
 * @param tieBreakerQuestionIndices 仲裁决胜题索引列表，默认 [14, 13, 9] (第15, 14, 10题)
 */
export function calculateTestResult(
  userAnswers: Record<number, string>,
  questions: Question[],
  allDimensions: string[],
  tieBreakerQuestionIndices: number[] = [14, 13, 9]
): ScoreOutput {
  const rawScores: Record<string, number> = {};
  allDimensions.forEach(dim => (rawScores[dim] = 0));

  // 1. 遍历答案，实施双标签非对称加权 (主+2 / 副+1)
  questions.forEach((q, idx) => {
    const selectedLabel = userAnswers[idx];
    if (!selectedLabel) return;

    const opt = q.options.find(o => o.label === selectedLabel);
    if (opt && opt.tags && opt.tags.length >= 2) {
      const [primaryTag, secondaryTag] = opt.tags;
      if (rawScores[primaryTag] !== undefined) rawScores[primaryTag] += 2;
      if (rawScores[secondaryTag] !== undefined) rawScores[secondaryTag] += 1;
    }
  });

  // 2. 判定最高得分与平局
  const maxScore = Math.max(...Object.values(rawScores));
  const topDims = allDimensions.filter(dim => rawScores[dim] === maxScore && maxScore > 0);

  let primaryDim = topDims[0] || allDimensions[0];
  let secondaryDim: string | undefined = undefined;
  let isCompound = false;

  // 3. 平局决胜仲裁 (Tie-Breaker)
  if (topDims.length >= 2) {
    isCompound = true;
    for (const qIndex of tieBreakerQuestionIndices) {
      const selected = userAnswers[qIndex];
      if (!selected) continue;

      const opt = questions[qIndex]?.options.find(o => o.label === selected);
      if (opt) {
        if (topDims.includes(opt.tags[0])) {
          primaryDim = opt.tags[0];
          secondaryDim = topDims.find(d => d !== primaryDim);
          break;
        }
        if (topDims.includes(opt.tags[1])) {
          primaryDim = opt.tags[1];
          secondaryDim = topDims.find(d => d !== primaryDim);
          break;
        }
      }
    }
    secondaryDim = secondaryDim || topDims.find(d => d !== primaryDim);
  }

  // 4. 百分比离散归一化与防雷同自然扰动
  const percentages: Record<string, number> = {};
  percentages[primaryDim] = 100;

  allDimensions.forEach(dim => {
    if (dim !== primaryDim) {
      const basePercent = maxScore > 0 ? (rawScores[dim] / maxScore) * 100 : 0;
      const noise = (Math.floor(Math.random() * 3) - 1) * 5; // -5, 0, +5
      const finalPercent = Math.min(95, Math.max(10, Math.round(basePercent / 5) * 5 + noise));
      percentages[dim] = finalPercent;
    }
  });

  return {
    scores: rawScores,
    percentages,
    primary: primaryDim,
    secondary: secondaryDim,
    isCompound
  };
}
