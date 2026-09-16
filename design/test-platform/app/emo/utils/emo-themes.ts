/**
 * EMO 情绪内耗测试结果画像专属个性化视觉主题系统
 * 对标 City 测试的专属主题系统，为 10 大核心情绪画像量身定制：
 * 纸张质感、字色层级、财务防伪出纳钢印与进度条渐变。
 * 遵循设计规范：鉴定结果框、标签胶囊、核心勋章框与内条一律保持纯黑色（bg-black / border-black），
 * 确保硬核波普小票质感与高识别度。
 */

export interface EmoStampConfig {
  border: string;      // 钢印边框与文字颜色 (Tailwind)
  title: string;       // 顶部英文标题
  sub: string;         // 中文核心印文
  taxCode: string;     // 底部税号/认证代码
  rotate?: string;     // 旋转角度 (默认 rotate-12)
}

export interface EmoThemeConfig {
  key: string;
  name: string;
  paperBg: string;         // 卡纸背景色 (Tailwind)
  paperHex: string;        // 导出长图时的实色 hex (htmlToImage 防止四周白边)
  outerContainer: string;  // 最外层复古小票包裹框与投影（保持黑色硬朗）
  textMain: string;        // 主文本字色
  textSecondary: string;   // 辅助说明字色
  divider: string;         // 实线分割线（保持黑色）
  dashedDivider: string;   // 虚线分割线
  tearStyle: string;       // 顶部/底部撕裂齿孔边线
  stamp: EmoStampConfig;   // 专属防伪出纳印戳
  titleBadge: string;      // 结果主标题徽章底色与字色（保持黑色）
  tagBadge: string;        // 标签胶囊样式（保持黑色）
  medalCard: string;       // 核心正向天赋高光击败勋章卡（保持黑边框）
  medalBadge: string;      // 勋章内嵌条带（保持黑色）
  barGradient: string;     // 6 维常模击败进度条渐变色
  barTrack: string;        // 进度条轨道
  quoteBox: string;        // 深度心理侧写与金句框（保持黑边框）
  quoteBadge: string;      // 侧写与金句模块标题小标签（保持黑色）
  headerNotice: string;    // 顶部终端/小票副标提示条
}

// 统一黑色框核心规范
const UNIFIED_BLACK_BLOCKS = {
  outerContainer: 'bg-black border-2 border-black shadow-[3px_3px_0px_#000]',
  titleBadge: 'bg-black text-white shadow-sm',
  tagBadge: 'bg-black text-white',
  medalCard: 'bg-[#fdf8ee] border-2 border-black shadow-[2px_2px_0px_#000]',
  medalBadge: 'bg-black text-white',
  divider: 'border-b-2 border-black',
  dashedDivider: 'border-b-2 border-dashed border-gray-400',
  tearStyle: 'border-t-2 border-dashed border-gray-400',
  barTrack: 'w-full h-1.5 border border-black bg-white',
  quoteBox: 'border-2 border-black bg-white shadow-[2.5px_2.5px_0px_#000]',
  quoteBadge: 'bg-black text-white',
  headerNotice: 'bg-gray-100 text-black border border-dashed border-gray-400'
};

// 默认兜底主题（经典复古热敏黑白灰）
export const DEFAULT_EMO_THEME: EmoThemeConfig = {
  key: 'default',
  name: '经典情绪小票',
  paperBg: 'bg-[#fefdfb]',
  paperHex: '#fefdfb',
  ...UNIFIED_BLACK_BLOCKS,
  textMain: 'text-black',
  textSecondary: 'text-gray-500',
  stamp: {
    border: 'border-red-600 text-red-600 bg-red-500/5',
    title: 'PAID IN FULL',
    sub: '已全额扣缴',
    taxCode: 'EMO-TAX 2024',
    rotate: 'rotate-12'
  },
  barGradient: 'bg-gradient-to-r from-gray-900 to-gray-600'
};

