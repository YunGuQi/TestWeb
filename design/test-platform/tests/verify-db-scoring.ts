import { prisma } from '../lib/prisma';
import { DestinyLoverEngine } from '../lib/engines/destiny-lover.engine';

async function testRealDbOptions() {
  const testId = 'destiny-lover';
  const questions = await prisma.question.findMany({
    where: { testId },
    include: { options: true },
    orderBy: { order: 'asc' }
  });
  console.log('从数据库读取到真实题目数量:', questions.length);

  const engine = new DestinyLoverEngine();

  const gscpOptionIds: string[] = [];
  const ldarOptionIds: string[] = [];
  const lscpOptionIds: string[] = [];
  const gsarOptionIds: string[] = [];

  questions.forEach((q, idx) => {
    const opts = q.options;
    const opt0Scores = JSON.parse(opts[0].scores || '{}');
    const opt1Scores = JSON.parse(opts[1].scores || '{}');

    // 1. gscp (守护 G, 细节 S, 居家 C, 务实 P)
    if (idx < 5) gscpOptionIds.push((opt0Scores.G === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 10) gscpOptionIds.push((opt0Scores.S === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 15) gscpOptionIds.push((opt0Scores.C === 1 ? opts[0].id : opts[1].id).toString());
    else gscpOptionIds.push((opt0Scores.P === 1 ? opts[0].id : opts[1].id).toString());

    // 2. ldar (引领 L, 直球 D, 冒险 A, 浪漫 R)
    if (idx < 5) ldarOptionIds.push((opt0Scores.L === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 10) ldarOptionIds.push((opt0Scores.D === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 15) ldarOptionIds.push((opt0Scores.A === 1 ? opts[0].id : opts[1].id).toString());
    else ldarOptionIds.push((opt0Scores.R === 1 ? opts[0].id : opts[1].id).toString());

    // 3. lscp (人间主心骨: 引领 L, 细节 S, 居家 C, 务实 P)
    if (idx < 5) lscpOptionIds.push((opt0Scores.L === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 10) lscpOptionIds.push((opt0Scores.S === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 15) lscpOptionIds.push((opt0Scores.C === 1 ? opts[0].id : opts[1].id).toString());
    else lscpOptionIds.push((opt0Scores.P === 1 ? opts[0].id : opts[1].id).toString());

    // 4. gsar (随性漫游诗人: 守护 G, 细节 S, 冒险 A, 浪漫 R)
    if (idx < 5) gsarOptionIds.push((opt0Scores.G === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 10) gsarOptionIds.push((opt0Scores.S === 1 ? opts[0].id : opts[1].id).toString());
    else if (idx < 15) gsarOptionIds.push((opt0Scores.A === 1 ? opts[0].id : opts[1].id).toString());
    else gsarOptionIds.push((opt0Scores.R === 1 ? opts[0].id : opts[1].id).toString());
  });

  const res1 = await engine.calculate({ optionIds: gscpOptionIds, testId: 'destiny-lover' });
  console.log('✅ 测试 1 (全选 G-S-C-P):', res1.title, '(' + res1.key + ') | 命中原由:', res1.rawScores);

  const res2 = await engine.calculate({ optionIds: ldarOptionIds, testId: 'destiny-lover' });
  console.log('✅ 测试 2 (全选 L-D-A-R):', res2.title, '(' + res2.key + ') | 命中原由:', res2.rawScores);

  const res3 = await engine.calculate({ optionIds: lscpOptionIds, testId: 'destiny-lover' });
  console.log('✅ 测试 3 (全选 L-S-C-P):', res3.title, '(' + res3.key + ') | 命中原由:', res3.rawScores);

  const res4 = await engine.calculate({ optionIds: gsarOptionIds, testId: 'destiny-lover' });
  console.log('✅ 测试 4 (全选 G-S-A-R):', res4.title, '(' + res4.key + ') | 命中原由:', res4.rawScores);

  await prisma.$disconnect();
}

testRealDbOptions();
