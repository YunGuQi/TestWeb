import { FamilyOriginEngine } from '../lib/engines/family-origin.engine';
import { prisma } from '../lib/prisma';

async function test() {
  console.log('--- 验证从数据库读取选项并执行计算 ---');
  // 读取每道题的第1个选项（阳光被爱型）
  const questions = await prisma.question.findMany({
    where: { testId: 'family-origin' },
    include: { options: true },
    orderBy: { order: 'asc' }
  });

  console.log(`从数据库读取到 ${questions.length} 道题目`);
  const firstOptionIds = questions.map(q => q.options[0].id.toString());
  
  const engine = new FamilyOriginEngine();
  const result = await engine.calculate({ testId: 'family-origin', optionIds: firstOptionIds, metadata: { nickname: '测试小仙女' } });
  
  console.log('\n计算结果:');
  console.log(`  ID: ${result.id}`);
  console.log(`  标题: ${result.title}`);
  console.log(`  副标题: ${result.subtitle}`);
  console.log(`  依恋类型: ${result.attachmentType}`);
  console.log(`  专属雷达: ${JSON.stringify(result.radar)}`);
  console.log(`  得分: ${JSON.stringify(result.rawScores)}`);
  console.log(`  童年烙印: ${result.childhoodMark?.slice(0, 30)}...`);
  console.log(`  应激触发点数量: ${result.triggers?.length}`);
  console.log(`  处方数量: ${result.antidoteList?.length}`);

  await prisma.$disconnect();
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
