import { familyOriginQuestions, familyOriginResults } from '../lib/family-origin-data';

// 1. 统计题目与分值特征
console.log('=== 题库维度与分值统计 ===');
console.log(`题目总数: ${familyOriginQuestions.length}`);

let totalMin = { I: 0, B: 0, H: 0 };
let totalMax = { I: 0, B: 0, H: 0 };
let totalSum = { I: 0, B: 0, H: 0 };
let optionCountTotal = 0;

familyOriginQuestions.forEach((q, idx) => {
  let minI = Infinity, maxI = -Infinity;
  let minB = Infinity, maxB = -Infinity;
  let minH = Infinity, maxH = -Infinity;
  
  q.options.forEach(opt => {
    minI = Math.min(minI, opt.scores.I);
    maxI = Math.max(maxI, opt.scores.I);
    minB = Math.min(minB, opt.scores.B);
    maxB = Math.max(maxB, opt.scores.B);
    minH = Math.min(minH, opt.scores.H);
    maxH = Math.max(maxH, opt.scores.H);
    totalSum.I += opt.scores.I;
    totalSum.B += opt.scores.B;
    totalSum.H += opt.scores.H;
    optionCountTotal++;
  });
  
  totalMin.I += minI;
  totalMax.I += maxI;
  totalMin.B += minB;
  totalMax.B += maxB;
  totalMin.H += minH;
  totalMax.H += maxH;
});

console.log(`总选项数: ${optionCountTotal}`);
console.log(`理论最低分: I=${totalMin.I}, B=${totalMin.B}, H=${totalMin.H}`);
console.log(`理论最高分: I=${totalMax.I}, B=${totalMax.B}, H=${totalMax.H}`);
console.log(`平均选项分值: I=${(totalSum.I/optionCountTotal).toFixed(2)}, B=${(totalSum.B/optionCountTotal).toFixed(2)}, H=${(totalSum.H/optionCountTotal).toFixed(2)}`);

// 2. 蒙特卡洛模拟：均匀随机作答 100,000 次
console.log('\n=== 100,000 次均匀随机作答模拟 ===');
const N = 100000;
const hitCounts: Record<string, number> = {};
familyOriginResults.forEach(r => { hitCounts[r.id] = 0; });

let sampleScores: { I: number[], B: number[], H: number[] } = { I: [], B: [], H: [] };

for (let i = 0; i < N; i++) {
  let I = 0, B = 0, H = 0;
  familyOriginQuestions.forEach(q => {
    const rIdx = Math.floor(Math.random() * q.options.length);
    const opt = q.options[rIdx];
    I += opt.scores.I;
    B += opt.scores.B;
    H += opt.scores.H;
  });

  if (i < 1000) {
    sampleScores.I.push(I);
    sampleScores.B.push(B);
    sampleScores.H.push(H);
  }

  const scores = { I, B, H };
  const matched = familyOriginResults.find(r => r.condition(scores)) || familyOriginResults[0];
  hitCounts[matched.id]++;
}

const avgI = sampleScores.I.reduce((a, b) => a + b, 0) / sampleScores.I.length;
const avgB = sampleScores.B.reduce((a, b) => a + b, 0) / sampleScores.B.length;
const avgH = sampleScores.H.reduce((a, b) => a + b, 0) / sampleScores.H.length;

console.log(`随机期望得分: I ≈ ${avgI.toFixed(1)}, B ≈ ${avgB.toFixed(1)}, H ≈ ${avgH.toFixed(1)}`);
console.log('画像触发概率分布：');
familyOriginResults.forEach(r => {
  const cnt = hitCounts[r.id] || 0;
  const pct = ((cnt / N) * 100).toFixed(2);
  console.log(`[${r.id}] ${r.name.padEnd(16, ' ')} : ${cnt.toString().padStart(6, ' ')} 次 (${pct}%)`);
});

// 3. 典型人群倾向性测试 (偏向性测试)
console.log('\n=== 典型用户画像倾向模拟 (各 10,000 次) ===');

function simulatePersona(name: string, selectWeights: (q: any) => number[]) {
  const pCounts: Record<string, number> = {};
  familyOriginResults.forEach(r => { pCounts[r.id] = 0; });
  let pI = 0, pB = 0, pH = 0;

  for (let i = 0; i < 10000; i++) {
    let I = 0, B = 0, H = 0;
    familyOriginQuestions.forEach(q => {
      const weights = selectWeights(q);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let selectedIdx = 0;
      for (let j = 0; j < weights.length; j++) {
        rand -= weights[j];
        if (rand <= 0) {
          selectedIdx = j;
          break;
        }
      }
      const opt = q.options[selectedIdx];
      I += opt.scores.I;
      B += opt.scores.B;
      H += opt.scores.H;
    });
    pI += I; pB += B; pH += H;
    const matched = familyOriginResults.find(r => r.condition({ I, B, H })) || familyOriginResults[0];
    pCounts[matched.id]++;
  }

  console.log(`-- 人设: ${name} (均分: I=${(pI/10000).toFixed(1)}, B=${(pB/10000).toFixed(1)}, H=${(pH/10000).toFixed(1)}) --`);
  familyOriginResults.forEach(r => {
    const pct = ((pCounts[r.id] / 10000) * 100).toFixed(2);
    console.log(`   ${r.name}: ${pct}%`);
  });
}

// 极端断联/逆行独立者（选 I 高分项）
simulatePersona('极度断联觉醒型 (偏好独立/掌控)', q => {
  return q.options.map((opt: any) => Math.pow(opt.scores.I, 2));
});

// 温暖家庭/安全被爱型（选 H 高分项）
simulatePersona('温室被爱安全型 (偏好家庭支持/温暖)', q => {
  return q.options.map((opt: any) => Math.pow(opt.scores.H, 2));
});

// 创伤讨好/压抑内耗型（选低 I/低 B/低 H）
simulatePersona('重度创伤内耗型 (常选自责/压抑/害怕)', q => {
  return q.options.map((opt: any) => Math.pow(6 - opt.scores.I, 2));
});

// 边界冷感/搞钱第一型（选 B 高分项）
simulatePersona('高冷边界防御型 (偏好护城河/搞钱)', q => {
  return q.options.map((opt: any) => Math.pow(opt.scores.B, 2));
});
