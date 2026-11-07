import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { familyOriginQuestions, familyOriginResults } from '../../../lib/family-origin-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const log: string[] = [];
  try {
    const testId = 'family-origin';

    // 检查是否已经有数据
    const existingCount = await prisma.question.count({ where: { testId } });
    if (existingCount > 0) {
      // return NextResponse.json({ success: true, message: `已有 ${existingCount} 道题目，跳过 Seed`, log });
      // To allow updates, we can choose to delete existing or just log. We will delete existing to ensure a fresh upload.
      await prisma.option.deleteMany({ where: { question: { testId } } });
      await prisma.question.deleteMany({ where: { testId } });
      await prisma.resultConfig.deleteMany({ where: { testId } });
      log.push('🗑️ 删除了旧的原生家庭测试数据，准备上传全新数据...');
    }

    // 写入 GlobalConfig
    const configExists = await prisma.globalConfig.findFirst({ where: { testId } });
    if (!configExists) {
      await prisma.globalConfig.create({
        data: { testId, baseCount: 0, danmakuSpeed: 50, danmakuOpacity: 70, danmakuContent: '{}' }
      });
      log.push('✅ GlobalConfig 创建成功');
    }

    // 写入结果配置
    for (const r of familyOriginResults) {
      await prisma.resultConfig.create({
        data: {
          testId,
          title: r.name,
          desc: r.content,
          quote: r.quote,
          imageUrl: '',
          condition: r.id // 将 r1, r2 存入 condition
        }
      });
    }
    log.push(`✅ ${familyOriginResults.length} 个大女主结局配置上传成功`);

    // 写入题目（逐题）
    let order = 1;
    for (const q of familyOriginQuestions) {
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
    log.push(`✅ ${familyOriginQuestions.length} 道测试题上传成功`);

    return NextResponse.json({ success: true, message: '原生家庭大女主测试数据已全部安全上传至数据库！', log });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  }
}
