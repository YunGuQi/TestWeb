import QRCode from 'qrcode';

export interface CityShareProfile {
  name: string;
  pinyin: string;
  shortKey: string;
  title: string;
  sanctuary: string;
  quote: string;
  defaultTrait: string;
}

// 16 座城市专属画像与短 Key 映射配置（深度契合逃跑车票与文艺隐居调性）
export const CITY_SHARE_PROFILES: Record<string, CityShareProfile> = {
  aletai: {
    name: '阿勒泰',
    pinyin: 'aletai',
    shortKey: 'aletai',
    title: '旷野游侠',
    sanctuary: '禾木夏牧场 · 旷野雪山',
    quote: '去拥抱旷野与雪山，自由才是归宿。',
    defaultTrait: '极致旷野力击败 98.6% 城市脆皮人类'
  },
  shenzhen: {
    name: '深圳',
    pinyin: 'shenzhen',
    shortKey: 'shenzhen',
    title: '破壁进化者',
    sanctuary: '南山云端 · 赛博极客',
    quote: '不设限的人生，每一秒都在升级重构。',
    defaultTrait: '破壁进化力击败 99.1% 城市脆皮人类'
  },
  wuhan: {
    name: '武汉',
    pinyin: 'wuhan',
    shortKey: 'wuhan',
    title: '江汉弄潮儿',
    sanctuary: '武大樱顶 · 江城过早',
    quote: '在热气腾腾的市井里，活出滚烫人生。',
    defaultTrait: '江汉弄潮力击败 96.8% 城市脆皮人类'
  },
  shanghai: {
    name: '上海',
    pinyin: 'shanghai',
    shortKey: 'shanghai',
    title: '摩登理性派',
    sanctuary: '外滩露台 · 摩登天际',
    quote: '在秩序与繁华之间，守住清醒的边界。',
    defaultTrait: '摩登秩序感击败 97.5% 城市脆皮人类'
  },
  changsha: {
    name: '长沙',
    pinyin: 'changsha',
    shortKey: 'changsha',
    title: '不夜热烈客',
    sanctuary: '橘洲江岸 · 不夜星城',
    quote: '人生得意须尽欢，把生活过成热烈庆典。',
    defaultTrait: '高燃尽兴度击败 98.2% 城市脆皮人类'
  },
  dali: {
    name: '大理',
    pinyin: 'dali',
    shortKey: 'dali',
    title: '苍洱漫游家',
    sanctuary: '龙龛码头 · 苍洱晨曦',
    quote: '风花雪月不用等，随时随地开启慢速生活。',
    defaultTrait: '苍洱漫游力击败 98.9% 城市脆皮人类'
  },
  chengdu: {
    name: '成都',
    pinyin: 'chengdu',
    shortKey: 'chengdu',
    title: '巴适生活家',
    sanctuary: '鹤鸣茶社 · 银杏竹椅',
    quote: '生活不用赶路，一杯清茶自得其乐。',
    defaultTrait: '巴适自洽力击败 97.8% 城市脆皮人类'
  },
  beijing: {
    name: '北京',
    pinyin: 'beijing',
    shortKey: 'beijing',
    title: '皇城追梦人',
    sanctuary: '景山万春 · 故宫雪霁',
    quote: '去拥抱红墙白雪，去追逐星辰大海。',
    defaultTrait: '宏大风骨度击败 98.4% 城市脆皮人类'
  },
  hangzhou: {
    name: '杭州',
    pinyin: 'hangzhou',
    shortKey: 'hangzhou',
    title: '宋韵隐逸者',
    sanctuary: '茅家水榭 · 龙井茶园',
    quote: '隐于山水烟雨间，寻得内心宁静自如。',
    defaultTrait: '宋韵隐逸度击败 97.2% 城市脆皮人类'
  },
  suzhou: {
    name: '苏州',
    pinyin: 'suzhou',
    shortKey: 'suzhou',
    title: '姑苏留白客',
    sanctuary: '艺圃漏窗 · 芭蕉听雨',
    quote: '在喧嚣人间，留一处诗意的心灵庭院。',
    defaultTrait: '姑苏留白美击败 96.5% 城市脆皮人类'
  },
  qingdao: {
    name: '青岛',
    pinyin: 'qingdao',
    shortKey: 'qingdao',
    title: '山海微醺客',
    sanctuary: '燕儿悬崖 · 山海微醺',
    quote: '吹过山海的风，喝过最鲜醇的酒。',
    defaultTrait: '山海微醺感击败 97.6% 城市脆皮人类'
  },
  guangzhou: {
    name: '广州',
    pinyin: 'guangzhou',
    shortKey: 'guangzhou',
    title: '西关闲雅客',
    sanctuary: '沙面古榕 · 珠江晚渡',
    quote: '得闲饮茶，凡事慢慢来，人间烟火最抚心。',
    defaultTrait: '西关温润感击败 96.9% 城市脆皮人类'
  },
  chongqing: {
    name: '重庆',
    pinyin: 'chongqing',
    shortKey: 'chongqing',
    title: '赛博江湖客',
    sanctuary: '白象花窗 · 索道江雾',
    quote: '穿梭于魔幻立体山城，笑看风云起伏。',
    defaultTrait: '赛博江湖力击败 98.7% 城市脆皮人类'
  },
  xian: {
    name: '西安',
    pinyin: 'xian',
    shortKey: 'xian',
    title: '盛唐风骨客',
    sanctuary: '明城垛口 · 盛唐夕照',
    quote: '踏过千年城阙，心中自有盛唐万丈豪情。',
    defaultTrait: '盛唐风骨度击败 97.9% 城市脆皮人类'
  },
  sanya: {
    name: '三亚',
    pinyin: 'sanya',
    shortKey: 'sanya',
    title: '蔚蓝浪人',
    sanctuary: '椰梦长廊 · 蔚蓝海潮',
    quote: '让每一阵海浪，带走所有疲惫与焦灼。',
    defaultTrait: '热带自愈力击败 98.3% 城市脆皮人类'
  },
  xiamen: {
    name: '厦门',
    pinyin: 'xiamen',
    shortKey: 'xiamen',
    title: '海岛琴音客',
    sanctuary: '鼓浪深巷 · 海风繁花',
    quote: '海风吹拂琴音回荡，温柔是骨子里的浪漫。',
    defaultTrait: '海风温柔度击败 97.1% 城市脆皮人类'
  }
};

