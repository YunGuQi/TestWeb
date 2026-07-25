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

const EMO_QUESTIONS = [
  { order: 1, text: '深夜看到一条同事发来的仅你可见的吐槽朋友圈，你会？', testId: 'emotional-friction', options: [
    { text: '反复揣摩她的用意，甚至整晚失眠', scores: '{"sen":5,"rum":5,"pls":0,"bnd":0,"billName":"无意义失眠费"}' },
    { text: '假装没看见，直接划走', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"装瞎逃避税"}' },
    { text: '默默点个赞，表示已阅', scores: '{"sen":0,"rum":0,"pls":2,"bnd":2,"billName":"廉价社交费"}' },
    { text: '心里咯噔一下：是不是在内涵我？', scores: '{"sen":5,"rum":0,"pls":0,"bnd":0,"billName":"深夜对号入座费"}' },
  ]},
  { order: 2, text: '发在群里的消息，过了10分钟都没人回复，你的第一反应：', testId: 'emotional-friction', options: [
    { text: '有点尴尬，我是不是冷场了', scores: '{"sen":3,"rum":0,"pls":0,"bnd":0,"billName":"群聊冷场焦虑费"}' },
    { text: '立刻把消息撤回，当作没发生过', scores: '{"sen":5,"rum":0,"pls":3,"bnd":0,"billName":"社交自毁保释金"}' },
    { text: '可能都在忙，先干别的', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"钝感力储蓄"}' },
    { text: '我是不是说错话了？开始焦虑', scores: '{"sen":4,"rum":3,"pls":0,"bnd":0,"billName":"自省过度惩罚"}' },
  ]},
  { order: 3, text: '被领导单独叫进办公室，走在路上的你在想什么？', testId: 'emotional-friction', options: [
    { text: '回忆最近工作有没有纰漏', scores: '{"sen":0,"rum":3,"pls":0,"bnd":0,"billName":"职场危机预演"}' },
    { text: '完了，我是不是要挨骂了', scores: '{"sen":5,"rum":0,"pls":0,"bnd":0,"billName":"灾难化想象费"}' },
    { text: '心跳加速，甚至想立刻辞职逃避', scores: '{"sen":5,"rum":3,"pls":0,"bnd":0,"billName":"离职冲动挂号费"}' },
    { text: '估计是有新任务要交代，公事公办', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"公事公办通行费"}' },
  ]},
  { order: 4, text: '朋友聚会结束后，回到家里的状态是：', testId: 'emotional-friction', options: [
    { text: '感觉社交耗尽了所有能量，需要自闭几天', scores: '{"sen":5,"rum":0,"pls":5,"bnd":0,"billName":"灵魂透支抢救费"}' },
    { text: '复盘自己今晚有没有说错话', scores: '{"sen":3,"rum":5,"pls":0,"bnd":0,"billName":"睡前社交复盘费"}' },
    { text: '有点累，洗洗就睡了', scores: '{"sen":0,"rum":0,"pls":0,"bnd":3,"billName":"电量耗尽维修"}' },
    { text: '非常开心，意犹未尽', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"社交充能奖励"}' },
  ]},
  { order: 5, text: '看到别人在社交平台上炫耀完美生活，你的感受是：', testId: 'emotional-friction', options: [
    { text: '觉得自己是个彻头彻尾的loser', scores: '{"sen":5,"rum":5,"pls":0,"bnd":0,"billName":"自我贬低重税"}' },
    { text: '点个赞，然后继续过自己的日子', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"关我屁事豁免"}' },
    { text: '有点羡慕，但也仅此而已', scores: '{"sen":2,"rum":0,"pls":0,"bnd":0,"billName":"轻度眼红治疗"}' },
    { text: '对比自己，感到一阵深深的失落', scores: '{"sen":5,"rum":3,"pls":0,"bnd":0,"billName":"同侪压力折旧费"}' },
  ]},
  { order: 6, text: '面对一个艰难的决定（比如换工作或分手），你会：', testId: 'emotional-friction', options: [
    { text: '纠结几天，然后咬牙决定', scores: '{"sen":0,"rum":2,"pls":0,"bnd":0,"billName":"限时纠结费"}' },
    { text: '极度拖延，直到现实逼迫我做决定', scores: '{"sen":0,"rum":5,"pls":3,"bnd":0,"billName":"命运托管手续费"}' },
    { text: '权衡利弊后，果断做出选择', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"快刀斩乱麻"}' },
    { text: '反复推翻自己，迟迟做不了决定', scores: '{"sen":0,"rum":5,"pls":0,"bnd":0,"billName":"选择困难罚单"}' },
  ]},
  { order: 7, text: '当别人对你提出一个有些过分的请求时，你的反应：', testId: 'emotional-friction', options: [
    { text: '勉强答应，然后自己默默受委屈', scores: '{"sen":0,"rum":3,"pls":5,"bnd":0,"billName":"委曲求全过路费"}' },
    { text: '直接拒绝，说明原因', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"边界感维护费"}' },
    { text: '立刻答应，因为极度害怕破坏关系', scores: '{"sen":5,"rum":0,"pls":5,"bnd":0,"billName":"烂好人高昂保费"}' },
    { text: '委婉拒绝，心里稍微有点过意不去', scores: '{"sen":0,"rum":0,"pls":2,"bnd":3,"billName":"轻度讨好倾向"}' },
  ]},
  { order: 8, text: '一天结束，躺在床上的你在思考什么？', testId: 'emotional-friction', options: [
    { text: '各种杂念交织，越想越焦虑无法入睡', scores: '{"sen":5,"rum":5,"pls":0,"bnd":0,"billName":"午夜疯狂内耗税"}' },
    { text: '总结今天完成了哪些事', scores: '{"sen":0,"rum":1,"pls":0,"bnd":3,"billName":"自我管理费"}' },
    { text: '明天吃什么/玩什么', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"没心没肺快乐税"}' },
    { text: '回放今天尴尬的瞬间，感到懊恼', scores: '{"sen":3,"rum":5,"pls":0,"bnd":0,"billName":"精神黑历史拷问"}' },
  ]},
  { order: 9, text: '受到了一句不经意的批评，你会记得多久？', testId: 'emotional-friction', options: [
    { text: '在意一小会儿，很快调整过来', scores: '{"sen":2,"rum":0,"pls":0,"bnd":3,"billName":"玻璃心修复费"}' },
    { text: '记好几天，时不时想起来就会难受', scores: '{"sen":5,"rum":4,"pls":0,"bnd":0,"billName":"负面评价存储费"}' },
    { text: '变成长期的心理阴影，甚至改变自我认知', scores: '{"sen":5,"rum":5,"pls":3,"bnd":0,"billName":"PUA深度疗愈费"}' },
    { text: '听完就忘，或者马上怼回去', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"反弹装甲费"}' },
  ]},
  { order: 10, text: '如果能拥有一个超能力，你最想拥有哪个？', testId: 'emotional-friction', options: [
    { text: '读心术，想知道别人到底怎么看我', scores: '{"sen":5,"rum":0,"pls":4,"bnd":0,"billName":"偷窥心声流量费"}' },
    { text: '情绪开关，能随时关掉自己泛滥的感受', scores: '{"sen":5,"rum":5,"pls":0,"bnd":0,"billName":"感官切断手术费"}' },
    { text: '瞬间移动，想去哪就去哪', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"逃避现实机票"}' },
    { text: '预知未来，掌控一切可能', scores: '{"sen":0,"rum":4,"pls":0,"bnd":0,"billName":"控制欲年费"}' },
  ]},
  { order: 11, text: '周末本来想在家躺一天，但一个不是很熟的朋友突然约你喝咖啡：', testId: 'emotional-friction', options: [
    { text: '找借口拒绝后，一整天都在担心对方会不会生气', scores: '{"sen":5,"rum":4,"pls":0,"bnd":0,"billName":"拒绝后遗症治疗费"}' },
    { text: '直接找个理由婉拒，继续躺着', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"边界感护城河维护费"}' },
    { text: '立刻答应，哪怕自己很累也怕对方失望', scores: '{"sen":4,"rum":0,"pls":5,"bnd":0,"billName":"老好人周末透支税"}' },
    { text: '纠结半天要不要去，最后还是去了', scores: '{"sen":0,"rum":3,"pls":2,"bnd":0,"billName":"违背意愿出门费"}' },
  ]},
  { order: 12, text: '开会时，你提出了一个想法，结果被同事当众反驳，你会：', testId: 'emotional-friction', options: [
    { text: '当场理性探讨，就事论事', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"情绪绝缘盾牌"}' },
    { text: '会后反复回放那个尴尬瞬间，恨自己当时没发挥好', scores: '{"sen":3,"rum":5,"pls":0,"bnd":0,"billName":"职场马后炮反刍费"}' },
    { text: '表面笑笑，心里立刻开始自我怀疑', scores: '{"sen":5,"rum":3,"pls":0,"bnd":0,"billName":"职场自信心崩塌"}' },
    { text: '觉得非常丢脸，接下来的会一句话都不敢说', scores: '{"sen":5,"rum":0,"pls":0,"bnd":0,"billName":"社交恐惧急救金"}' },
  ]},
  { order: 13, text: '在街上远远看到一个认识但不熟的人，对方好像没看你，你会：', testId: 'emotional-friction', options: [
    { text: '纠结要不要打招呼，直到擦肩而过还在想', scores: '{"sen":3,"rum":4,"pls":0,"bnd":0,"billName":"擦肩而过内耗费"}' },
    { text: '赶紧低头假装玩手机，避免打招呼的尴尬', scores: '{"sen":4,"rum":0,"pls":2,"bnd":0,"billName":"社恐紧急避险费"}' },
    { text: '主动大声打招呼，即使对方可能不记得我', scores: '{"sen":0,"rum":0,"pls":0,"bnd":3,"billName":"社交牛逼症体验卡"}' },
    { text: '当作没看见，各走各的路', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"路人甲伪装税"}' },
  ]},
  { order: 14, text: '买了一杯奶茶，喝了一口发现做错了（比如做成了全糖），你会：', testId: 'emotional-friction', options: [
    { text: '算了吧，将就喝，不想麻烦别人', scores: '{"sen":0,"rum":0,"pls":4,"bnd":0,"billName":"讨好型妥协税"}' },
    { text: '告诉店员做错了，要求重做', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"消费者维权专车费"}' },
    { text: '扔掉不喝了，但心里一直觉得很亏', scores: '{"sen":0,"rum":4,"pls":0,"bnd":0,"billName":"沉默成本沉没费"}' },
    { text: '犹豫了很久想去换，走到柜台前又退缩了', scores: '{"sen":4,"rum":3,"pls":0,"bnd":0,"billName":"社交退缩违约金"}' },
  ]},
  { order: 15, text: '发在社交媒体上的一张自拍，几个小时了只有两个赞，你会：', testId: 'emotional-friction', options: [
    { text: '觉得照片真的很丑，默默删掉', scores: '{"sen":5,"rum":4,"pls":0,"bnd":0,"billName":"容貌焦虑充值"}' },
    { text: '不在意，我自己觉得好看就行', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"自我肯定奖金"}' },
    { text: '怀疑是不是被限流了或者大家都不喜欢我', scores: '{"sen":5,"rum":0,"pls":0,"bnd":0,"billName":"存在感稀薄惩罚"}' },
    { text: '开始分析是不是发的时间不对，下次换个时间', scores: '{"sen":0,"rum":3,"pls":0,"bnd":0,"billName":"流量玄学分析费"}' },
  ]},
  { order: 16, text: '别人不小心弄坏了你很喜欢的东西，对方一直在道歉，你的反应：', testId: 'emotional-friction', options: [
    { text: '反过来安慰对方，生怕对方因为内疚而难过', scores: '{"sen":4,"rum":0,"pls":5,"bnd":0,"billName":"圣母光环维护费"}' },
    { text: '接受道歉，但好几天都会为了这个东西心烦', scores: '{"sen":0,"rum":4,"pls":0,"bnd":0,"billName":"余波震荡损耗"}' },
    { text: '表面说"没关系"，其实心里心疼得要死', scores: '{"sen":0,"rum":3,"pls":5,"bnd":0,"billName":"强颜欢笑医疗费"}' },
    { text: '告诉对方这东西对我来说很重要，要求相应的赔偿', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"物品损失折旧费"}' },
  ]},
  { order: 17, text: '晚上睡觉前，脑子里突然想起五年前的一件丢人小事：', testId: 'emotional-friction', options: [
    { text: '马上开始反思为什么自己从小就这么蠢', scores: '{"sen":5,"rum":5,"pls":0,"bnd":0,"billName":"基因层面否定税"}' },
    { text: '笑笑自己当年真傻，翻个身睡觉', scores: '{"sen":0,"rum":0,"pls":0,"bnd":4,"billName":"黑历史和解金"}' },
    { text: '试图强行把画面赶出大脑，结果越想越清晰', scores: '{"sen":0,"rum":4,"pls":0,"bnd":0,"billName":"强制遗忘手续费"}' },
    { text: '尴尬得能在床上抠出三室一厅，疯狂捶枕头', scores: '{"sen":4,"rum":5,"pls":0,"bnd":0,"billName":"黑历史高清重置费"}' },
  ]},
  { order: 18, text: '准备要下班了，老板突然走过来说："这有个不急的活儿，你顺手看一下"，你会：', testId: 'emotional-friction', options: [
    { text: '说"好的，我明天一早来看"，准点下班', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"下班打卡护卫费"}' },
    { text: '说"好的老板"，然后加班做完再走', scores: '{"sen":0,"rum":0,"pls":5,"bnd":0,"billName":"职场老黄牛草料费"}' },
    { text: '虽然接了，但一边做一边在心里疯狂咒骂', scores: '{"sen":3,"rum":4,"pls":0,"bnd":0,"billName":"职场暗黑情绪税"}' },
    { text: '勉强接下，心里害怕如果不做完会被老板认为态度不好', scores: '{"sen":5,"rum":0,"pls":4,"bnd":0,"billName":"职场印象管理费"}' },
  ]},
  { order: 19, text: '你的好朋友最近心情不好，跟你抱怨了两个小时，你的感受：', testId: 'emotional-friction', options: [
    { text: '尽力倾听，但感觉自己的能量也被抽干了', scores: '{"sen":5,"rum":0,"pls":3,"bnd":0,"billName":"情绪垃圾桶清理费"}' },
    { text: '开始反思自己是不是也遇到了同样糟糕的情况', scores: '{"sen":4,"rum":4,"pls":0,"bnd":0,"billName":"共情过度传染病"}' },
    { text: '跟着一起骂，结果自己也气得半死', scores: '{"sen":4,"rum":0,"pls":0,"bnd":0,"billName":"情绪同频共振费"}' },
    { text: '听完就过，不会把对方的情绪带到自己身上', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"情绪隔离罩"}' },
  ]},
  { order: 20, text: '马上要做一个重要的当众汇报，你的状态是：', testId: 'emotional-friction', options: [
    { text: '提前一周就开始睡不好觉，脑子里全是忘词的画面', scores: '{"sen":5,"rum":5,"pls":0,"bnd":0,"billName":"灾难预演门票"}' },
    { text: '紧张到手心出汗，总觉得大家在等看我的笑话', scores: '{"sen":5,"rum":3,"pls":0,"bnd":0,"billName":"舞台恐惧聚光灯"}' },
    { text: '有点紧张，但深呼吸几次就能调整好', scores: '{"sen":2,"rum":0,"pls":0,"bnd":4,"billName":"临场微调费"}' },
    { text: '无所谓，大不了就是丢个人，爱咋咋地', scores: '{"sen":0,"rum":0,"pls":0,"bnd":5,"billName":"死猪不怕开水烫费"}' },
  ]},
];

export async function GET() {
  const log: string[] = [];
  try {
    // 检查是否已经有数据
    const existingCount = await prisma.question.count({ where: { testId: 'emotional-friction' } });
    if (existingCount > 0) {
      return NextResponse.json({ success: true, message: `已有 ${existingCount} 道题目，跳过 Seed`, log });
    }

    // 写入 GlobalConfig
    const configExists = await prisma.globalConfig.findFirst({ where: { testId: 'emotional-friction' } });
    if (!configExists) {
      await prisma.globalConfig.create({
        data: { testId: 'emotional-friction', baseCount: 0, danmakuSpeed: 50, danmakuOpacity: 70, danmakuContent: '{}' }
      });
      log.push('✅ GlobalConfig created');
    }

    // 写入结果配置
    for (const r of EMO_RESULTS) {
      await prisma.resultConfig.create({ data: r });
    }
    log.push(`✅ ${EMO_RESULTS.length} ResultConfigs created`);

    // 写入题目（逐题）
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
    log.push(`✅ ${EMO_QUESTIONS.length} Questions created`);

    return NextResponse.json({ success: true, message: 'Seed 完成！', log });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  }
}
