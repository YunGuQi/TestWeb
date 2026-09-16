import { DestinyLoverEngine } from '../lib/engines/destiny-lover.engine';
import { destinyLoverQuestions } from '../lib/destiny-lover-data';

async function main() {
  const engine = new DestinyLoverEngine();

  console.log('====================================================');
  console.log('1. 同画像差异性测试 (ldap: 5:0 绝对优势 vs 3:2 微偏好)');
  console.log('====================================================');

  // 极端 5:0 ldap 组合
  // q1-q5 选 L (o1_1, o2_2, o3_1, o4_2, o5_1)
  // q6-q10 选 D (o6_2, o7_1, o8_2, o9_1, o10_2)
  // q11-q15 选 A (o11_2, o12_1, o13_2, o14_1, o15_2)
  // q16-q20 选 P (o16_2, o17_1, o18_2, o19_1, o20_1)
  const extremeLdapOptions = [
    'o1_1', 'o2_2', 'o3_1', 'o4_2', 'o5_1',
    'o6_2', 'o7_1', 'o8_2', 'o9_1', 'o10_2',
    'o11_2', 'o12_1', 'o13_2', 'o14_1', 'o15_2',
    'o16_2', 'o17_1', 'o18_2', 'o19_1', 'o20_1'
  ];

  // 温和 3:2 ldap 组合 (每轴 3 个正向，2 个反向)
  // q1-q3 选 L, q4-q5 选 G
  // q6-q8 选 D, q9-q10 选 S
  // q11-q13 选 A, q14-q15 选 C
  // q16-q18 选 P, q19-q20 选 R
  const moderateLdapOptions = [
    'o1_1', 'o2_2', 'o3_1', 'o4_1', 'o5_2',
    'o6_2', 'o7_1', 'o8_2', 'o9_2', 'o10_1',
    'o11_2', 'o12_1', 'o13_2', 'o14_2', 'o15_1',
    'o16_2', 'o17_1', 'o18_2', 'o19_2', 'o20_2'
  ];

  const resExtreme = await engine.calculate({ testId: 'destiny-lover', optionIds: extremeLdapOptions });
  const resModerate = await engine.calculate({ testId: 'destiny-lover', optionIds: moderateLdapOptions });

  console.log(`[极端 5:0] 命中画像: ${resExtreme.title} (${resExtreme.key})`);
  console.log('雷达指标:', resExtreme.radar);
  console.log('契合度:', resExtreme.synergy?.score + '%');
  console.log('----------------------------------------------------');
  console.log(`[温和 3:2] 命中画像: ${resModerate.title} (${resModerate.key})`);
  console.log('雷达指标:', resModerate.radar);
  console.log('契合度:', resModerate.synergy?.score + '%');

  // 验证两组数值是否存在阶梯差
  const radarDiff = resExtreme.radar.some((r, i) => Math.abs(r.value - resModerate.radar[i].value) >= 3.0);
  console.log('是否存在显著雷达阶梯差 (>=3.0%):', radarDiff ? 'PASS' : 'FAIL');
  console.log('契合度差异:', `${resExtreme.synergy?.score}% vs ${resModerate.synergy?.score}%`);

  console.log('\n====================================================');
  console.log('2. 50,000 次蒙特卡洛仿真稳定性检验');
  console.log('====================================================');

  const SIMULATION_COUNT = 50000;
  const profileCounts: Record<string, number> = {};
  let minRadarVal = 100;
  let maxRadarVal = 0;
  let minSynergy = 100;
  let maxSynergy = 0;
  let maxHighlightVal = 0;
  let minHighlightVal = 100;

  console.time('MonteCarlo-50000');

  for (let i = 0; i < SIMULATION_COUNT; i++) {
    const randomOptionIds: string[] = [];
    for (const q of destinyLoverQuestions) {
      const chosenOpt = q.options[Math.random() < 0.5 ? 0 : 1];
      randomOptionIds.push(chosenOpt.id);
    }

    const res = await engine.calculate({ testId: 'destiny-lover', optionIds: randomOptionIds });
    const key = res.key;
    profileCounts[key] = (profileCounts[key] || 0) + 1;

    // 监控雷达与契合度
    const radarVals = res.radar.map(r => r.value);
    const highestVal = Math.max(...radarVals);
    if (highestVal > maxHighlightVal) maxHighlightVal = highestVal;
    if (highestVal < minHighlightVal) minHighlightVal = highestVal;

    for (const v of radarVals) {
      if (v < minRadarVal) minRadarVal = v;
      if (v > maxRadarVal) maxRadarVal = v;
    }

    const syn = res.synergy?.score || 0;
    if (syn < minSynergy) minSynergy = syn;
    if (syn > maxSynergy) maxSynergy = syn;
  }

  console.timeEnd('MonteCarlo-50000');

  console.log('\n--- 16 画像分布统计 ---');
  const sortedProfiles = Object.entries(profileCounts).sort((a, b) => b[1] - a[1]);
  let minPct = 100;
  let maxPct = 0;

  for (const [key, count] of sortedProfiles) {
    const pct = (count / SIMULATION_COUNT) * 100;
    if (pct < minPct) minPct = pct;
    if (pct > maxPct) maxPct = pct;
    console.log(`${key.padEnd(6)}: ${count} 次 (${pct.toFixed(2)}%)`);
  }

  console.log('\n--- 宏观分布与安全边界校验 ---');
  console.log(`概率极差区间: [${minPct.toFixed(2)}%, ${maxPct.toFixed(2)}%] (期望在 6.0% ~ 6.6%)`);
  console.log(`雷达整体取值区间: [${minRadarVal}%, ${maxRadarVal}%]`);
  console.log(`第一高光特质区间: [${minHighlightVal}%, ${maxHighlightVal}%] (期望在 92.0% ~ 98.8%)`);
  console.log(`契合度取值区间: [${minSynergy}%, ${maxSynergy}%] (期望在 92.0% ~ 98.8%)`);

  const passDistribution = minPct >= 5.8 && maxPct <= 6.8;
  const passHighlight = minHighlightVal >= 92.0 && maxHighlightVal <= 98.8;
  const passSynergy = minSynergy >= 92.0 && maxSynergy <= 98.8;

  console.log('\n--- 最终判定 ---');
  console.log(`概率分布健康度: ${passDistribution ? 'PASS' : 'WARN'}`);
  console.log(`高光自尊赋能区间: ${passHighlight ? 'PASS' : 'FAIL'}`);
  console.log(`合盘契合度安全区间: ${passSynergy ? 'PASS' : 'FAIL'}`);
}

main().catch(console.error);
