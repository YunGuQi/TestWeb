// 恋爱物种客户端轻量元数据与纯工具计算模块（完全独立，物理隔离敏感商业深度文案）

export const parseSpeciesMBTI = (key: string): string => {
  if (!key || key.length !== 4) return "UNKNOWN";
  const char1 = key[1] === 'E' ? 'E' : 'I';
  const char2 = key[3] === 'I' ? 'N' : 'S';
  const char3 = key[2] === 'S' ? 'F' : 'T';
  const char4 = key[0] === 'A' ? 'J' : 'P';
  return char1 + char2 + char3 + char4;
};

export interface SpeciesSummary {
  id: number;
  key: string;
  title: string;
  emoji: string;
  mbti: string;
  tags: string[];
}

export interface SpeciesSynergyResult {
  mySpecies: {
    key: string;
    title: string;
    emoji: string;
    mbti: string;
  };
  partnerSpecies: {
    key: string;
    title: string;
    emoji: string;
    mbti: string;
  };
  score: number;
  tierTitle: string;
  synergyTone: string;
  relationType: 'soulmate' | 'complement' | 'mirror' | 'toxic' | 'balanced';
  interactionScene: string;
  sweetMoment: string;
  dangerNotice: string;
  secretCode: string;
}

// 16 大恋爱物种公开轻量元数据清单（绝不含 70% 深度分析与私密商业资产）
export const SPECIES_SUMMARIES_DATA = [
  { id: 1, key: "AESI", title: "直球粘人精 · 掉毛大胖橘", emoji: "🐱", tags: ["#大橘为重", "#消息秒回", "#掉毛狂魔", "#直球大喇叭"], bestMatch: "纯爱战神 · 铁憨憨大金毛 (AHCR)", toxicMatch: "查岗黑洞 · 莫挨老子渣猫 (DECI)" },
  { id: 2, key: "AESR", title: "双标战神 · 护食黑柴犬", emoji: "🐕", tags: ["#对内摇尾", "#对外龇牙", "#护食狂犬", "#记仇小本本"], bestMatch: "全自动保姆 · 操心边牧 (AECR)", toxicMatch: "风吹草动连夜跑 · 惊恐飞鼠 (DHSI)" },
  { id: 3, key: "AECI", title: "狂暴小太阳 · 撒欢二哈", emoji: "🐺", tags: ["#精力过载", "#纯血乐天派", "#热血笨蛋", "#拆家式示爱"], bestMatch: "直球粘人精 · 掉毛大胖橘 (AESI)", toxicMatch: "八百个心眼 · 侦探猫头鹰 (DHSR)" },
  { id: 4, key: "AECR", title: "全自动保姆 · 操心边牧", emoji: "🐶", tags: ["#爹妈系男友", "#自动放牧", "#全盘操心", "#高智商保姆"], bestMatch: "双标战神 · 护食黑柴犬 (AESR)", toxicMatch: "嘴硬心烂 · 傲娇暹罗猫 (DESI)" },
  { id: 5, key: "AHSI", title: "阴阳大师 · 炸毛黑猫", emoji: "🐈‍⬛", tags: ["#冷脸洗内裤", "#口是心非", "#高敏炸毛", "#微表情福尔摩斯"], bestMatch: "狂暴小太阳 · 撒欢二哈 (AECI)", toxicMatch: "查岗黑洞 · 莫挨老子渣猫 (DECI)" },
  { id: 6, key: "AHSR", title: "又怂又爱 · 脆皮垂耳兔", emoji: "🐰", tags: ["#胆小如鼠", "#暗戳戳试探", "#现实主义装傻", "#一碰就碎"], bestMatch: "纯爱战神 · 铁憨憨大金毛 (AHCR)", toxicMatch: "利益合伙人 · 搞钱杜宾犬 (DECR)" },
  { id: 7, key: "AHCI", title: "就地装死 · 摆烂猫猫虫", emoji: "🐛", tags: ["#遇事装死", "#浪漫绝缘假动作", "#别逼我", "#躺平治百病"], bestMatch: "直球粘人精 · 掉毛大胖橘 (AESI)", toxicMatch: "嘴硬心烂 · 傲娇暹罗猫 (DESI)" },
  { id: 8, key: "AHCR", title: "纯爱战神 · 铁憨憨大金毛", emoji: "🦮", tags: ["#纯爱无脑", "#笨拙真诚", "#顶级安全感", "#护短大暖男"], bestMatch: "又怂又爱 · 脆皮垂耳兔 (AHSR)", toxicMatch: "风吹草动连夜跑 · 惊恐飞鼠 (DHSI)" },
  { id: 9, key: "DESI", title: "嘴硬心烂 · 傲娇暹罗猫", emoji: "🐱", tags: ["#全身上下嘴最硬", "#推开又偷看", "#午夜心碎小狗", "#死要面子"], bestMatch: "狂暴小太阳 · 撒欢二哈 (AECI)", toxicMatch: "查岗黑洞 · 莫挨老子渣猫 (DECI)" },
  { id: 10, key: "DESR", title: "法官级算账 · 防盗铁刺猬", emoji: "🦔", tags: ["#感情合伙制", "#绝不倒贴", "#账本防盗门", "#秒速止损"], bestMatch: "全自动保姆 · 操心边牧 (AECR)", toxicMatch: "阴阳大师 · 炸毛黑猫 (AHSI)" },
  { id: 11, key: "DECI", title: "查岗黑洞 · 莫挨老子渣猫", emoji: "🐈", tags: ["#已读乱回", "#自由第一", "#你谁啊别管我", "#反PUA大师"], bestMatch: "直球粘人精 · 掉毛大胖橘 (AESI)", toxicMatch: "嘴硬心烂 · 傲娇暹罗猫 (DESI)" },
  { id: 12, key: "DECR", title: "利益合伙人 · 搞钱杜宾犬", emoji: "🐕‍🦺", tags: ["#顶级慕强", "#恋爱不如搞钱", "#并肩作战", "#冷血合伙人"], bestMatch: "法官级算账 · 防盗铁刺猬 (DESR)", toxicMatch: "又怂又爱 · 脆皮垂耳兔 (AHSR)" },
  { id: 13, key: "DHSI", title: "风吹草动连夜跑 · 惊恐飞鼠", emoji: "🐿️", tags: ["#逃跑冠军", "#风吹草动连夜买站票", "#自闭树洞", "#怕被看穿"], bestMatch: "就地装死 · 摆烂猫猫虫 (AHCI)", toxicMatch: "双标战神 · 护食黑柴犬 (AESR)" },
  { id: 14, key: "DHSR", title: "八百个心眼 · 侦探猫头鹰", emoji: "🦉", tags: ["#暗中调查", "#背景背调", "#不见兔子不撒鹰", "#利己精算师"], bestMatch: "纯爱战神 · 铁憨憨大金毛 (AHCR)", toxicMatch: "狂暴小太阳 · 撒欢二哈 (AECI)" },
  { id: 15, key: "DHCI", title: "情绪已入土 · 佛系卡皮巴拉", emoji: "🦫", tags: ["#情绪入土", "#万物皆可OK", "#顶级松弛感", "#精神老干部"], bestMatch: "直球粘人精 · 掉毛大胖橘 (AESI)", toxicMatch: "风吹草动连夜跑 · 惊恐飞鼠 (DHSI)" },
  { id: 16, key: "DHCR", title: "寡王巅峰 · 零度高岭雪豹", emoji: "🐆", tags: ["#雪山寡王", "#生人勿近", "#爱能当饭吃吗", "#终极独行侠"], bestMatch: "利益合伙人 · 搞钱杜宾犬 (DECR)", toxicMatch: "直球粘人精 · 掉毛大胖橘 (AESI)" }
];

