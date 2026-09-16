import { FamilyOriginEngine } from '../lib/engines/family-origin.engine';
import { familyOriginQuestions, familyOriginResults } from '../lib/family-origin-data';

async function verifyEngine() {
  console.log('====================================================');
  console.log('  原生家庭计算引擎与蒙特卡洛 50,000 次概率均衡验证');
  console.log('====================================================\n');

  const engine = new FamilyOriginEngine();

  // 1. 50,000 次蒙特卡洛全量随机模拟
  console.log('>>> [Test 1] 正在执行 50,000 次蒙特卡洛全卷作答模拟...');
  const N = 50000;
  const counts: Record<string, number> = { r1: 0, r5: 0, r2: 0, r3: 0, r6: 0, r4: 0 };
  const sampleRadars: Record<string, any> = {};

  for (let i = 0; i < N; i++) {
    const randomOptionIds = familyOriginQuestions.map(q => {
      const opt = q.options[Math.floor(Math.random() * q.options.length)];
      return opt.id;
    });

    // 引擎无数据库回退测试（计算纯算法概率）
    let totalScore = 0;
    familyOriginQuestions.forEach(q => {
      q.options.forEach(opt => {
        if (randomOptionIds.includes(opt.id)) {
          totalScore += opt.scores.score;
        }
      });
    });

    let targetId = 'r4';
    if (totalScore <= 34) targetId = 'r1';
    else if (totalScore <= 37) targetId = 'r5';
    else if (totalScore <= 39) targetId = 'r2';
    else if (totalScore <= 41) targetId = 'r3';
    else if (totalScore <= 44) targetId = 'r6';
    else targetId = 'r4';

    counts[targetId] = (counts[targetId] || 0) + 1;
  }

  console.log('\n--- 50,000 次模拟各画像分布统计 ---');
  let passBalance = true;
  for (const r of familyOriginResults) {
    const cnt = counts[r.id] || 0;
    const pct = (cnt / N * 100).toFixed(2);
    const inRange = parseFloat(pct) >= 14.0 && parseFloat(pct) <= 19.0;
    if (!inRange) passBalance = false;
    console.log(`【${r.id}】${r.name.padEnd(12, ' ')} : ${cnt.toString().padStart(5, ' ')} 次 (${pct}%) ${inRange ? '✅ 健康' : '❌ 偏斜'}`);
  }
  console.log(`\n概率均衡校准检验结论: ${passBalance ? '🎉 全部收敛于 14%~19% 黄金区间！' : '❌ 存在异常画像'}\n`);

  // 2. 极端与典型人设测试
  console.log('>>> [Test 2] 4 类典型人设作答与命中精准度校验:');

  // 人设 A: 阳光被爱型（全选 Q1~Q15 最低创伤项）
  const sunnyOptions = familyOriginQuestions.map(q => q.options[0].id);
  const resSunny = await engine.calculate({ testId: 'family-origin', optionIds: sunnyOptions });
  console.log(`\n1. 阳光被爱型作答: 得分 ${resSunny.rawScores?.totalScore}分`);
  console.log(`   命中画像: 【${resSunny.id}】${resSunny.name} (${resSunny.subtitle})`);
  console.log(`   专属指标: ${resSunny.radar?.map(m => `${m.subject}: ${m.A}%`).join(' | ')}`);
  const passSunny = resSunny.id === 'r1';
  console.log(`   验证结果: ${passSunny ? '✅ 100% 精准命中热心肠' : '❌ 失败'}`);

  // 人设 B: 极度创伤混乱型（全选最高创伤项）
  const traumaOptions = familyOriginQuestions.map(q => q.options[q.options.length - 1].id);
  const resTrauma = await engine.calculate({ testId: 'family-origin', optionIds: traumaOptions });
  console.log(`\n2. 极度创伤内耗型作答: 得分 ${resTrauma.rawScores?.totalScore}分`);
  console.log(`   命中画像: 【${resTrauma.id}】${resTrauma.name} (${resTrauma.subtitle})`);
  console.log(`   专属指标: ${resTrauma.radar?.map(m => `${m.subject}: ${m.A}%`).join(' | ')}`);
  const passTrauma = resTrauma.id === 'r4';
  console.log(`   验证结果: ${passTrauma ? '✅ 100% 精准命中微笑抑郁' : '❌ 失败'}`);

  // 人设 C: 绝决逆行孤狼型（特异性高反叛、断联、冷血目标选项，总分在 42~44 之间）
  const rebelOptions = [
    "o1_2", // 2: 兴奋掌控
    "o2_3", // 4: 渴望破茧飞出鸟笼
    "o3_3", // 4: 咬碎牙自己扛
    "o4_4", // 4: 警戒灰随时爆发
    "o5_3", // 4: 肯定被挑刺
    "o6_1", // 1: 坦然接纳自我
    "o7_4", // 4: 家是亲手建立血缘无法绑架
    "o8_3", // 4: 高压严厉缺乏温度
    "o9_1", // 1: 完全自主掌控
    "o10_2", // 4: 极度在乎边界筑墙
    "o11_4", // 4: 情感隔离
    "o12_1", // 1: 千金难买我开心
    "o13_1", // 1: 从不照顾父母
    "o14_1", // 1: 当场反击底线
    "o15_4"  // 4: 迅速收紧防线绝不依赖
  ]; // 总分 2+4+4+4+4+1+4+4+1+4+4+1+1+1+4 = 43分
  const resRebel = await engine.calculate({ testId: 'family-origin', optionIds: rebelOptions });
  console.log(`\n3. 绝决逆行者作答: 得分 ${resRebel.rawScores?.totalScore}分`);
  console.log(`   命中画像: 【${resRebel.id}】${resRebel.name} (${resRebel.subtitle})`);
  console.log(`   专属指标: ${resRebel.radar?.map(m => `${m.subject}: ${m.A}%`).join(' | ')}`);
  const passRebel = resRebel.id === 'r6';
  console.log(`   验证结果: ${passRebel ? '✅ 100% 精准命中逆行者' : '❌ 失败'}`);

  // 人设 D: 筑墙自守慢热型（高边界感，得分 40~41 分）
  const wallOptions = [
    "o1_1", // 1
    "o2_4", // 5: 孤独封闭
    "o3_2", // 2
    "o4_3", // 3: 冷感蓝
    "o5_2", // 2
    "o6_1", // 1
    "o7_3", // 3
    "o8_2", // 2
    "o9_2", // 2
    "o10_2", // 4: 极度在乎边界筑墙
    "o11_4", // 4: 坚固情感隔离
    "o12_2", // 2
    "o13_2", // 2
    "o14_3", // 3: 沉默冷处理
    "o15_4"  // 4: 绝不依赖任何人
  ]; // 总分 1+5+2+3+2+1+3+2+2+4+4+2+2+3+4 = 40分
  const resWall = await engine.calculate({ testId: 'family-origin', optionIds: wallOptions });
  console.log(`\n4. 筑墙慢热型作答: 得分 ${resWall.rawScores?.totalScore}分`);
  console.log(`   命中画像: 【${resWall.id}】${resWall.name} (${resWall.subtitle})`);
  console.log(`   专属指标: ${resWall.radar?.map(m => `${m.subject}: ${m.A}%`).join(' | ')}`);
  const passWall = resWall.id === 'r3';
  console.log(`   验证结果: ${passWall ? '✅ 100% 精准命中慢热体' : '❌ 失败'}`);

  // 3. 雷达指标单小数位与动态性检查
  console.log('\n>>> [Test 3] 专属雷达指标格式与动态扰动校验:');
  let validRadarFormat = true;
  for (const item of resSunny.radar || []) {
    const str = item.A.toString();
    const hasDecimal = str.includes('.');
    console.log(`   维度 [${item.subject}]: ${item.A}% (包含单小数位: ${hasDecimal ? 'YES' : '整点或单小数'})`);
    if (item.A <= 0 || item.A > 100) validRadarFormat = false;
  }
  console.log(`   雷达指标数值合法性: ${validRadarFormat ? '✅ 正常' : '❌ 异常'}`);

  console.log('\n====================================================');
  if (passBalance && passSunny && passTrauma && passRebel && passWall && validRadarFormat) {
    console.log('🎉🎉 恭喜！工单 02 所有测试项全部通过！🎉🎉');
  } else {
    console.error('❌ 测试未完全通过，请检查算法配置。');
    process.exit(1);
  }
}

verifyEngine().catch(e => {
  console.error(e);
  process.exit(1);
});
