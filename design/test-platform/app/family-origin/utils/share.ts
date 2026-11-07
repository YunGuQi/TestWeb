import QRCode from 'qrcode';

export interface FamilyOriginShareProfile {
  id: string;             // 对应 r1 ~ r6
  shortKey: string;       // 语义化短 Key，如 'ind_fight', 'ind_queen'
  title: string;          // 中文剧本画像名，如 "内核超稳的满级大女主"
  acquiredTrait: string;  // 后天人格属性
  subtitle: string;       // 剧本人格
  attachmentType: string; // 依恋类型
  quote: string;          // 核心觉醒金句
  tags: string[];         // 标签
}

export interface FamilyOriginVisualFilter {
  id: string;             // 对应 r1 ~ r6
  name: string;           // 滤镜风格名，如 "暖阳晨曦"
  tagline: string;        // 风格副标题
  filter: string;         // CSS filter 属性
  glow: string;           // CSS background-image 专属光影
  accentColor: string;    // 专属点缀色
  badgeBg: string;        // 角标背景色
}

/**
 * 6 大原生家庭人生剧本画像短 Key 映射配置
 * 覆盖 r1 ~ r6 全量画像，并兼容历史语义别名
 */
export const FAMILY_ORIGIN_SHARE_PROFILES: Record<string, FamilyOriginShareProfile> = {
  ind_queen: {
    id: 'r1',
    shortKey: 'ind_queen',
    title: '内核超稳的满级大女主',
    acquiredTrait: '乐观治愈的热心肠',
    subtitle: '被爱浇灌的阳光剧本',
    attachmentType: '安全型 (100%)',
    quote: '被爱滋养出的松弛感，是你一生的铠甲与底气。',
    tags: ['安全型', '被爱浇灌', '自洽从容', '课题分离']
  },
  guard_queen: {
    id: 'r5',
    shortKey: 'guard_queen',
    title: '气场全开的六边形女王',
    acquiredTrait: '一腔深情的守护者',
    subtitle: '独立担责的守护剧本',
    attachmentType: '安全型 85% + 焦虑型 15%',
    quote: '我既能为你撑伞遮风挡雨，也有权利在暴雨中先拥抱自己。',
    tags: ['六边形女王', '一腔深情', '过早懂事', '责任担当']
  },
  black_lotus: {
    id: 'r2',
    shortKey: 'black_lotus',
    title: '带刺盛开的傲骨黑莲花',
    acquiredTrait: '“外强中干”的矛盾体',
    subtitle: '渴望认可的紧绷剧本',
    attachmentType: '焦虑-矛盾型',
    quote: '如果你的爱需要我战战兢兢去迎合，那我宁可骄傲地做回自己。',
    tags: ['傲骨黑莲花', '渴望认可', '紧绷内耗', '刺猬防卫']
  },
  barrier_queen: {
    id: 'r3',
    shortKey: 'barrier_queen',
    title: '清冷清醒的结界女王',
    acquiredTrait: '惯性拒绝的慢热体',
    subtitle: '筑墙自守的慢热剧本',
    attachmentType: '回避型',
    quote: '低质量的社交不如高质量的独处，我的结界只为同频的灵魂开启。',
    tags: ['结界女王', '回避型', '高筑结界', '智者不入爱河']
  },
  break_cocoon: {
    id: 'r6',
    shortKey: 'break_cocoon',
    title: '不被驯化的破茧大女主',
    acquiredTrait: '寡情果决的逆行者',
    subtitle: '破茧叛逆的防卫剧本',
    attachmentType: '焦虑-矛盾型 (反叛型)',
    quote: '凡是不能打败我的，终将成为我杀出重围的垫脚石。',
    tags: ['破茧大女主', '水泥封心', '反叛破茧', '绝不回头']
  },
  night_rose: {
    id: 'r4',
    shortKey: 'night_rose',
    title: '优雅自渡的暗夜蔷薇',
    acquiredTrait: '微笑抑郁的孤独者',
    subtitle: '戴面具自愈的茧房剧本',
    attachmentType: '混乱型（焦虑 + 逃避）',
    quote: '不用讨好任何人，你的存在本身，就值得被这世界温柔以待。',
    tags: ['暗夜蔷薇', '微笑面具', '懂事自愈', '渴望被爱']
  }
};

