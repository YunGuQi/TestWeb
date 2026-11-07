import { familyOriginQuestions, familyOriginResults } from '../lib/family-origin-data';
import { FamilyOriginEngine } from '../lib/engines/family-origin.engine';

const engine = new FamilyOriginEngine();

async function testRadar() {
  console.log('=== 测试雷达百分比计算 ===');

  // Case 1: 极端低分 (全选最低分选项)
  const lowOptionIds: string[] = [];
  familyOriginQuestions.forEach(q => {
    let minOpt = q.options[0];
    let minScore = minOpt.scores.I + minOpt.scores.B + minOpt.scores.H;
    q.options.forEach(opt => {
      const s = opt.scores.I + opt.scores.B + opt.scores.H;
      if (s < minScore) { minScore = s; minOpt = opt; }
    });
    lowOptionIds.push(minOpt.id);
  });

  const resLow = await engine.calculate({ optionIds: lowOptionIds, testId: 'family-origin' });
  console.log('\n--- 极端低分答卷 ---');
  console.log(`命中画像: [${resLow.id}] ${resLow.title}`);
  console.log('原始得分:', resLow.rawScores);
  console.log('雷达百分比:', resLow.radar);

  // Case 2: 极端高分 (全选最高分选项)
  const highOptionIds: string[] = [];
  familyOriginQuestions.forEach(q => {
    let maxOpt = q.options[0];
    let maxScore = maxOpt.scores.I + maxOpt.scores.B + maxOpt.scores.H;
    q.options.forEach(opt => {
      const s = opt.scores.I + opt.scores.B + opt.scores.H;
      if (s > maxScore) { maxScore = s; maxOpt = opt; }
    });
    highOptionIds.push(maxOpt.id);
  });

  const resHigh = await engine.calculate({ optionIds: highOptionIds, testId: 'family-origin' });
  console.log('\n--- 极端高分答卷 ---');
  console.log(`命中画像: [${resHigh.id}] ${resHigh.title}`);
  console.log('原始得分:', resHigh.rawScores);
  console.log('雷达百分比:', resHigh.radar);

  // Case 3: 中位数均值答卷
  const midScores = { I: 45, B: 45, H: 43 };
  console.log('\n--- 中位数得分雷达比较 (I=45, B=45, H=43) ---');
  for (const r of familyOriginResults) {
    const dyn = (r.radar || []).map((item, idx) => {
      let delta = 0;
      if (idx === 0) delta = Math.round(((midScores.I - 35) / 35) * 5);
      else if (idx === 1) delta = Math.round(((midScores.B - 35) / 35) * 5);
      else delta = Math.round(((midScores.H - 35) / 35) * 5);
      return {
        subject: item.subject,
        baseA: item.A,
        computedA: Math.min(99, Math.max(68, item.A + delta))
      };
    });
    console.log(`[${r.id}] ${r.name}:`, dyn);
  }
}

testRadar();
