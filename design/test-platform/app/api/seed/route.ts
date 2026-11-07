import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 完整的题库和结果数据（内嵌，无需读文件）
const EMO_RESULTS = [
  { title: '【人间铁壁】', desc: '你的情绪防火墙堪比银行金库。你几乎不为外界的评价买单，绝不为不值得的人花一分钱情绪。保持这种冷酷，干得漂亮！在这个大家都在疯狂内耗的时代，你活得像一个绝缘体。', quote: '我的感受优先级最高。', imageUrl: '', condition: 'low', testId: 'emotional-friction' },
  { title: '【精神守财奴】', desc: '你虽然偶尔会在意别人的看法，但只要一想到内耗太费精力，你就会立刻止损。你在"在意别人"和"保护自己"之间找到了完美的平衡，是一个情绪上的"守财奴"。', quote: '不值得的人，不配占用我的脑容量。', imageUrl: '', condition: 'bnd', testId: 'emotional-friction' },
  { title: '【薛定谔的敏感】', desc: '你大部分时候情绪稳定，但遇到特定的敏感触发点就会突然破防。你的雷达很敏锐，只是平时假装关机。', quote: '我只是看破不说破，别真以为我傻。', imageUrl: '', condition: 'sen', testId: 'emotional-friction' },
  { title: '【老好人提款机】', desc: '你的情绪账单里，大部分支出都在为别人买单。你太害怕得罪人，太害怕破坏气氛，以至于经常勉强自己答应不合理的要求。', quote: '成全了别人，委屈了自己。', imageUrl: '', condition: 'pls', testId: 'emotional-friction' },
  { title: '【深夜复盘家】', desc: '白天你是个正常人，一到深夜，你的大脑就开始播放《今日尴尬集锦》。你会为了一句没回好的话纠结半宿，反复推演"如果当时我那么说就好了"。', quote: '人类的悲欢并不相通，我只觉得我今天好尴尬。', imageUrl: '', condition: 'rum', testId: 'emotional-friction' },
  { title: '【情绪海绵】', desc: '你就像一块海绵，无差别地吸收着周围人的情绪。别人的一皱眉、一叹气，都能在你心里引发海啸。你极度敏锐，但也极度疲惫。', quote: '能不能求求大家别再给我散发负能量了？', imageUrl: '', condition: 'sen_pls', testId: 'emotional-friction' },
  { title: '【灵魂透支大户】', desc: '警告！您的心灵信用卡已被刷爆！你每天都在为他人的眼光和虚无的担忧支付巨额税款。一点风吹草动就能让你脑补出一场大戏。', quote: '我每天什么都没干，但就是觉得好累。', imageUrl: '', condition: 'high', testId: 'emotional-friction' },
  { title: '【自我PUA带师】', desc: '你对自己有着超乎寻常的苛刻。无论发生什么不好的事，你的第一反应永远是"是不是我哪里做错了"。你不需要别人来PUA你，你自己就能把自己批判得体无完肤。', quote: '放过自己吧，你已经做得很好了。', imageUrl: '', condition: 'rum_low_bnd', testId: 'emotional-friction' },
];

import { questions } from '../../../lib/data';

// 动态映射最新 20 题题库，保持与 lib/data.ts 权威单一数据源 (SSOT) 同步
const EMO_QUESTIONS = questions.map((q, idx) => ({
  order: idx + 1,
  text: q.text,
  testId: 'emotional-friction',
  options: q.options.map(opt => ({
    text: opt.text,
    scores: JSON.stringify({
      sen: opt.senScore || 0,
      rum: opt.rumScore || 0,
      pls: opt.plsScore || 0,
      bnd: opt.bndScore || 0,
      billName: opt.billName || ''
    })
  }))
}));


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';
  const log: string[] = [];
  try {
    // 检查是否已经有数据
    const existingCount = await prisma.question.count({ where: { testId: 'emotional-friction' } });
    if (existingCount > 0 && !force) {
      return NextResponse.json({ success: true, message: `已有 ${existingCount} 道题目，如需强制刷新最新题库请访问 /api/seed?force=true`, log });
    }

    // 若强制更新，仅安全清理 emotional-friction 的题目与选项（严格隔离保护 ActivationCode/TestRecord）
    if (existingCount > 0 && force) {
      const oldQuestions = await prisma.question.findMany({ where: { testId: 'emotional-friction' }, select: { id: true } });
      const qIds = oldQuestions.map(q => q.id);
      await prisma.option.deleteMany({ where: { questionId: { in: qIds } } });
      await prisma.question.deleteMany({ where: { id: { in: qIds } } });
      log.push(`✅ 已安全重置旧版 ${qIds.length} 道题目及选项 (卡密与历史订单 100% 完整保留)`);
    }

    // 写入 GlobalConfig
    const configExists = await prisma.globalConfig.findFirst({ where: { testId: 'emotional-friction' } });
    if (!configExists) {
      await prisma.globalConfig.create({
        data: { testId: 'emotional-friction', baseCount: 0, danmakuSpeed: 50, danmakuOpacity: 70, danmakuContent: '{}' }
      });
      log.push('✅ GlobalConfig created');
    }

    // 写入/更新结果配置
    for (const r of EMO_RESULTS) {
      const exist = await prisma.resultConfig.findFirst({ where: { testId: 'emotional-friction', condition: r.condition } });
      if (exist) {
        await prisma.resultConfig.update({ where: { id: exist.id }, data: r });
      } else {
        await prisma.resultConfig.create({ data: r });
      }
    }
    log.push(`✅ ${EMO_RESULTS.length} ResultConfigs synced`);

    // 写入最新题目与选项
    for (const q of EMO_QUESTIONS) {
      await prisma.question.create({
        data: {
          testId: q.testId,
          order: q.order,
          text: q.text,
          options: { create: q.options }
        }
      });
    }
    log.push(`✅ ${EMO_QUESTIONS.length} Questions (最新去AI感与混维版) 同步写入数据库完成！`);

    return NextResponse.json({ success: true, message: '最新题库与分值已成功同步到数据库！', log });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  }
}