// 城市中文名称到 shortKey 的映射
const NAME_TO_KEY: Record<string, string> = {
  '阿勒泰': 'aletai',
  '深圳': 'shenzhen',
  '武汉': 'wuhan',
  '上海': 'shanghai',
  '长沙': 'changsha',
  '大理': 'dali',
  '成都': 'chengdu',
  '北京': 'beijing',
  '杭州': 'hangzhou',
  '苏州': 'suzhou',
  '青岛': 'qingdao',
  '广州': 'guangzhou',
  '重庆': 'chongqing',
  '西安': 'xian',
  '三亚': 'sanya',
  '厦门': 'xiamen'
};

// 城市 ID 到 shortKey 的映射
const ID_TO_KEY: Record<string, string> = {
  'city_alt': 'aletai',
  'city_sz': 'shenzhen',
  'city_wh': 'wuhan',
  'city_sh': 'shanghai',
  'city_cs': 'changsha',
  'city_dl': 'dali',
  'city_cd': 'chengdu',
  'city_bj': 'beijing',
  'city_hz': 'hangzhou',
  'city_szh': 'suzhou',
  'city_qd': 'qingdao',
  'city_gz': 'guangzhou',
  'city_cq': 'chongqing',
  'city_xa': 'xian',
  'city_sy': 'sanya',
  'city_xm': 'xiamen'
};

/**
 * 获取城市的拼音短 Key（如 dali、aletai）
 */
export function getCityShortKey(city: any): string {
  if (!city) return 'dali';
  if (typeof city === 'string') {
    const trimmed = city.trim().toLowerCase();
    if (CITY_SHARE_PROFILES[trimmed]) return trimmed;
    if (NAME_TO_KEY[city]) return NAME_TO_KEY[city];
    if (ID_TO_KEY[city]) return ID_TO_KEY[city];
  }
  const name = city.name || '';
  if (NAME_TO_KEY[name]) return NAME_TO_KEY[name];
  const id = city.id ? String(city.id) : '';
  if (ID_TO_KEY[id]) return ID_TO_KEY[id];
  const pinyin = city.pinyin ? String(city.pinyin).toLowerCase() : '';
  if (CITY_SHARE_PROFILES[pinyin]) return pinyin;
  return 'dali';
}

/**
 * 根据城市对象或名称获取对应城市分享画像
 */
export function getCityShareProfile(city: any): CityShareProfile {
  const key = getCityShortKey(city);
  return CITY_SHARE_PROFILES[key] || CITY_SHARE_PROFILES.dali;
}

/**
 * 获取正式分享链接的生产域名
 * 当本地 localhost/127.0.0.1 调试时，自动采用正式线上域名，确保发给微信朋友时能真正点开测试
 */
export function getCityShareOrigin(): string {
  if (typeof window === 'undefined') return 'https://test.mutong-xhs.top';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'https://test.mutong-xhs.top';
  }
  return window.location.origin;
}

/**
 * 纯前端本地生成矢量 SVG 二维码
 * 绝不发起任何第三方图片网络请求，杜绝 html-to-image 的 CORS 跨域污染
 */
export async function generateCityQrCodeSvg(text: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return svgString;
  } catch (error) {
    console.error('纯前端二维码生成异常:', error);
    return '';
  }
}

/**
 * 构建高美感、超短语义化分享链接
 * 示例：https://test.mutong-xhs.top/city?share=dali
 */
export function buildCityShareUrl(city: any): string {
  const origin = getCityShareOrigin();
  const shortKey = getCityShortKey(city);
  return `${origin}/city?share=${encodeURIComponent(shortKey)}`;
}

