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
  { id: 1, key: "AESI", title: "噬元橘猫", emoji: "🐱", tags: ["#极度粘人", "#直球选手", "#易受惊吓"], bestMatch: "慢热冬眠熊 (AHCR)", toxicMatch: "傲娇曼岛猫 (DECI)" },
  { id: 2, key: "AESR", title: "护食幼狼", emoji: "🐺", tags: ["#双标护短", "#现实主义", "#领地意识"], bestMatch: "筑巢小燕子 (AECR)", toxicMatch: "沙漠耳狐 (DHSI)" },
  { id: 3, key: "AECI", title: "满电海獭", emoji: "🦦", tags: ["#顶级情绪价值", "#六边形战士", "#小太阳"], bestMatch: "噬元橘猫 (AESI)", toxicMatch: "暗夜猫头鹰 (DHSR)" },
  { id: 4, key: "AECR", title: "筑巢小燕子", emoji: "🐦", tags: ["#爹系妈系", "#务实陪伴", "#靠谱担当"], bestMatch: "护食幼狼 (AESR)", toxicMatch: "刺客猞猁 (DESI)" },
  { id: 5, key: "AHSI", title: "剧毒水母", emoji: "🪼", tags: ["#情绪黑洞", "#美丽且危险", "#高敏易碎"], bestMatch: "满电海獭 (AECI)", toxicMatch: "傲娇曼岛猫 (DECI)" },
  { id: 6, key: "AHSR", title: "脆皮洋桔梗", emoji: "🥀", tags: ["#患得患失", "#现实考量", "#极度缺爱"], bestMatch: "慢热冬眠熊 (AHCR)", toxicMatch: "极地白狼 (DECR)" },
  { id: 7, key: "AHCI", title: "幻影变色龙", emoji: "🦎", tags: ["#极致浪漫", "#阴晴不定", "#需要新鲜感"], bestMatch: "噬元橘猫 (AESI)", toxicMatch: "刺客猞猁 (DESI)" },
  { id: 8, key: "AHCR", title: "慢热冬眠熊", emoji: "🐻", tags: ["#稳如泰山", "#默默守护", "#过日子第一名"], bestMatch: "脆皮洋桔梗 (AHSR)", toxicMatch: "沙漠耳狐 (DHSI)" },
  { id: 9, key: "DESI", title: "刺客猞猁", emoji: "🐅", tags: ["#傲娇至死", "#嘴硬心软", "#极度缺爱"], bestMatch: "满电海獭 (AECI)", toxicMatch: "傲娇曼岛猫 (DECI)" },
  { id: 10, key: "DESR", title: "装甲刺猬", emoji: "🦔", tags: ["#人间清醒", "#及时止损", "#防御点满"], bestMatch: "筑巢小燕子 (AECR)", toxicMatch: "剧毒水母 (AHSI)" },
  { id: 11, key: "DECI", title: "傲娇曼岛猫", emoji: "🐈", tags: ["#绝对自我", "#理智得可怕", "#需要空间"], bestMatch: "噬元橘猫 (AESI)", toxicMatch: "刺客猞猁 (DESI)" },
  { id: 12, key: "DECR", title: "极地白狼", emoji: "🐺", tags: ["#生人勿近", "#利益至上", "#慕强"], bestMatch: "装甲刺猬 (DESR)", toxicMatch: "脆皮洋桔梗 (AHSR)" },
  { id: 13, key: "DHSI", title: "沙漠耳狐", emoji: "🦊", tags: ["#听觉雷达", "#细节狂魔", "#难以触及"], bestMatch: "幻影变色龙 (AHCI)", toxicMatch: "护食幼狼 (AESR)" },
  { id: 14, key: "DHSR", title: "暗夜猫头鹰", emoji: "🦉", tags: ["#极致利己", "#暗中观察", "#不见兔子不撒鹰"], bestMatch: "慢热冬眠熊 (AHCR)", toxicMatch: "满电海獭 (AECI)" },
  { id: 15, key: "DHCI", title: "待机水豚", emoji: "🦦", tags: ["#情绪绝缘体", "#万物皆可佛", "#顶级松弛感"], bestMatch: "噬元橘猫 (AESI)", toxicMatch: "沙漠耳狐 (DHSI)" },
  { id: 16, key: "DHCR", title: "冰川雪豹", emoji: "🐆", tags: ["#高岭之花", "#孤独求败", "#极度独立"], bestMatch: "极地白狼 (DECR)", toxicMatch: "噬元橘猫 (AESI)" }
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
    tierTitle: "灵魂共鸣 · 天生饲养员 (SSS级)",
    synergyTone: "高浓度粘人精遇到无底线包容的治愈神仙CP",
    relationType: "soulmate",
    interactionScene: "冬眠熊在沙发上默默切水果，橘猫一屁股坐进怀里，把手机亮给熊看搞笑猫咪视频。熊一边宠溺地递过切好的苹果，一边温厚地揉揉猫脑袋，任由橘猫在自己手臂上蹭来蹭去。",
    sweetMoment: "橘猫半夜做噩梦突然惊醒，还没开口，冬眠熊闭着眼睛就下意识把被子给它掖好，反手搂紧轻拍它的后背：“别怕，我一直都在。”",
    dangerNotice: "橘猫闹脾气时千万别玩失联；冬眠熊需要偶尔有属于自己的洞穴安静时刻，不要把熊的片刻沉默当成感情降温。",
    secretCode: "“冬眠熊提供情绪避风港，橘猫给平淡生活点燃烟花。”"
  },
  "AESI_DECR": {
    score: 92,
    tierTitle: "极限反差 · 孤傲狼王专属偏爱 (SS级)",
    synergyTone: "冰封雪山被一团热烈火焰彻底捂化的反差甜",
    relationType: "complement",
    interactionScene: "白狼在电脑前雷厉风行地敲着商业方案，气场冻结两米八。橘猫不管不顾一头撞进白狼手边撒娇喵喵叫，白狼眉头微微一皱，手却诚实地停下键盘，一把将橘猫捞起放在大腿上抱紧。",
    sweetMoment: "白狼在外人面前威严冷峻滴水不漏，一回到家脱下外套，第一句话就是哑着嗓子问：“今天在家有没有想我？”",
    dangerNotice: "白狼专注搞钱与正事时，橘猫切莫夺命连环催；白狼再忙也要在微信置顶里留一句报备，这是橘猫的续命稻草。",
    secretCode: "“你是狼王向世界展示獠牙后，唯一的软肋与退路。”"
  },
  "AESI_DHSI": {
    score: 69,
    tierTitle: "猫狐拉扯 · 猜忌迷宫修罗场 (B级)",
    synergyTone: "夺命连环追击遇到敏锐捉迷藏大师的推拉虐恋",
    relationType: "toxic",
    interactionScene: "耳狐因为察觉到橘猫某句话的异样，突然躲进房间关紧房门不作声；橘猫在门外疯狂敲门敲到手红，眼泪打转：“你到底怎么了！说清楚好不好！”两人的安全感频段完全错位。",
    sweetMoment: "两只小动物终于坦白脆弱的那一晚，在雨夜车里哭着抱头倾诉，发现原来彼此都在拼命害怕失去对方。",
    dangerNotice: "一个想用直球逼问安全感，一个用后退筑起高墙；越逼退得越快，越躲追得越凶，极易两败俱伤。",
    secretCode: "“耳狐需要学着放下试探直接说‘抱抱我’；橘猫需要给耳狐留出10分钟喘息的真空圈。”"
  },
  "DESR_DHCI": {
    score: 95,
    tierTitle: "脱刺疗愈 · 专属松弛感绿洲 (SSS级)",
    synergyTone: "浑身带刺的小防备遇到大地般温和的大水豚",
    relationType: "soulmate",
    interactionScene: "刺猬在外受了委屈，一身刺竖得像刺刀一样进门冷着脸。水豚什么也不追问，默默泡了一杯热可可推到它面前，旁边放上一块刚烤热的华夫饼，水豚慢吞吞躺在一旁看书，用行动告诉它：这里没有考核。",
    sweetMoment: "刺猬终于敢在水豚怀里收起所有硬刺，露出了最柔软的粉色小肚皮，安心地睡起了长达两小时的午觉。",
    dangerNotice: "水豚的极致松弛有时会被误解为‘不在乎’，水豚需多用切实的肢体拥抱让刺猬明确感知在场。",
    secretCode: "“世间所有的刀枪不入，都在水豚的温水中化为一池春水。”"
  },
  "DHCR_DECR": {
    score: 94,
    tierTitle: "巅峰同盟 · 永不背叛的雪山双王 (SS级)",
    synergyTone: "极度独立理智、顶峰相见的成年人高级爱情",
    relationType: "soulmate",
    interactionScene: "两个人各自坐在咖啡馆两侧办公，两台笔记本电脑键盘声清脆连成一片，四小时互不打扰。合上电脑那一刻，雪豹递过车钥匙，白狼接过顺手拉开车门，相视一笑：“走，去吃那家必须排队的黑珍珠。”",
    sweetMoment: "遭遇生活或职场的重大惊涛骇浪时，不需要言语煽情，两只猛兽并肩站立，彼此是最坚不可摧的后背。",
    dangerNotice: "双王都不肯先低头，出现原则分歧时切忌用商业并购般的冷血逻辑复盘对方，爱需要偶尔示弱。",
    secretCode: "“并肩作战而非相互依附，各自闪光却又唯一归巢。”"
  },
  "AECI_DHCI": {
    score: 91,
    tierTitle: "水系欢喜 · 活力电量与无尽水库 (SS级)",
    synergyTone: "一个上蹿下跳造梦狂欢，一个仰泳兜底提供充电桩",
    relationType: "complement",
    interactionScene: "海獭在客厅蹦蹦跳跳展示自己刚淘到的小贝壳和手办，说得口沫横飞眼睛放光；水豚顶着橘子漂在沙发一角，安详地微笑着，时不时配合地拍拍两下爪子给予最认真的掌声。",
    sweetMoment: "海獭电量耗尽瘫倒在地毯上的瞬间，水豚默默把自己的毛绒肚子挪过去给它当枕头，一人一水獭静止在黄昏里。",
    dangerNotice: "海獭别嫌弃水豚的反应慢半拍，水豚的平静就是你永不沉没的浮标。",
    secretCode: "“你在水面掀起所有浪花，我沉入湖底为你稳固风浪。”"
  },
  "DECI_AESR": {
    score: 89,
    tierTitle: "猫狗双全 · 嘴硬女王与忠犬骑士 (S级)",
    synergyTone: "嘴上说着离我远点，身体却悄悄靠近的甜蜜拉扯",
    relationType: "complement",
    interactionScene: "曼岛猫踩着高傲的步子走过，冷淡地说：“今天降温，我可不是特意给你拿外套的，顺手而已。”幼狼一把抓过外套搂住曼岛猫，尾巴摇得像螺旋桨：“只要是你给的我都穿！”",
    sweetMoment: "当有外人质疑曼岛猫时，平时温驯的幼狼立刻龇牙护短冲在最前面，曼岛猫嘴角微微勾起，悄悄勾住幼狼的小指。",
    dangerNotice: "曼岛猫不要频繁把分手或狠话挂在嘴边测试忠诚，幼狼也是会心碎的忠犬。",
    secretCode: "“高岭之猫的骄傲，终究被幼狼毫无保留的赤诚所降服。”"
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
