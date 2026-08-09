const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const allQuestions = await prisma.question.findMany();
  const destinyQuestions = await prisma.question.findMany({ where: { testId: 'destiny-lover' } });
  const allActivationCodes = await prisma.activationCode.findMany();
  const destinyCodes = await prisma.activationCode.findMany({ where: { testId: 'destiny-lover' } });
  
  console.log('--- 数据库统计信息 (SQLite: dev.db) ---');
  console.log(`总题目数量: ${allQuestions.length}`);
  console.log(`[destiny-lover] 题目数量: ${destinyQuestions.length}`);
  console.log(`总激活码数量: ${allActivationCodes.length}`);
  console.log(`[destiny-lover] 激活码数量: ${destinyCodes.length}`);
  
  if (allActivationCodes.length > 0) {
    console.log('\n示例激活码:', allActivationCodes[0].code, `(所属测试: ${allActivationCodes[0].testId}, 可用次数: ${allActivationCodes[0].maxUses})`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