export interface FamilyOriginTheme {
  id: string;             // 对应 r1 ~ r6
  name: string;           // 主题名
  accentColor: string;    // 主强调色，如 #D97706
  accentHover: string;    // 悬停色
  cardShadow: string;     // 卡片投影，如 "6px 6px 0px #D97706"
  tagShadow: string;      // 标签投影，如 "2px 2px 0px #D97706"
  btnShadow: string;      // 按钮投影，如 "4px 4px 0px #D97706"
  bannerBg: string;       // 金句横幅背景色
  barFill: string;        // 进度条颜色
  borderHighlight: string;// 关键高亮边框色
  lightBg: string;        // 极浅底色
}

/**
 * 六大原生家庭剧本专属定制全案视觉皮肤与风格主题系统
 * 类似 city 城市测试，每个画像拥有完全不同的字体颜色、卡片边框、阴影与进度条色彩体系
 */
export const FAMILY_ORIGIN_THEMES: Record<string, FamilyOriginTheme> = {
  r1: {
    id: 'r1',
    name: '暖阳金',
    accentColor: '#D97706',
    accentHover: '#B45309',
    cardShadow: '6px 6px 0px #D97706',
    tagShadow: '2px 2px 0px #D97706',
    btnShadow: '4px 4px 0px #D97706',
    bannerBg: '#D97706',
    barFill: '#D97706',
    borderHighlight: '#D97706',
    lightBg: '#FEF3C7'
  },
  r5: {
    id: 'r5',
    name: '女王红',
    accentColor: '#E11D48',
    accentHover: '#BE123C',
    cardShadow: '6px 6px 0px #E11D48',
    tagShadow: '2px 2px 0px #E11D48',
    btnShadow: '4px 4px 0px #E11D48',
    bannerBg: '#E11D48',
    barFill: '#E11D48',
    borderHighlight: '#E11D48',
    lightBg: '#FFE4E6'
  },
  r2: {
    id: 'r2',
    name: '傲骨暗绯',
    accentColor: '#C026D3',
    accentHover: '#A21CAF',
    cardShadow: '6px 6px 0px #C026D3',
    tagShadow: '2px 2px 0px #C026D3',
    btnShadow: '4px 4px 0px #C026D3',
    bannerBg: '#A21CAF',
    barFill: '#C026D3',
    borderHighlight: '#C026D3',
    lightBg: '#FAE8FF'
  },
  r3: {
    id: 'r3',
    name: '冰川蓝',
    accentColor: '#0284C7',
    accentHover: '#0369A1',
    cardShadow: '6px 6px 0px #0284C7',
    tagShadow: '2px 2px 0px #0284C7',
    btnShadow: '4px 4px 0px #0284C7',
    bannerBg: '#0369A1',
    barFill: '#0284C7',
    borderHighlight: '#0284C7',
    lightBg: '#E0F2FE'
  },
  r6: {
    id: 'r6',
    name: '破茧赤红',
    accentColor: '#DC2626',
    accentHover: '#B91C1C',
    cardShadow: '6px 6px 0px #DC2626',
    tagShadow: '2px 2px 0px #DC2626',
    btnShadow: '4px 4px 0px #DC2626',
    bannerBg: '#B91C1C',
    barFill: '#DC2626',
    borderHighlight: '#DC2626',
    lightBg: '#FEE2E2'
  },
  r4: {
    id: 'r4',
    name: '暗夜紫',
    accentColor: '#9333EA',
    accentHover: '#7E22CE',
    cardShadow: '6px 6px 0px #9333EA',
    tagShadow: '2px 2px 0px #9333EA',
    btnShadow: '4px 4px 0px #9333EA',
    bannerBg: '#7E22CE',
    barFill: '#9333EA',
    borderHighlight: '#9333EA',
    lightBg: '#F3E8FF'
  }
};

export const FAMILY_KEY_ALIAS_MAP: Record<string, string> = {
  r1: 'ind_queen',
  r2: 'black_lotus',
  r3: 'barrier_queen',
  r4: 'night_rose',
  r5: 'guard_queen',
  r6: 'break_cocoon',
  ind_queen: 'ind_queen',
  black_lotus: 'black_lotus',
  barrier_queen: 'barrier_queen',
  night_rose: 'night_rose',
  guard_queen: 'guard_queen',
  break_cocoon: 'break_cocoon',
  ind_fight: 'break_cocoon',
};

