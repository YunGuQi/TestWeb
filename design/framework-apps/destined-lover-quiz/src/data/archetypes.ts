export interface Archetype {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  analysis: string;
  quote: string;
  radar: {
    pragmatic: number; // P
    possessive: number; // D
    romantic: number; // R
    action: number; // C
  };
}

export const archetypes: Record<string, Archetype> = {
  "RDS": {
    id: "RDS",
    title: "云端造梦师",
    subtitle: "极光般的灵魂偏爱者",
    tags: ["双向奔赴", "宿命感", "极度护短"],
    analysis: "你在感情里是一个绝对的纯爱战神。你需要的不是搭伙过日子，而是那种“我在千万人中唯独看见了你”的宿命感。你的命定恋人，一定是个心思极其细腻、能读懂你微表情的人。他会为你制造意想不到的浪漫，并且在你患得患失时，提供排山倒海般的安全感。",
    quote: "“我要的不是你权衡利弊后的选择，而是你非我不可的本能。”",
    radar: {
      pragmatic: 30,
      possessive: 95,
      romantic: 95,
      action: 30,
    },
  },
  "RDC": {
    id: "RDC",
    title: "治愈系金毛",
    subtitle: "全天候的情绪充电宝",
    tags: ["贴贴狂魔", "日常浪漫", "超高浓度"],
    analysis: "对你来说，太深奥的哲学问题不如一个下雨天的拥抱来得实在。你的命定恋人是一个极具“人夫/人妻感”的人，他脾气温和，有点黏人，喜欢和你一起在厨房捣鼓新菜，会在纪念日给你准备亲手做的礼物。你们的恋爱就像一部高甜度的日常番。",
    quote: "“比起虚无缥缈的永远，我更贪恋此刻有你在的每一秒。”",
    radar: {
      pragmatic: 30,
      possessive: 95,
      romantic: 95,
      action: 95,
    },
  },
  "RIS": {
    id: "RIS",
    title: "灵魂流浪者",
    subtitle: "孤岛间的精神引路人",
    tags: ["智性恋", "边界感", "柏拉图"],
    analysis: "你是一只特立独行的猫，你需要极大的个人空间，但这不代表你不需要爱。你的命定恋人，一定是个在精神世界能与你势均力敌的高手。你们不需要天天黏在一起，但你们能对同一本书、同一部电影产生强烈的共鸣。他懂你的欲言又止，也尊重你的忽冷忽热。",
    quote: "“两个完整的灵魂相遇，不是为了互相填补，而是为了并肩看星星。”",
    radar: {
      pragmatic: 30,
      possessive: 30,
      romantic: 95,
      action: 30,
    },
  },
  "RIC": {
    id: "RIC",
    title: "限时赏味派",
    subtitle: "游走人间的潇洒玩伴",
    tags: ["及时行乐", "拒绝内耗", "松弛感"],
    analysis: "你对待感情有一种迷人的松弛感。你的命定恋人是一个非常会玩、极具幽默感的人。他不会用沉重的承诺来绑架你，而是带你去尝试各种新鲜事物，去跳伞、去潜水、去午夜狂欢。你们是最好的恋人，也是最合拍的玩伴。",
    quote: "“爱在当下，绝不拖泥带水，我们只收集快乐。”",
    radar: {
      pragmatic: 30,
      possessive: 30,
      romantic: 95,
      action: 95,
    },
  },
  "PDS": {
    id: "PDS",
    title: "专属避风港",
    subtitle: "带着烟火气的灵魂解药",
    tags: ["双强救赎", "细节控", "反差萌"],
    analysis: "你是一个在外面可以独当一面的狠角色，但内心其实有一块非常柔软、渴望被接住的地方。你的命定恋人，在现实中是个能力很强的人，但他唯独对你展现出温柔。他不仅能在事业上给你中肯的建议，更能敏锐地察觉到你伪装下的疲惫，给你一个安稳的后背。",
    quote: "“在世界面前我是坚硬的盔甲，在你面前我只想做回小孩。”",
    radar: {
      pragmatic: 95,
      possessive: 95,
      romantic: 30,
      action: 30,
    },
  },
  "PDC": {
    id: "PDC",
    title: "人间烟火客",
    subtitle: "柴米油盐里的掌舵人",
    tags: ["顾家型", "安全感满级", "精打细算"],
    analysis: "你是一个活得很通透的人，你知道玫瑰会枯萎，但面包可以填饱肚子。你的命定恋人是一个非常有责任心、情绪极其稳定的人。他可能不会说甜言蜜语，但他会把工资卡交给你，会修家里的水管，会规划好你们未来的每一步。他给的爱，是看得见摸得着的踏实。",
    quote: "“最好的我爱你，就是余生的每一顿饭，我都想和你一起吃。”",
    radar: {
      pragmatic: 95,
      possessive: 95,
      romantic: 30,
      action: 95,
    },
  },
  "PIS": {
    id: "PIS",
    title: "高阶智性恋",
    subtitle: "顶峰相见的人生合伙人",
    tags: ["慕强", "势均力敌", "理性至上"],
    analysis: "你非常清楚自己要什么，绝不会在垃圾堆里找对象。你的命定恋人，一定是个在某个领域闪闪发光的大佬。你们的相处模式像极了顶级合伙人，感情中没有歇斯底里的狗血，只有遇到问题解决问题的默契。你们互相欣赏，互相成就，共同跨越人生的阶层。",
    quote: "“爱情不是谁依附谁，而是两棵树的并排站立。”",
    radar: {
      pragmatic: 95,
      possessive: 30,
      romantic: 30,
      action: 30,
    },
  },
  "PIC": {
    id: "PIC",
    title: "顶级生活搭子",
    subtitle: "无缝衔接的完美齿轮",
    tags: ["情绪稳定", "边界清晰", "默契度满分"],
    analysis: "你不喜欢复杂的内耗，你觉得恋爱就该是让生活变得更轻松的润滑剂。你的命定恋人是一个相处起来极度舒服的人。你们都有各自的工作和圈子，但回到家就能无缝切换回轻松模式。他不会干涉你的决定，你们在大事上有商有量，小事上互不计较。",
    quote: "“没有那么多轰轰烈烈，只有刚刚好的舒服与自在。”",
    radar: {
      pragmatic: 95,
      possessive: 30,
      romantic: 30,
      action: 95,
    },
  }
};
