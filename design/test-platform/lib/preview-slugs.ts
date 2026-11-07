/**
 * 混淆短 Slug 映射表与双向解析工具（单一真源）
 * 封堵通过明文参数（如 ?name=上海、?id=low）字典遍历核心付费资产的漏洞
 */

// 16 核心城市确定性短 Slug 映射
export const CITY_SLUG_MAP: Record<string, string> = {
  '深圳': 'c_sz8a1f',
  '上海': 'c_sh3e91',
  '北京': 'c_bj7d2a',
  '成都': 'c_cd5f8c',
  '广州': 'c_gz2b4e',
  '杭州': 'c_hz9a63',
  '武汉': 'c_wh1c70',
  '南京': 'c_nj4e82',
  '重庆': 'c_cq6b39',
  '西安': 'c_xa0f51',
  '长沙': 'c_cs8d14',
  '厦门': 'c_xm3a97',
  '青岛': 'c_qd7c28',
  '昆明': 'c_km5e60',
  '大理': 'c_dl2f43',
  '阿勒泰': 'c_alt918',
  // 兼顾截图工具扩展城市
  '苏州': 'c_sz4e12',
  '三亚': 'c_sy9a84'
};

// 城市 ID 至中文名辅助映射
const CITY_ID_TO_NAME: Record<string, string> = {
  'city_sz': '深圳',
  'city_sh': '上海',
  'city_bj': '北京',
  'city_cd': '成都',
  'city_gz': '广州',
  'city_hz': '杭州',
  'city_wh': '武汉',
  'city_nj': '南京',
  'city_cq': '重庆',
  'city_xa': '西安',
  'city_cs': '长沙',
  'city_xm': '厦门',
  'city_qd': '青岛',
  'city_km': '昆明',
  'city_dl': '大理',
  'city_alt': '阿勒泰'
};

// 情绪内耗画像确定性短 Slug 映射（包含工单 02 规定的 10 核心画像及题库既有画像）
export const EMO_SLUG_MAP: Record<string, string> = {
  'low': 'e_lw839b',
  'high': 'e_hg102a',
  'rum': 'e_rm4c77',
  'anx': 'e_ax920e',
  'ple': 'e_pl381f',
  'bnd': 'e_bd645c',
  'perf': 'e_pf278a',
  'emp': 'e_ep590d',
  'comp': 'e_cp134e',
  'exp': 'e_xp862a',
  // 题库与结果库 lib/data.ts 扩展画像
  'sen': 'e_sn710b',
  'pls': 'e_ps824d',
  'sen_pls': 'e_sp931a',
  'rum_low_bnd': 'e_rlb452',
  'burnout': 'e_bn619c',
  'isolated': 'e_is204e',
  'perfectionist_freeze': 'e_pf385a',
  'social_chameleon': 'e_sc492b',
  'invisible_gladiator': 'e_ig503c',
  'overthinker_radar': 'e_or614d',
  'silent_absorber': 'e_sa725e',
  'chaos_navigator': 'e_cn836f'
};

// 反查映射表
const SLUG_TO_CITY_MAP: Record<string, string> = Object.entries(CITY_SLUG_MAP).reduce((acc, [cityName, slug]) => {
  acc[slug.toLowerCase()] = cityName;
  return acc;
}, {} as Record<string, string>);

const SLUG_TO_EMO_MAP: Record<string, string> = Object.entries(EMO_SLUG_MAP).reduce((acc, [emoKey, slug]) => {
  acc[slug.toLowerCase()] = emoKey;
  return acc;
}, {} as Record<string, string>);

/**
 * 根据 Slug 反查城市中文名称
 */
export function resolveCityFromSlug(slug?: string | null): string | null {
  if (!slug || typeof slug !== 'string') return null;
  const normalized = slug.trim().toLowerCase();
  return SLUG_TO_CITY_MAP[normalized] || null;
}

/**
 * 根据城市名称或 ID 获取混淆 Slug
 */
export function getSlugByCityName(cityName: string): string | null {
  if (!cityName || typeof cityName !== 'string') return null;
  const trimmed = cityName.trim();
  if (CITY_SLUG_MAP[trimmed]) return CITY_SLUG_MAP[trimmed];
  const mappedName = CITY_ID_TO_NAME[trimmed];
  if (mappedName && CITY_SLUG_MAP[mappedName]) return CITY_SLUG_MAP[mappedName];
  return null;
}

/**
 * 根据 Slug 反查情绪画像 Key
 */
export function resolveEmoFromSlug(slug?: string | null): string | null {
  if (!slug || typeof slug !== 'string') return null;
  const normalized = slug.trim().toLowerCase();
  return SLUG_TO_EMO_MAP[normalized] || null;
}

/**
 * 根据情绪画像 Key 获取混淆 Slug
 */
export function getSlugByEmoKey(emoKey: string): string | null {
  if (!emoKey || typeof emoKey !== 'string') return null;
  const trimmed = emoKey.trim();
  return EMO_SLUG_MAP[trimmed] || null;
}