/**
 * 视觉滤镜配置（保留用于海报及兼容）
 */
export const FAMILY_VISUAL_FILTERS: Record<string, FamilyOriginVisualFilter> = {
  r1: {
    id: 'r1',
    name: '暖阳晨曦',
    tagline: '金曦微澜 · 自洽暖阳',
    filter: 'contrast(1.08) brightness(1.04) saturate(1.15) sepia(0.08)',
    glow: 'radial-gradient(ellipse at 80% 20%, rgba(217, 119, 6, 0.22) 0%, transparent 60%)',
    accentColor: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.2)'
  },
  r5: {
    id: 'r5',
    name: '炽焰烈阳',
    tagline: '深红战袍 · 决断锋芒',
    filter: 'contrast(1.18) brightness(1.06) saturate(1.22) hue-rotate(-5deg)',
    glow: 'radial-gradient(ellipse at 80% 20%, rgba(225, 29, 72, 0.25) 0%, transparent 60%)',
    accentColor: '#E11D48',
    badgeBg: 'rgba(225, 29, 72, 0.2)'
  },
  r2: {
    id: 'r2',
    name: '暗夜绯红',
    tagline: '黑莲破局 · 刺芒冷艳',
    filter: 'contrast(1.15) brightness(1.02) saturate(1.12) hue-rotate(10deg)',
    glow: 'radial-gradient(ellipse at 80% 20%, rgba(192, 38, 211, 0.22) 0%, transparent 60%)',
    accentColor: '#C026D3',
    badgeBg: 'rgba(192, 38, 211, 0.2)'
  },
  r3: {
    id: 'r3',
    name: '冰川极光',
    tagline: '清冷结界 · 理性深邃',
    filter: 'contrast(1.12) brightness(1.05) saturate(0.95) hue-rotate(185deg)',
    glow: 'radial-gradient(ellipse at 80% 20%, rgba(2, 132, 199, 0.25) 0%, transparent 60%)',
    accentColor: '#0284C7',
    badgeBg: 'rgba(2, 132, 199, 0.2)'
  },
  r6: {
    id: 'r6',
    name: '血焰破茧',
    tagline: '逆行破晓 · 涅槃封心',
    filter: 'contrast(1.22) brightness(1.08) saturate(1.25) hue-rotate(-12deg)',
    glow: 'radial-gradient(ellipse at 80% 20%, rgba(220, 38, 38, 0.26) 0%, transparent 60%)',
    accentColor: '#DC2626',
    badgeBg: 'rgba(220, 38, 38, 0.2)'
  },
  r4: {
    id: 'r4',
    name: '幽夜紫魅',
    tagline: '暗夜自渡 · 蔷薇独白',
    filter: 'contrast(1.14) brightness(1.03) saturate(1.18) hue-rotate(240deg)',
    glow: 'radial-gradient(ellipse at 80% 20%, rgba(147, 51, 234, 0.24) 0%, transparent 60%)',
    accentColor: '#9333EA',
    badgeBg: 'rgba(147, 51, 234, 0.2)'
  }
};

/**
 * 获取海报使用的视觉滤镜
 */
export function getFamilyOriginFilter(idOrKey: string): FamilyOriginVisualFilter {
  const clean = (idOrKey || '').toLowerCase();
  if (FAMILY_VISUAL_FILTERS[clean]) {
    return FAMILY_VISUAL_FILTERS[clean];
  }
  const canonical = FAMILY_KEY_ALIAS_MAP[clean] || clean;
  const matched = Object.entries(FAMILY_KEY_ALIAS_MAP).find(
    ([k, v]) => (v === canonical || k === canonical) && k.startsWith('r')
  );
  if (matched && FAMILY_VISUAL_FILTERS[matched[0]]) {
    return FAMILY_VISUAL_FILTERS[matched[0]];
  }
  return FAMILY_VISUAL_FILTERS.r6;
}

/**
 * 根据画像 ID 或语义 Key 获取专属主题配置
 */
