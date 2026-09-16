import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { loveSpeciesQuestions, loveSpeciesResults } from '../../../lib/love-species-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const log: string[] = [];
  try {
    const testId = 'love-species';

    // 检查是否已经有数据
    const existingCount = await prisma.question.count({ where: { testId } });
    if (existingCount > 0) {
      await prisma.option.deleteMany({ where: { question: { testId } } });
      await prisma.question.deleteMany({ where: { testId } });
      await prisma.resultConfig.deleteMany({ where: { testId } });
      log.push('🗑️ 删除了旧的恋爱物种测试数据，准备上传全新数据...');
    }

    // 写入 GlobalConfig
    const configExists = await prisma.globalConfig.findFirst({ where: { testId } });
    if (!configExists) {
      await prisma.globalConfig.create({
        data: { testId, baseCount: 5000, danmakuSpeed: 50, danmakuOpacity: 70, danmakuContent: '{}' }
      });
      log.push('✅ GlobalConfig 创建成功');
    }

    // 写入结果配置
    for (const r of loveSpeciesResults) {
      await prisma.resultConfig.create({
        data: {
          testId,
          title: r.title,
          desc: JSON.stringify(r), // 序列化完整对象，便于后续读取
          quote: r.description,
          imageUrl: r.emoji, // 暂时用 imageUrl 存储 emoji
          condition: r.key // 存入 key 用作判断
        }
      });
    }
    log.push(`✅ ${loveSpeciesResults.length} 个结果配置上传成功`);

    // 写入题目（逐题）
    let order = 1;
    for (const q of loveSpeciesQuestions) {
      await prisma.question.create({
        data: {
          testId,
          order: order++,
          text: q.text,
          options: {
            create: q.options.map(opt => ({
              text: opt.text,
              scores: JSON.stringify(opt.scores) // 将分数对象序列化为 JSON 字符串
            }))
          }
        }
      });
    }
    log.push(`✅ ${loveSpeciesQuestions.length} 道测试题上传成功`);

    return NextResponse.json({ success: true, message: '恋爱物种测试数据已全部安全上传至数据库！', log });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  }
}