export const getAllSpecies = (): SpeciesSummary[] => {
  return SPECIES_SUMMARIES_DATA.map(item => ({
    id: item.id,
    key: item.key,
    title: item.title,
    emoji: item.emoji,
    mbti: parseSpeciesMBTI(item.key),
    tags: item.tags
  }));
};

export const getSpeciesByKey = (key: string) => {
  return SPECIES_SUMMARIES_DATA.find(item => item.key === key) || SPECIES_SUMMARIES_DATA[0];
};

interface CustomScenario {
  score: number;
  tierTitle: string;
  synergyTone: string;
  relationType: 'soulmate' | 'complement' | 'mirror' | 'toxic' | 'balanced';
  interactionScene: string;
  sweetMoment: string;
  dangerNotice: string;
  secretCode: string;
}

const SPECIAL_SYNERGY_MAP: Record<string, CustomScenario> = {
  "AESI_AHCR": {
    score: 98,
    tierTitle: "猫狗双全 · 灵魂共鸣天花板 (SSS级)",
    synergyTone: "高浓度掉毛粘人精遇到无底线顺毛的大暖汪",
    relationType: "soulmate",
    interactionScene: "大金毛在沙发上默默切水果，大胖橘一屁股坐进金毛怀里，把手机亮给金毛看搞笑萌宠视频。金毛一边宠溺地递过苹果，一边温厚地给大橘顺毛，任由大橘在自己身上蹭得全是猫毛。",
    sweetMoment: "大胖橘半夜做噩梦突然惊醒，还没开口，大金毛闭着眼睛下意识把被子给它掖好，反手搂紧轻拍后背：“别怕，我在呢，大橘为重。”",
    dangerNotice: "大胖橘闹小脾气时金毛切莫冷场；金毛也需要偶尔放空的充电时刻，大橘不要把片刻安静当成感情降温。",
    secretCode: "“大金毛提供终身避风港，大胖橘给平淡岁月点燃烟花。”"
  },
  "AESI_DECR": {
    score: 92,
    tierTitle: "极限反差 · 搞钱杜宾专属偏爱 (SS级)",
    synergyTone: "冷血商业杜宾被一团热烈掉毛大胖橘彻底捂化的反差甜",
    relationType: "complement",
    interactionScene: "杜宾犬在电脑前雷厉风行地敲着商业并购案，西装革履气场两米八。大胖橘不管不顾一头撞进杜宾手臂里喵喵叫蹭一身毛，杜宾眉头微微一皱，手却诚实地停下键盘，一把将大胖橘捞起抱在大腿上。",
    sweetMoment: "杜宾在外人面前冷峻威严滴水不漏，一回到家脱下大衣，第一句话就是哑着嗓子问：“今天在家有没有想我？”",
    dangerNotice: "杜宾专注搞钱与核心事业时，大胖橘切莫夺命连环催；杜宾再忙也要在微信置顶留句报备，这是大胖橘的安全感底线。",
    secretCode: "“你是杜宾向世界展现利齿后，唯一的软肋与专属退路。”"
  },
  "AESI_DHSI": {
    score: 69,
    tierTitle: "猫鼠拉扯 · 猜忌迷宫修罗场 (B级)",
    synergyTone: "夺命连环追击遇到敏感逃跑冠军的推拉虐恋",
    relationType: "toxic",
    interactionScene: "惊恐飞鼠因为察觉到大胖橘某句话的语气异样，突然钻回树洞关紧房门；大胖橘在门外急得疯狂敲门手都红了：“你到底怎么了！说清楚好不好！”两人的安全感频段完全错位。",
    sweetMoment: "两只小动物终于坦白脆弱的那一晚，在车里抱头哭着倾诉，发现原来彼此都在拼命害怕被对方抛弃。",
    dangerNotice: "一个想用直球逼问安全感，一个用逃避筑起高墙；越逼退得越快，越躲追得越凶，极易两败俱伤。",
    secretCode: "“惊恐飞鼠需要学会直接说‘抱抱我’；大胖橘需要留出10分钟让飞鼠回血的缓冲期。”"
  },
  "DESR_DHCI": {
    score: 95,
    tierTitle: "脱刺疗愈 · 专属松弛感绿洲 (SSS级)",
    synergyTone: "浑身竖刺的清醒小算盘遇到大地般温和的大水豚",
    relationType: "soulmate",
    interactionScene: "防盗铁刺猬在外受了委屈，一身刺竖得像刺刀一样进门冷着脸。卡皮巴拉什么也不追问，默默泡了一杯热可可推到面前，头顶橘子慢吞吞躺在一旁看书，用行动告诉它：这里没有考核与算计。",
    sweetMoment: "铁刺猬终于敢在卡皮巴拉怀里收起所有硬刺，露出了最柔软的粉色小肚皮，安心睡了两个小时的香甜午觉。",
    dangerNotice: "卡皮巴拉的极致佛系有时会被刺猬误解为‘不在乎’，卡皮巴拉需多用切实的拥抱让刺猬明确感知在场。",
    secretCode: "“世间所有的刀枪不入，都在卡皮巴拉的温泉中化为一池春水。”"
  },
  "DHCR_DECR": {
    score: 94,
    tierTitle: "巅峰同盟 · 永不背叛的雪山双王 (SS级)",
    synergyTone: "极度独立理智、顶峰相见的搞钱天花板组合",
    relationType: "soulmate",
    interactionScene: "两个人各自坐在咖啡馆两侧办公，两台笔记本电脑键盘声清脆连成一片，四小时互不打扰。合上电脑那一刻，雪豹递过车钥匙，杜宾接过顺手拉开车门，相视一笑：“走，去吃那家必须排队的黑珍珠。”",
    sweetMoment: "遭遇职场或现实的重大惊涛浪浪时，不需要多余言语，两只强者并肩站立，彼此是最坚不可摧的后背。",
    dangerNotice: "双王都不肯先低头，出现原则分歧时切忌用商业并购般的冷血逻辑复盘对方，爱需要偶尔示弱。",
    secretCode: "“并肩作战而非相互依附，各自闪光却又唯一归巢。”"
  },
  "AECI_DHCI": {
    score: 91,
    tierTitle: "水火欢喜 · 狂暴拆家与无尽温泉 (SS级)",
    synergyTone: "一个精力过载上蹿下跳，一个情绪入土仰泳兜底",
    relationType: "complement",
    interactionScene: "二哈在客厅上蹿下跳展示自己淘到的新玩具，说得口沫横飞眼睛放光；卡皮巴拉头顶橘子泡在沙发一角，安详地微笑着，时不时配合地拍拍两下爪子给予最认真的掌声。",
    sweetMoment: "二哈电量耗尽瘫倒在地毯上的瞬间，卡皮巴拉默默把自己的毛绒肚皮挪过去给它当枕头，一哈一豚静止在黄昏里。",
    dangerNotice: "二哈别嫌弃卡皮巴拉反应慢半拍，卡皮巴拉的平静就是你永不翻船的浮标。",
    secretCode: "“你在地上掀起所有风暴，我卧在水底为你兜住人间。”"
  },
  "DECI_AESR": {
    score: 89,
    tierTitle: "猫狗拉扯 · 高岭渣猫与护食忠犬 (S级)",
    synergyTone: "嘴上说着离我远点，身体却悄悄靠近的傲娇反差",
    relationType: "complement",
    interactionScene: "渣猫踩着高傲的步子走过，冷淡地说：“今天降温，我可不是特意给你拿外套的，顺手而已。”黑柴一把抓过外套搂住渣猫，尾巴摇得像螺旋桨：“只要是你给的我都穿！”",
    sweetMoment: "当有外人试图欺负渣猫时，平时温顺的黑柴立刻龇牙护食冲在最前面，渣猫嘴角微微勾起，悄悄勾住黑柴的爪子。",
    dangerNotice: "渣猫不要频繁把分手或狠话挂在嘴边测试忠诚，黑柴的心也是肉长的。",
    secretCode: "“莫挨老子渣猫的高冷，终究被黑柴犬毫无保留的赤诚所融化。”"
  }
};