// 10 大情绪画像专属主题字典
export const EMO_THEMES: Record<string, EmoThemeConfig> = {
  // 1. 【人间铁壁】: 极简冷感工业钛银白底，冷钢青蓝字，零内耗绝缘钢印
  low: {
    key: 'low',
    name: '人间铁壁',
    paperBg: 'bg-[#f5f7fa]',
    paperHex: '#f5f7fa',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#0f172a]',
    textSecondary: 'text-slate-500',
    stamp: {
      border: 'border-[#0284c7] text-[#0284c7] bg-sky-500/10',
      title: 'ZERO FRICTION',
      sub: '绝缘认证 · 零内耗',
      taxCode: 'ARMOR-PASS 2024',
      rotate: 'rotate-12'
    },
    barGradient: 'bg-gradient-to-r from-slate-900 to-sky-600'
  },

  // 2. 【精神守财奴】: 复古美钞防伪微米金底色，深墨绿字，止损入库印
  bnd: {
    key: 'bnd',
    name: '精神守财奴',
    paperBg: 'bg-[#fbf9f1]',
    paperHex: '#fbf9f1',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#143622]',
    textSecondary: 'text-[#3d5a45]',
    stamp: {
      border: 'border-[#15803d] text-[#15803d] bg-emerald-500/10',
      title: 'ENERGY VAULT',
      sub: '止损入库 · 拒贴补',
      taxCode: 'BND-SAFE 2024',
      rotate: 'rotate-6'
    },
    barGradient: 'bg-gradient-to-r from-[#143622] to-[#16a34a]'
  },

  // 3. 【灵魂透支大户】: 赤红警报破防粉白底，猩红主字色，赤字爆表印
  high: {
    key: 'high',
    name: '灵魂透支大户',
    paperBg: 'bg-[#fff5f5]',
    paperHex: '#fff5f5',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#7f1d1d]',
    textSecondary: 'text-[#991b1b]/80',
    stamp: {
      border: 'border-red-600 text-red-600 bg-red-600/10',
      title: 'OVERLOAD CRISIS',
      sub: '赤字爆表 · 强制停机',
      taxCode: 'EMO-BANKRUPT',
      rotate: 'rotate-12'
    },
    barGradient: 'bg-gradient-to-r from-red-900 to-rose-600'
  },

  // 4. 【深夜复盘家】: 凌晨月光冷灰蓝底，深海藏青字，凌晨复盘印
  rum: {
    key: 'rum',
    name: '深夜复盘家',
    paperBg: 'bg-[#f0f4f9]',
    paperHex: '#f0f4f9',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#0f2744]',
    textSecondary: 'text-slate-500',
    stamp: {
      border: 'border-[#1d4ed8] text-[#1d4ed8] bg-blue-600/10',
      title: 'MIDNIGHT LOG',
      sub: '凌晨复盘 · 耗能过载',
      taxCode: 'RUM-AUDIT 03:47',
      rotate: 'rotate-6'
    },
    barGradient: 'bg-gradient-to-r from-[#0f2744] to-[#3b82f6]'
  },

  // 5. 【薛定谔的敏感】: 赛博故障电波微紫白底，电光紫黑字，雷达预警印
  sen: {
    key: 'sen',
    name: '薛定谔的敏感',
    paperBg: 'bg-[#fbf7ff]',
    paperHex: '#fbf7ff',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#3b0764]',
    textSecondary: 'text-purple-600/80',
    stamp: {
      border: 'border-[#7e22ce] text-[#7e22ce] bg-purple-600/10',
      title: 'RADAR LOCK',
      sub: '雷达预警 · 局部破防',
      taxCode: 'SEN-ALERT 2024',
      rotate: '-rotate-6'
    },
    barGradient: 'bg-gradient-to-r from-[#3b0764] to-[#a855f7]'
  },

  // 6. 【老好人提款机 / 心软神明】: 暖杏落日治愈黄底，焦糖暖褐字，无限垫付印
  pls: {
    key: 'pls',
    name: '心软神明降临',
    paperBg: 'bg-[#fdf8f3]',
    paperHex: '#fdf8f3',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#431407]',
    textSecondary: 'text-[#7c2d12]',
    stamp: {
      border: 'border-[#ea580c] text-[#ea580c] bg-orange-500/10',
      title: 'ALTRUIST TAX',
      sub: '无限垫付 · 亟待退税',
      taxCode: 'SOFT-HEART 2024',
      rotate: 'rotate-12'
    },
    barGradient: 'bg-gradient-to-r from-[#431407] to-[#ea580c]'
  },

  // 7. 【情绪海绵】: 潮湿水雾透支浅青底，深苔绿字，蓄水超载印
  sen_pls: {
    key: 'sen_pls',
    name: '情绪海绵',
    paperBg: 'bg-[#f0f7f5]',
    paperHex: '#f0f7f5',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#064e3b]',
    textSecondary: 'text-[#047857]',
    stamp: {
      border: 'border-[#059669] text-[#059669] bg-emerald-600/10',
      title: 'SPONGE HEAVY',
      sub: '蓄水超载 · 能量饱和',
      taxCode: 'EMO-SOAK 2024',
      rotate: '-rotate-12'
    },
    barGradient: 'bg-gradient-to-r from-[#064e3b] to-[#10b981]'
  },

  // 8. 【自我PUA带师】: 炭黑素描灰白底，玄黑深炭字，过度自省印
  rum_low_bnd: {
    key: 'rum_low_bnd',
    name: '自我PUA带师',
    paperBg: 'bg-[#f5f5f4]',
    paperHex: '#f5f5f4',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#1c1917]',
    textSecondary: 'text-stone-500',
    stamp: {
      border: 'border-stone-800 text-stone-900 bg-stone-500/10',
      title: 'SELF CRITIQUE',
      sub: '过度自省 · 苛责扣款',
      taxCode: 'INNER-PUA 2024',
      rotate: 'rotate-12'
    },
    barGradient: 'bg-gradient-to-r from-[#1c1917] to-stone-500'
  },

  // 9. 【工伤级脆皮打工人】: 仓促工位便利贴牛皮黄底，焦浓缩咖啡褐字，工伤核准印
  burnout: {
    key: 'burnout',
    name: '工伤级打工人',
    paperBg: 'bg-[#fcf8ec]',
    paperHex: '#fcf8ec',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#3e2723]',
    textSecondary: 'text-[#5d4037]',
    stamp: {
      border: 'border-[#795548] text-[#795548] bg-amber-800/10',
      title: 'WORK BURNOUT',
      sub: '工伤核准 · 精神负债',
      taxCode: '996-INJURY 2024',
      rotate: 'rotate-6'
    },
    barGradient: 'bg-gradient-to-r from-[#3e2723] to-[#8d6e63]'
  },

  // 10. 【情绪断电绝缘体】: 极地冰川冷静冰蓝白底，群青冷字，断联免扰印
  isolated: {
    key: 'isolated',
    name: '情绪断电绝缘体',
    paperBg: 'bg-[#f4f9fc]',
    paperHex: '#f4f9fc',
    ...UNIFIED_BLACK_BLOCKS,
    textMain: 'text-[#0c4a6e]',
    textSecondary: 'text-sky-600/80',
    stamp: {
      border: 'border-[#0284c7] text-[#0284c7] bg-sky-500/10',
      title: 'DISCONNECTED',
      sub: '断联免扰 · 绝对防御',
      taxCode: 'ISOLATION-ZERO',
      rotate: '-rotate-6'
    },
    barGradient: 'bg-gradient-to-r from-[#0c4a6e] to-[#0ea5e9]'
  }
};

/**
 * 依据画像 key 提取对应的主题配置，带健全容错
 */
export function getEmoTheme(key?: string): EmoThemeConfig {
  if (!key) return DEFAULT_EMO_THEME;
  const normalizedKey = key.trim().toLowerCase();
  return EMO_THEMES[normalizedKey] || DEFAULT_EMO_THEME;
}
