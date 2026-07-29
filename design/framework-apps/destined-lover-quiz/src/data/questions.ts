export type AxisScore = "R" | "P" | "D" | "I" | "S" | "C";

export interface Option {
  id: string;
  text: string;
  scores: { axis: AxisScore; score: number }[];
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export const questions: Question[] = [
  {
    id: 1,
    text: "周末大雨，原本约好的露营取消了，你希望未来的伴侣怎么做？",
    options: [
      { id: "A", text: "马上变出备案：“那我们去新开的那家室内沉浸展吧！”", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "两个人窝在沙发上，点个外卖看一整天的老电影。", scores: [{ axis: "C", score: 2 }] },
      { id: "C", text: "各干各的，他在客厅打游戏，你在卧室看书，互不打扰。", scores: [{ axis: "I", score: 2 }] },
      { id: "D", text: "趁着在家，一起把家里彻底大扫除一遍，整理换季衣物。", scores: [{ axis: "P", score: 2 }] }
    ]
  },
  {
    id: 2,
    text: "刷朋友圈看到朋友晒出对象送的 999 朵玫瑰，你的真实 OS 是？",
    options: [
      { id: "A", text: "哇，好浪漫！以后我也要体验一次。", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "挺好看的，但稍微有点铺张浪费了。", scores: [{ axis: "P", score: 1 }] },
      { id: "C", text: "这得花多少钱？不如换成等价的实用礼物或一顿大餐。", scores: [{ axis: "P", score: 2 }] },
      { id: "D", text: "主要是看送花人的心意，如果是懂我的人，一朵也行。", scores: [{ axis: "S", score: 2 }] }
    ]
  },
  {
    id: 3,
    text: "如果有个人在狂追你，但他连你最喜欢喝什么奶茶都记错，你会？",
    options: [
      { id: "A", text: "直接下头，连这点细节都记不住，绝对不是真爱。", scores: [{ axis: "S", score: 2 }] },
      { id: "B", text: "有点失望，但如果他马上补救，可以再看看。", scores: [{ axis: "C", score: 1 }] },
      { id: "C", text: "无所谓，可能他太忙了，大不了我自己点。", scores: [{ axis: "I", score: 1 }] },
      { id: "D", text: "借机敲打他：“下次要是再买错，这奶茶就得你全喝了。”", scores: [{ axis: "D", score: 1 }] }
    ]
  },
  {
    id: 4,
    text: "晚上 11 点，你突然极其想吃城西那家网红烧烤，你会？",
    options: [
      { id: "A", text: "疯狂暗示伴侣，希望他主动说“走，我带你去”。", scores: [{ axis: "D", score: 2 }] },
      { id: "B", text: "直接撒娇让他点外卖或者开车去买。", scores: [{ axis: "D", score: 1 }] },
      { id: "C", text: "问他去不去，不去自己就点个外卖解馋。", scores: [{ axis: "I", score: 1 }] },
      { id: "D", text: "算了，太晚了，明天下班再去吃也是一样的。", scores: [{ axis: "P", score: 2 }] }
    ]
  },
  {
    id: 5,
    text: "两个人在一起，你认为绝对不能忍受的是？",
    options: [
      { id: "A", text: "连在一起连个废话都聊不到一块去，像搭伙过日子。", scores: [{ axis: "S", score: 2 }] },
      { id: "B", text: "遇到了问题总是冷战，不提供情绪反馈。", scores: [{ axis: "D", score: 2 }] },
      { id: "C", text: "他的未来规划里根本没有把我考虑进去。", scores: [{ axis: "P", score: 2 }] },
      { id: "D", text: "极度干涉我的交友圈和私人爱好。", scores: [{ axis: "I", score: 2 }] }
    ]
  },
  {
    id: 6,
    text: "你理想中的同居生活，晚上的常态画面是？",
    options: [
      { id: "A", text: "熄灯后在被窝里夜聊，分享一天的见闻和心事。", scores: [{ axis: "S", score: 2 }] },
      { id: "B", text: "一个人在书桌前加班，另一个人切好水果端过来。", scores: [{ axis: "C", score: 2 }] },
      { id: "C", text: "一起倒一杯红酒，点上香薰，放点黑胶音乐。", scores: [{ axis: "R", score: 2 }] },
      { id: "D", text: "房子要大，最好有各自的房间或工作区。", scores: [{ axis: "I", score: 2 }] }
    ]
  },
  {
    id: 7,
    text: "如果伴侣被公司外派去另一个城市工作两年，你的第一反应？",
    options: [
      { id: "A", text: "异地恋太痛苦了，绝对不行，我需要他在身边。", scores: [{ axis: "D", score: 2 }] },
      { id: "B", text: "如果那对他职业发展有极大的帮助，我会支持。", scores: [{ axis: "P", score: 2 }] },
      { id: "C", text: "两地分居刚好有自己的空间，周末飞去见一面就好。", scores: [{ axis: "I", score: 2 }] },
      { id: "D", text: "距离产生美，也许这会让我们每次见面都像热恋。", scores: [{ axis: "R", score: 2 }] }
    ]
  },
  {
    id: 8,
    text: "在你看来，“他很懂你”具体体现在？",
    options: [
      { id: "A", text: "我一个眼神，他就知道我想开溜还是想继续待着。", scores: [{ axis: "S", score: 2 }] },
      { id: "B", text: "不用我说，他就把家里的水费电费物业费都交了。", scores: [{ axis: "P", score: 2 }] },
      { id: "C", text: "知道我什么时候需要拥抱，什么时候需要自己静一静。", scores: [{ axis: "D", score: 2 }, { axis: "I", score: 1 }] },
      { id: "D", text: "我们能对同一部冷门电影产生完全一致的深刻见解。", scores: [{ axis: "S", score: 3 }] }
    ]
  },
  {
    id: 9,
    text: "纪念日快到了，你其实内心更期待收到什么？",
    options: [
      { id: "A", text: "对方亲手制作的手工盲盒，里面写满对我说的话。", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "清空我的购物车，或者直接给我转一个吉利的数字。", scores: [{ axis: "P", score: 2 }] },
      { id: "C", text: "一起去海边看日出，享受远离城市的二人世界。", scores: [{ axis: "R", score: 1 }, { axis: "C", score: 1 }] },
      { id: "D", text: "最新款的电子产品或者我缺了很久的一套护肤品。", scores: [{ axis: "P", score: 1 }] }
    ]
  },
  {
    id: 10,
    text: "当你在工作中受了极大的委屈，回到家你希望他？",
    options: [
      { id: "A", text: "把我抱进怀里，无条件跟我一起骂那个老板。", scores: [{ axis: "D", score: 2 }] },
      { id: "B", text: "冷静地帮我复盘整件事，给我职场建议。", scores: [{ axis: "I", score: 1 }, { axis: "P", score: 1 }] },
      { id: "C", text: "什么都不问，默默给我做一顿我最爱吃的饭。", scores: [{ axis: "C", score: 2 }] },
      { id: "D", text: "讲好笑的段子逗我开心，带我转移注意力。", scores: [{ axis: "D", score: 1 }] }
    ]
  },
  {
    id: 11,
    text: "如果可以像偶像剧一样选择，你希望你们的相识是？",
    options: [
      { id: "A", text: "在旅行途中的一家咖啡馆，偶然拿错了同一本书。", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "在一个高门槛的行业峰会上，因为观点碰撞而互相欣赏。", scores: [{ axis: "S", score: 2 }] },
      { id: "C", text: "朋友组的局上，发现彼此的口味和笑点出奇一致。", scores: [{ axis: "C", score: 2 }] },
      { id: "D", text: "相亲局上，发现对方的条件完美契合自己所有的硬性标准。", scores: [{ axis: "P", score: 2 }] }
    ]
  },
  {
    id: 12,
    text: "对方手机里一直留着一个和平分手的前任微信（从不聊天），你的态度？",
    options: [
      { id: "A", text: "绝对不行，必须删掉，前任是不可触碰的底线。", scores: [{ axis: "D", score: 2 }] },
      { id: "B", text: "如果真的不聊就随便他，我也有我的异性朋友。", scores: [{ axis: "I", score: 2 }] },
      { id: "C", text: "找个机会跟他深夜深谈一次，了解这个人在他心里的位置。", scores: [{ axis: "S", score: 2 }] },
      { id: "D", text: "只要他不给对方转账或者有利益往来，留着就留着呗。", scores: [{ axis: "P", score: 2 }] }
    ]
  },
  {
    id: 13,
    text: "你们准备买房，但在装修风格上（你喜欢极简，他喜欢复古）产生分歧，你会？",
    options: [
      { id: "A", text: "不行，房子是重头戏，我一定要说服他听我的。", scores: [{ axis: "D", score: 1 }, { axis: "I", score: 1 }] },
      { id: "B", text: "那就一人装一个空间，卧室听我的，书房听他的。", scores: [{ axis: "I", score: 2 }] },
      { id: "C", text: "坐下来把所有的材料、预算拉个Excel，看哪个性价比高。", scores: [{ axis: "P", score: 2 }] },
      { id: "D", text: "只要跟他一起住，其实什么风格我最后都能接受。", scores: [{ axis: "C", score: 2 }] }
    ]
  },
  {
    id: 14,
    text: "朋友聚会上，他一直在照顾别人的情绪，有点忽略了你，回去路上你会？",
    options: [
      { id: "A", text: "直接跟他甩脸子，告诉他“你今天冷落我了”。", scores: [{ axis: "D", score: 2 }] },
      { id: "B", text: "觉得他情商很高，社交能力强，是个加分项。", scores: [{ axis: "P", score: 2 }] },
      { id: "C", text: "不理他，自己戴上耳机听歌，让他自己发现我不对劲。", scores: [{ axis: "D", score: 1 }] },
      { id: "D", text: "完全不在意，我自己在那边也和朋友聊得挺嗨。", scores: [{ axis: "I", score: 2 }] }
    ]
  },
  {
    id: 15,
    text: "下列哪种约会行程，光是想想就让你觉得心动？",
    options: [
      { id: "A", text: "没有任何计划，开着车走到哪算哪的一场漫游。", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "提前半个月定好的高级餐厅，穿上最精致的晚礼服。", scores: [{ axis: "P", score: 1 }, { axis: "R", score: 1 }] },
      { id: "C", text: "逛完宜家，一起在楼下的超市买菜回家做个寿喜锅。", scores: [{ axis: "C", score: 2 }] },
      { id: "D", text: "找一家安静的独立书店，看一个下午的书，然后分享读后感。", scores: [{ axis: "S", score: 2 }] }
    ]
  },
  {
    id: 16,
    text: "大吵一架后，你最看重对方怎样的认错方式？",
    options: [
      { id: "A", text: "带着我最爱吃的甜点出现在我面前，给我一个大大的拥抱。", scores: [{ axis: "D", score: 2 }] },
      { id: "B", text: "给我发一篇小作文，深刻剖析他错在哪里，以及以后的改进计划。", scores: [{ axis: "S", score: 2 }] },
      { id: "C", text: "只要他愿意主动先开口给台阶，哪怕是问一句“吃了吗”，我就能顺势下。", scores: [{ axis: "C", score: 2 }] },
      { id: "D", text: "如果真的是他错了，他必须要有实际的物质补偿或者行动弥补。", scores: [{ axis: "P", score: 2 }] }
    ]
  },
  {
    id: 17,
    text: "你觉得能够维持一段感情走到最后的，最核心的因素是？",
    options: [
      { id: "A", text: "即使到了80岁，看到对方依然会有心动的感觉。", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "门当户对，物质基础雄厚，没有生存压力。", scores: [{ axis: "P", score: 2 }] },
      { id: "C", text: "三观一致，对这个世界的认知和道德底线是同频的。", scores: [{ axis: "S", score: 2 }] },
      { id: "D", text: "习惯了彼此的存在，像左手摸右手一样自然。", scores: [{ axis: "C", score: 2 }] }
    ]
  },
  {
    id: 18,
    text: "如果他突然告诉你，他想辞掉现在稳定的高薪工作去创业（有风险），你会？",
    options: [
      { id: "A", text: "觉得他很有追求！无条件支持他的梦想，哪怕失败了再一起扛。", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "立刻跟他算一笔账，评估家里的存款能支撑多久，再做决定。", scores: [{ axis: "P", score: 2 }] },
      { id: "C", text: "问他深层的动机是什么，是不是因为现在的工作让他觉得失去了自我？", scores: [{ axis: "S", score: 2 }] },
      { id: "D", text: "随他便，只要别影响到我的正常生活质量就行。", scores: [{ axis: "I", score: 2 }] }
    ]
  },
  {
    id: 19,
    text: "你希望在对方的眼里，你是一个怎样的存在？",
    options: [
      { id: "A", text: "他唯一可以卸下防备的避风港。", scores: [{ axis: "S", score: 1 }, { axis: "C", score: 1 }] },
      { id: "B", text: "他离不开的“小作精”/“小霸王”。", scores: [{ axis: "D", score: 2 }] },
      { id: "C", text: "与他并肩作战的超级合伙人。", scores: [{ axis: "P", score: 2 }, { axis: "I", score: 1 }] },
      { id: "D", text: "他永远猜不透的灵魂发掘机。", scores: [{ axis: "I", score: 2 }, { axis: "S", score: 1 }] }
    ]
  },
  {
    id: 20,
    text: "终于做完这20题了，你内心其实最期待测出怎样的人？",
    options: [
      { id: "A", text: "像命中注定一样，带着宿命感降临的人。", scores: [{ axis: "R", score: 2 }] },
      { id: "B", text: "各方面条件都无可挑剔，能带我跨越阶层的人。", scores: [{ axis: "P", score: 2 }] },
      { id: "C", text: "能懂我所有奇奇怪怪的脑回路，接住我所有梗的人。", scores: [{ axis: "S", score: 2 }] },
      { id: "D", text: "脾气超好，能包容我所有小缺点，永远陪着我的人。", scores: [{ axis: "C", score: 2 }, { axis: "D", score: 1 }] }
    ]
  }
];
