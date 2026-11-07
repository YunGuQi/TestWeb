import { prisma } from '../lib/prisma';
import { loveSpeciesQuestions, loveSpeciesResults } from '../lib/love-species-data';

async function seed() {
  console.log('开始上传恋爱物种测试数据到数据库...');
  try {
    const testId = 'love-species';

    // 检查是否已经有数据
    const existingCount = await prisma.question.count({ where: { testId } });
    if (existingCount > 0) {
      await prisma.option.deleteMany({ where: { question: { testId } } });
      await prisma.question.deleteMany({ where: { testId } });
      await prisma.resultConfig.deleteMany({ where: { testId } });
      console.log('🗑️ 删除了旧的恋爱物种测试数据，准备上传全新数据...');
    }

    // 写入 GlobalConfig
    const configExists = await prisma.globalConfig.findFirst({ where: { testId } });
    if (!configExists) {
      await prisma.globalConfig.create({
        data: { testId, baseCount: 5000, danmakuSpeed: 50, danmakuOpacity: 70, danmakuContent: '{}' }
      });
      console.log('✅ GlobalConfig 创建成功');
    }

    // 写入结果配置
    for (const r of loveSpeciesResults) {
      await prisma.resultConfig.create({
        data: {
          testId,
          title: r.title,
          desc: JSON.stringify(r), // serialize the whole object to preserve tags/radar
          quote: r.description,
          imageUrl: r.emoji, // store emoji as imageUrl for now
          condition: r.key
        }
      });
    }
    console.log(`✅ ${loveSpeciesResults.length} 个结果配置上传成功`);

    // 写入题目（逐题）
    let order = 1;
    for (const q of loveSpeciesQuestions) {
      await prisma.question.create({
        data: {
          testId,
          order: order++,
          text: q.text,
          options: {
            create: q.options.map((opt: any) => ({
              text: opt.text,
              scores: JSON.stringify(opt.scores) // 将分数对象序列化为 JSON 字符串
            }))
          }
        }
      });
    }
    console.log(`✅ ${loveSpeciesQuestions.length} 道测试题上传成功`);

    console.log('🎉 恋爱物种测试数据已全部安全上传至数据库！');
  } catch (error: any) {
    console.error('上传失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