/**
 * 组装契合城市避难所与文艺气质的社交种草文案
 */
export function generateCityShareCopy(city: any, rank?: number, shareUrl?: string): string {
  const profile = getCityShareProfile(city);
  const cityName = city?.name || profile.name;
  const title = city?.title || profile.title;
  const sanctuary = profile.sanctuary;
  const quote = city?.quote || profile.quote;
  const url = shareUrl || buildCityShareUrl(city);

  return `🎫【心灵逃跑计划 · 城市性格测试】
我的灵魂归属地测出来了：【${cityName}】！
🌿 专属避难所：${sanctuary}
✨ 灵魂身份标签：「${title}」
💬 “${quote}”

“逃离格子间与内耗，你的灵魂真正想去哪座城市生活？”
👇 点击查收你的专属车票，测测契合你灵魂的那座城：
${url}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 微信内置浏览器与移动端环境检测
 */
export function isWeChatEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 同步用户手势剪贴板写入（关键：彻底根除微信端异步剪贴板权限失效与系统级报错）
 * 必须在 click 点击事件触发的第一拍同步执行，利用当前用户活跃手势最高权限写入！
 */
export function syncCopyText(text: string): boolean {
  if (typeof window === 'undefined') return false;

  let execSuccess = false;

  // 1. 同步执行 textarea + execCommand 跨端最高兼容兜底（iOS/Android/微信 100% 生效）
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    // 确保 textarea 挂载在视口内但不可见，防止 WebView 判定为 display:none 导致复制失败
    textArea.style.position = 'fixed';
    textArea.style.top = '10px';
    textArea.style.left = '10px';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.padding = '0';
    textArea.style.margin = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    textArea.style.pointerEvents = 'none';
    textArea.style.zIndex = '-999';
    document.body.appendChild(textArea);

    // iOS Safari / 微信 专有选区保护
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.focus();
      textArea.select();
    }

    execSuccess = document.execCommand('copy');
    document.body.removeChild(textArea);
  } catch (err) {
    console.error('同步剪贴板写入失败:', err);
  }

  // 2. 如果在普通现代浏览器中且 execCommand 未成功，尝试 Clipboard API（严防在微信中调用）
  if (!execSuccess && !isWeChatEnvironment() && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      navigator.clipboard.writeText(text).catch((e) => {
        console.warn('异步写入捕获:', e);
      });
    } catch (e) {}
  }

  return execSuccess;
}

/**
 * 跨端剪贴板写入纯文本（兼容包装）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  return syncCopyText(text);
}

/**
 * 图文双全剪贴板写入：将种草文案与高清车票海报图片一同写入系统剪贴板
 * 在富文本窗口（如 PC 微信、飞书、QQ、邮件）粘贴时，图文并茂一同呈现；在纯文本窗口粘贴时，自动提取文案与链接
 */
export async function copyImageAndTextToClipboard(
  dataUrl: string,
  text: string
): Promise<{ hasImage: boolean; hasText: boolean }> {
  if (typeof window === 'undefined') return { hasImage: false, hasText: false };

  // 核心风控：在移动端或微信内置浏览器环境下，操作系统底层不支持剪贴板图文混合粘贴，
  // 且微信内核在异步状态下调用 clipboard.write 会强行弹窗拦截并提示“未能复制到剪切板”。
  // 因此移动端/微信端在第一拍已由 syncCopyText 稳妥保注文案，此处直接静默返回。
  if (isWeChatEnvironment() || isMobileDevice()) {
    return { hasImage: false, hasText: true };
  }

  const htmlContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111;">
  <div style="white-space: pre-wrap; font-size: 14px; margin-bottom: 12px; font-weight: bold;">${escapeHtml(text)}</div>
  <div style="margin-top: 8px;">
    <img src="${dataUrl}" alt="心灵逃跑车票海报" style="max-width: 100%; border: 1px solid #d1cdc1; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
  </div>
</div>`.trim();

  // 1. 优先使用标准 ClipboardItem 写入 text/html + text/plain
  // 桌面端必须使用 text/html + text/plain 组合，Windows 微信检测到此组合可直接粘贴图文
  if (navigator.clipboard && window.isSecureContext && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        })
      ]);
      return { hasImage: true, hasText: true };
    } catch (err) {
      console.warn('ClipboardItem 写入异常，尝试 DOM 选区兼容方案:', err);
    }
  }

  // 2. 兜底方案：富文本选区 execCommand 复制（支持旧版 PC 浏览器）
  try {
    const container = document.createElement('div');
    container.setAttribute('contenteditable', 'true');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-9999px';
    container.style.opacity = '0';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const successful = document.execCommand('copy');
    sel?.removeAllRanges();
    document.body.removeChild(container);

    if (successful) {
      return { hasImage: true, hasText: true };
    }
  } catch (domErr) {
    console.warn('DOM 图文复制降级失败:', domErr);
  }

  // 3. 最终兜底纯文本
  const textSuccess = syncCopyText(text);
  return { hasImage: false, hasText: textSuccess };
}