export function getFamilyOriginTheme(idOrKey: string): FamilyOriginTheme {
  const clean = (idOrKey || '').toLowerCase();
  if (FAMILY_ORIGIN_THEMES[clean]) {
    return FAMILY_ORIGIN_THEMES[clean];
  }
  const canonical = FAMILY_KEY_ALIAS_MAP[clean] || clean;
  // 反查 r1 ~ r6
  const matched = Object.entries(FAMILY_KEY_ALIAS_MAP).find(
    ([k, v]) => (v === canonical || k === canonical) && k.startsWith('r')
  );
  if (matched && FAMILY_ORIGIN_THEMES[matched[0]]) {
    return FAMILY_ORIGIN_THEMES[matched[0]];
  }
  return FAMILY_ORIGIN_THEMES.r6;
}

/**
 * 获取正式分享链接的生产域名
 * 当本地 localhost 调试时，自动采用正式线上域名，确保发给微信朋友时能真正点开测试
 */
export function getFamilyOriginShareOrigin(): string {
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
export async function generateFamilyOriginQrCodeSvg(text: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#121212',
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
 * 解析并匹配画像信息
 */
export function resolveFamilyOriginProfile(result: any): FamilyOriginShareProfile {
  const rawId = (result?.id || result?.key || '').toString().toLowerCase();
  const matchedKey = FAMILY_KEY_ALIAS_MAP[rawId] || rawId;

  if (FAMILY_ORIGIN_SHARE_PROFILES[matchedKey]) {
    return FAMILY_ORIGIN_SHARE_PROFILES[matchedKey];
  }

  // 兜底返回默认 r6 或根据名称匹配
  const foundByTitle = Object.values(FAMILY_ORIGIN_SHARE_PROFILES).find(
    p => p.title === result?.title || p.title === result?.name
  );
  if (foundByTitle) return foundByTitle;

  return FAMILY_ORIGIN_SHARE_PROFILES.break_cocoon;
}

/**
 * 构建高美感、超短语义化分享链接
 * 示例：https://test.mutong-xhs.top/family-origin?share=ind_fight
 */
export function buildFamilyOriginShareUrl(result: any): string {
  const origin = getFamilyOriginShareOrigin();
  const profile = resolveFamilyOriginProfile(result);
  const shortKey = profile.shortKey || 'ind_fight';
  return `${origin}/family-origin?share=${encodeURIComponent(shortKey)}`;
}

/**
 * 组装极具觉醒感与治愈力的小红书/微信朋友圈种草文案
 */
export function generateFamilyOriginShareCopy(
  result: any, 
  userInfo?: { nickname?: string; status?: 'independent' | 'confused' }, 
  shareUrl?: string
): string {
  const profile = resolveFamilyOriginProfile(result);
  const title = result?.title || result?.name || profile.title;
  const subtitle = result?.subtitle || profile.subtitle;
  const attachmentType = result?.attachmentType || profile.attachmentType;
  const quote = result?.quote || profile.quote;
  const nickname = userInfo?.nickname ? `【${userInfo.nickname}】` : '';
  const url = shareUrl || buildFamilyOriginShareUrl(result);

  return `📂【原生家庭人生剧本档案 · 绝密觉醒报告】
${nickname}的人生剧本鉴定完毕：我是「${title}」！
👑 剧本人格：${subtitle}
🛡 依恋类型：${attachmentType}
✨ 核心觉醒金句：“${quote}”

“所有的风暴都已过去，现在的我是自己的避难所与造物主。”
👇 扫码/点击查看我的人生档案，测测你的原生家庭剧本与依恋模式：
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
 * 同步用户手势剪贴板写入（关键：解决手机端 iOS/微信/Android 异步剪贴板权限失效的杀手锏）
 * 必须在 click 点击事件触发的第一毫秒同步执行，利用当前用户活跃手势最高权限写入！
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
 * 跨端剪贴板写入纯文本
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  return syncCopyText(text);
}

/**
 * 图文双全剪贴板写入：将种草文案与超清档案长图一同写入系统剪贴板
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #121212;">
  <div style="white-space: pre-wrap; font-size: 14px; margin-bottom: 12px; font-weight: bold;">${escapeHtml(text)}</div>
  <div style="margin-top: 8px;">
    <img src="${dataUrl}" alt="原生家庭人生剧本档案" style="max-width: 100%; border: 2px solid #121212; box-shadow: 4px 4px 0px #C2185B;" />
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
