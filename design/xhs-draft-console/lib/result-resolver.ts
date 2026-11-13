export interface ResultLabel {
  code: string;
  name: string;
  full: string;
  badgeVariant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

/** 1. 大女主觉醒自测 (family-origin / dnvzhu) */
export const DNVZHU_PROFILES: Record<string, string> = {
  r1: '内核超稳的满级大女主',
  r2: '带刺盛开的傲骨黑莲花',
  r3: '清冷清醒的结界女王',
  r4: '优雅自渡的暗夜蔷薇',
  r5: '气场全开的六边形女王',
  r6: '不被驯化的破茧大女主',
};

/** 2. 深度情绪内耗测试 (emo) */
export const EMO_PROFILES: Record<string, string> = {
  low: '人间铁壁',
  r_low: '人间铁壁',
  bnd: '精神守财奴',
  r_bnd: '精神守财奴',
  sen: '薛定谔的敏感',
  r_sen: '薛定谔的敏感',
  pls: '心软神明降临',
  r_pls: '心软神明降临',
  rum: '深夜复盘家',
  r_rum: '深夜复盘家',
  sen_pls: '情绪海绵',
  r_sen_pls: '情绪海绵',
  sen_bnd: '灵魂透支大户',
  r_sen_bnd: '灵魂透支大户',
  rum_sen: '自我PUA带师',
  r_rum_sen: '自我PUA带师',
  rum_pls: '完美主义囚徒',
  r_rum_pls: '完美主义囚徒',
  high: '情绪核反应堆',
  r_high: '情绪核反应堆',
};

/** 3. 命定恋人测试 (destiny-lover) */
export const DESTINY_LOVER_PROFILES: Record<string, string> = {
  ldar: '炽热破风者',
  ldap: '傲娇护短狂魔',
  ldcr: '铁腕执棋人',
  ldcp: '生活规划家',
  lsar: '破冰直球手',
  lsap: '沉稳造梦师',
  lscr: '顶峰并肩者',
  lscp: '清冷隐世策士',
  gdar: '浪漫策动者',
  gdap: '人间主心骨',
  gdcr: '灵魂掌舵官',
  gdcp: '全知观测者',
  gsar: '随性冒险家',
  gsap: '宿命羁绊者',
  gscr: '极智引航员',
  gscp: '深海守护者',
};

/** 4. 恋爱物种领养中心 (love-species) */
export const LOVE_SPECIES_PROFILES: Record<string, string> = {
  aesi: '噬元橘猫',
  aesr: '护食幼狼',
  aeci: '满电海獭',
  aecr: '筑巢小燕子',
  ahsi: '剧毒水母',
  ahsr: '脆皮洋桔梗',
  ahci: '幻影变色龙',
  ahcr: '慢热冬眠熊',
  desi: '刺客猞猁',
  desr: '装甲刺猬',
  deci: '傲娇曼岛猫',
  decr: '潜航黑鲸',
  dhsi: '假笑狐狸',
  dhsr: '隐形考拉',
  dhci: '独行雪豹',
  dhcr: '极地企鹅',
  rare_cat_turtle: '逆转猫猫龟',
  rare_white_wolf: '月夜踏雪白狼',
};

/** 5. 性格城市匹配 (city) */
export const CITY_PROFILES: Record<string, string> = {
  '深圳': '效率先锋 · 破壁极客（深圳）',
  '上海': '摩登梧桐 · 秩序造梦家（上海）',
  '北京': '红墙风骨 · 宏大叙事者（北京）',
  '广州': '西关温润 · 踏实烟火客（广州）',
  '成都': '锦官慢煮 · 巴适隐居客（成都）',
  '重庆': '8D雾都 · 赛博江湖客（重庆）',
  '长沙': '湘江不夜 · 燥热娱乐家（长沙）',
  '武汉': '码头热浪 · 韧性搏击者（武汉）',
  '杭州': '湖山数字 · 诗意造风者（杭州）',
  '苏州': '姑苏慢织 · 雅致守望者（苏州）',
  '大理': '苍山去向 · 旷野引力场（大理）',
  '阿勒泰': '雪原自由 · 纯粹追风者（阿勒泰）',
  '青岛': '浪涌麦香 · 豁达逐浪客（青岛）',
  '厦门': '琴岛海风 · 悠然守白者（厦门）',
  '西安': '长安厚土 · 沉静守夜人（西安）',
  '三亚': '椰林烈日 · 逃逸避风港（三亚）',
};

/** 全量合并默认字典 */
export const GLOBAL_FALLBACK_PROFILES: Record<string, string> = {
  ...DNVZHU_PROFILES,
  ...EMO_PROFILES,
  ...DESTINY_LOVER_PROFILES,
  ...LOVE_SPECIES_PROFILES,
  ...CITY_PROFILES,
};

/**
 * 纯函数：根据卡片信息与映射表解析画像标签
 */
export function resolveResultLabel(
  card: { id?: string; cardId?: string; meta?: any; title?: string },
  resultMap: Record<string, string> = {},
  goodsKeyword?: string
): ResultLabel {
  const cardId = card.cardId || card.id || card.meta?.cardId || '';
  const metaFields =
    card.meta?.fields ||
    (card.meta && typeof card.meta === 'object' && !('fields' in card.meta)
      ? (card.meta as Record<string, string>)
      : {});
  const metaResult = ((metaFields['结果'] || metaFields['result']) || '').trim();

  let code = '';
  let name = '';

  // 1. 从 cardId 提取候选 code (如 r1_m2 -> r1; emo_low_m1 -> low; AESI_m3 -> AESI)
  if (cardId) {
    const idMatch = cardId.match(/^([a-zA-Z0-9_\-]+?)(?:_m\d+)?$/i);
    if (idMatch) {
      code = idMatch[1];
    } else {
      code = cardId;
    }
  }

  // 2. 检查 metaResult：若 metaResult 本身就是中文名称（如 "内核超稳的满级大女主"）
  if (metaResult && /[\u4e00-\u9fa5]/.test(metaResult)) {
    name = metaResult.replace(/[【】]/g, '').trim();
    if (!code) code = 'r1';
  } else if (metaResult) {
    // metaResult 为简码（如 "r1"）
    code = metaResult;
  }

  // 3. 查 resultMap 映射表
  if (!name && code) {
    name =
      resultMap[code] ||
      resultMap[code.toLowerCase()] ||
      resultMap[code.replace(/^emo_/i, '')] ||
      '';
  }

  // 4. 查兜底全局字典
  if (!name && code) {
    name =
      GLOBAL_FALLBACK_PROFILES[code] ||
      GLOBAL_FALLBACK_PROFILES[code.toLowerCase()] ||
      GLOBAL_FALLBACK_PROFILES[code.replace(/^emo_/i, '')] ||
      GLOBAL_FALLBACK_PROFILES[code.replace(/^emo_/i, '').toLowerCase()] ||
      '';
  }

  // 5. 若仍未匹配，尝试在标题或商品词中寻找城市名或画像关键词匹配
  const searchCorpus = `${card.title || ''} ${goodsKeyword || ''}`;
  if (!name && searchCorpus.trim()) {
    for (const city of Object.keys(CITY_PROFILES)) {
      if (searchCorpus.includes(city)) {
        code = city;
        name = CITY_PROFILES[city];
        break;
      }
    }
  }

  // 6. 构造最终输出
  if (!code && !name) {
    return { code: '', name: '通用画像', full: '通用画像', badgeVariant: 'slate' };
  }

  if (code && !name) {
    return { code, name: code, full: code, badgeVariant: 'slate' };
  }

  if (!code && name) {
    return { code: '', name, full: name, badgeVariant: 'purple' };
  }

  // 兼有 code 与 name
  const full = `${code} · ${name}`;

  // 根据 code 分配色彩系
  let variant: ResultLabel['badgeVariant'] = 'purple';
  const c = code.toLowerCase();
  if (c.startsWith('r1') || c === 'low' || c.startsWith('ld') || c.startsWith('ae')) {
    variant = 'purple';
  } else if (c.startsWith('r2') || c === 'bnd' || c.startsWith('ls') || c.startsWith('ah')) {
    variant = 'blue';
  } else if (c.startsWith('r3') || c === 'sen' || c.startsWith('gd') || c.startsWith('de')) {
    variant = 'emerald';
  } else if (c.startsWith('r4') || c === 'pls' || c.startsWith('gs') || c.startsWith('dh')) {
    variant = 'amber';
  } else if (c.startsWith('r5') || c.startsWith('r6') || c === 'rum' || c === 'high') {
    variant = 'rose';
  } else {
    variant = 'purple';
  }

  return { code, name, full, badgeVariant: variant };
}