export const getSpeciesSynergy = (myKey: string, partnerKey: string): SpeciesSynergyResult => {
  const mySpecies = getSpeciesByKey(myKey);
  const partnerSpecies = getSpeciesByKey(partnerKey);

  const pairKey1 = `${myKey}_${partnerKey}`;
  const pairKey2 = `${partnerKey}_${myKey}`;
  const custom = SPECIAL_SYNERGY_MAP[pairKey1] || SPECIAL_SYNERGY_MAP[pairKey2];

  if (custom) {
    return {
      mySpecies: {
        key: mySpecies.key,
        title: mySpecies.title,
        emoji: mySpecies.emoji,
        mbti: parseSpeciesMBTI(mySpecies.key)
      },
      partnerSpecies: {
        key: partnerSpecies.key,
        title: partnerSpecies.title,
        emoji: partnerSpecies.emoji,
        mbti: parseSpeciesMBTI(partnerSpecies.key)
      },
      score: custom.score,
      tierTitle: custom.tierTitle,
      synergyTone: custom.synergyTone,
      relationType: custom.relationType,
      interactionScene: custom.interactionScene,
      sweetMoment: custom.sweetMoment,
      dangerNotice: custom.dangerNotice,
      secretCode: custom.secretCode
    };
  }

  const isBestMatch = mySpecies.bestMatch.includes(partnerSpecies.key) || partnerSpecies.bestMatch.includes(mySpecies.key);
  const isToxicMatch = mySpecies.toxicMatch.includes(partnerSpecies.key) || partnerSpecies.toxicMatch.includes(mySpecies.key);
  const isMirror = myKey === partnerKey;

  let d1Score = 75;
  if (myKey[0] === partnerKey[0]) {
    d1Score = myKey[0] === 'A' ? 82 : 78;
  } else {
    d1Score = 72;
  }

  let d2Score = 80;
  if (myKey[1] === 'E' && partnerKey[1] === 'E') d2Score = 92;
  else if (myKey[1] !== partnerKey[1]) d2Score = 86;
  else d2Score = 70;

  let d3Score = 80;
  if (myKey[2] !== partnerKey[2]) d3Score = 95;
  else if (myKey[2] === 'C') d3Score = 88;
  else d3Score = 72;

  let d4Score = 82;
  if (myKey[3] === partnerKey[3]) d4Score = myKey[3] === 'I' ? 89 : 91;
  else d4Score = 84;

  let rawScore = Math.round(d1Score * 0.3 + d2Score * 0.25 + d3Score * 0.25 + d4Score * 0.2);

  let relationType: SpeciesSynergyResult['relationType'] = 'balanced';
  if (isBestMatch) {
    rawScore = Math.max(96, Math.min(98, rawScore + 10));
    relationType = 'soulmate';
  } else if (isToxicMatch) {
    rawScore = Math.max(66, Math.min(74, rawScore - 12));
    relationType = 'toxic';
  } else if (isMirror) {
    rawScore = Math.max(83, Math.min(90, rawScore));
    relationType = 'mirror';
  } else if (rawScore >= 88) {
    relationType = 'complement';
  }

  let tierTitle = "互补共生 · 渐入佳境 (S级)";
  if (rawScore >= 95) tierTitle = "灵魂共鸣 · 天作之合 (SSS级)";
  else if (rawScore >= 88) tierTitle = "温情治愈 · 互补港湾 (SS级)";
  else if (rawScore >= 80) tierTitle = "猫狗相缠 · 欢喜冤家 (S级)";
  else if (rawScore >= 75) tierTitle = "频率调试 · 破茧生花 (A级)";
  else tierTitle = "致命相吸 · 磨合修罗场 (B级)";

  const interactionScene = `当【${mySpecies.title}】与【${partnerSpecies.title}】同处一室，${
    isMirror 
      ? `如同照镜子般理解彼此的防御铠甲与心软瞬间，无需多言就能读懂对方微表情背后的信号。`
      : relationType === 'soulmate' || relationType === 'complement'
        ? `一个擅长点燃生活的温度与想象，另一个则如大地般包容所有情绪起伏，在柴米油盐里筑造安稳的安全感。`
        : `两人的性格步调存在明显的节奏差，一个习惯紧迫确认爱意，另一个偏好留有独立回旋余地，每一次交锋都在试探彼此的弹性。`
  }`;

  const sweetMoment = `${
    isBestMatch
      ? `双方在毫无预谋的默契里同时说出同一句话，相视一笑，认定对方就是那个唯一能接住自己全部怪癖的人。`
      : isMirror
        ? `在深夜不用伪装坚强，靠在一起静静听歌，懂得彼此最深处的隐痛与孤单。`
        : `在情绪崩溃或疲惫的关头，一方主动打破原则给予坚定偏爱，瞬间融化了另一方坚守的心防。`
  }`;

  const dangerNotice = `${
    mySpecies.key[0] === 'A' && partnerSpecies.key[0] === 'D'
      ? `切忌陷入“夺命逼问-冷漠回避”的死循环；焦虑方需给对方半小时独处沉淀，回避方必须明确给出回归时间线。`
      : mySpecies.key[1] === 'H' && partnerSpecies.key[1] === 'H'
        ? `切忌冷战与脑内过载推演，任何误解都要在24小时内用文字或语音直球沟通，别让沉默成为感情的休止符。`
        : `尊重彼此截然不同的心理节律，切勿用自己的物种习惯去强行驯化对方，接纳差异才是高级爱意的起点。`
  }`;

  const secretCode = `“理解彼此的物种天性，方能在亲密关系中游刃有余。”`;

  return {
    mySpecies: {
      key: mySpecies.key,
      title: mySpecies.title,
      emoji: mySpecies.emoji,
      mbti: parseSpeciesMBTI(mySpecies.key)
    },
    partnerSpecies: {
      key: partnerSpecies.key,
      title: partnerSpecies.title,
      emoji: partnerSpecies.emoji,
      mbti: parseSpeciesMBTI(partnerSpecies.key)
    },
    score: rawScore,
    tierTitle,
    synergyTone: `${mySpecies.title} × ${partnerSpecies.title} 基因碰撞`,
    relationType,
    interactionScene,
    sweetMoment,
    dangerNotice,
    secretCode
  };
};
