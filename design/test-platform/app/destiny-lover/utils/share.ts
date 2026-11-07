import QRCode from 'qrcode';

export interface DestinyShareProfile {
  title: string;        // 中文画像名，如 "炽热破风者"
  shortKey: string;     // 极简拼音短 Key，如 "crpfz"
  pinyinCode: string;   // 大写编码，如 "CRPFZ"
  key: string;          // 原始 key，如 "ldar"
  subtitle: string;     // 画像副标题
  quote: string;        // 核心心动金句
}

/**
 * 16 大命定恋人画像专属短 Key 配置表
 * 统一采用拼音首字母小写作为短 Key，极致短链，严谨优雅
 */
export const DESTINY_SHARE_PROFILES: Record<string, DestinyShareProfile> = {
  crpfz: {
    title: '炽热破风者',
    shortKey: 'crpfz',
    pinyinCode: 'CRPFZ',
    key: 'ldar',
    subtitle: '烈火燎原的野性引路人',
    quote: '“只要你敢把手给我，前方所有狂风暴雨我来斩断。”'
  },
  twzqr: {
    title: '铁腕执棋人',
    shortKey: 'twzqr',
    pinyinCode: 'TWZQR',
    key: 'ldap',
    subtitle: '专治各种纠结的高阶掌控者',
    quote: '“别想那么多，天塌下来有我顶着，跟着我走就好。”'
  },
  ajhdkm: {
    title: '傲娇护短狂魔',
    shortKey: 'ajhdkm',
    pinyinCode: 'AJHDKM',
    key: 'lpar',
    subtitle: '嘴硬心软的专属避风港',
    quote: '“全世界都可以挑你刺，但在我这，你永远是对的。”'
  },
  shghj: {
    title: '生活规划家',
    shortKey: 'shghj',
    pinyinCode: 'SHGHJ',
    key: 'lpap',
    subtitle: '有条不紊的温柔定海神针',
    quote: '“生活所有的兵荒马乱，我都替你打理成岁月静好。”'
  },
  lmcdz: {
    title: '浪漫策动者',
    shortKey: 'lmcdz',
    pinyinCode: 'LMCDZ',
    key: 'mdar',
    subtitle: '为你打破世俗常理的造梦师',
    quote: '“生活可以很无趣，但只要和我在一起，每天都是庆典。”'
  },
  dfbjz: {
    title: '顶峰并肩者',
    shortKey: 'dfbjz',
    pinyinCode: 'DFBJZ',
    key: 'mdap',
    subtitle: '彼此势均力敌的最佳合伙人',
    quote: '“我不需要你依附我，我要与你共同俯瞰整片星空。”'
  },
  qlyscs: {
    title: '清冷隐世策士',
    shortKey: 'qlyscs',
    pinyinCode: 'QLYSCS',
    key: 'mpar',
    subtitle: '看透世俗却唯独对你深情的知己',
    quote: '“我不爱喧嚣的人间，但若是你，我愿涉足红尘。”'
  },
  rjzxg: {
    title: '人间主心骨',
    shortKey: 'rjzxg',
    pinyinCode: 'RJZXG',
    key: 'mpap',
    subtitle: '踏实可靠的避风定盘星',
    quote: '“无论走得多远，只要回头，我永远站在你身后。”'
  },
  pbzqs: {
    title: '破冰直球手',
    shortKey: 'pbzqs',
    pinyinCode: 'PBZQS',
    key: 'sdar',
    subtitle: '扫平一切阴霾的明朗小太阳',
    quote: '“想你就直接告诉你，我的喜欢坦坦荡荡，不用你猜。”'
  },
  yhshqs: {
    title: '硬核守护骑士',
    shortKey: 'yhshqs',
    pinyinCode: 'YHSHQS',
    key: 'sdap',
    subtitle: '言出必行的现实守护者',
    quote: '“承诺不是拿来听的，是我为你做好的每一件事。”'
  },
  wrbyg: {
    title: '温柔白月光',
    shortKey: 'wrbyg',
    pinyinCode: 'WRBYG',
    key: 'spar',
    subtitle: '无声抚平所有伤痕的纯粹归宿',
    quote: '“做你自己就好，我会小心翼翼保护好你的全部脆弱。”'
  },
  yhshz: {
    title: '烟火守护者',
    shortKey: 'yhshz',
    pinyinCode: 'YHSHZ',
    key: 'spap',
    subtitle: '一日三餐琐碎日常的守候人',
    quote: '“人间烟火最抚凡人心，我愿做那个为你留灯热饭的人。”'
  },
  sxmysr: {
    title: '随性漫游诗人',
    shortKey: 'sxmysr',
    pinyinCode: 'SXMYSR',
    key: 'gdar',
    subtitle: '带你浪迹天涯的心灵旅伴',
    quote: '“世俗规则困不住我们，走吧，看日落去。”'
  },
  wrtjz: {
    title: '温柔托举者',
    shortKey: 'wrtjz',
    pinyinCode: 'WRTJZ',
    key: 'gdap',
    subtitle: '懂你所有不被理解的知己',
    quote: '“你尽管飞向广阔天地，累了我就在原地稳稳接住你。”'
  },
  lhzy: {
    title: '灵魂知音',
    shortKey: 'lhzy',
    pinyinCode: 'LHZY',
    key: 'gpar',
    subtitle: '一个眼神便胜却千言万语的神交者',
    quote: '“你无需伪装体面，你的沉默我全都听得懂。”'
  },
  zsbfg: {
    title: '终身避风港',
    shortKey: 'zsbfg',
    pinyinCode: 'ZSBFG',
    key: 'gpap',
    subtitle: '风雨飘摇中永不熄灭的灯塔',
    quote: '“外面风大雨急，回来吧，这里永远是你的家。”'
  }
};

// 中文标题与各类 ID 到 shortKey 的双向映射池
const TITLE_TO_SHORT_KEY: Record<string, string> = {
  '炽热破风者': 'crpfz',
  '铁腕执棋人': 'twzqr',
  '傲娇护短狂魔': 'ajhdkm',
  '生活规划家': 'shghj',
  '浪漫策动者': 'lmcdz',
  '顶峰并肩者': 'dfbjz',
  '清冷隐世策士': 'qlyscs',
  '人间主心骨': 'rjzxg',
  '破冰直球手': 'pbzqs',
  '硬核守护骑士': 'yhshqs',
  '温柔白月光': 'wrbyg',
  '烟火守护者': 'yhshz',
  '随性漫游诗人': 'sxmysr',
  '温柔托举者': 'wrtjz',
  '灵魂知音': 'lhzy',
  '终身避风港': 'zsbfg'
};

const KEY_TO_SHORT_KEY: Record<string, string> = {
  'ldar': 'crpfz',
  'ldap': 'twzqr',
  'lpar': 'ajhdkm',
  'lpap': 'shghj',
  'mdar': 'lmcdz',
  'mdap': 'dfbjz',
  'mpar': 'qlyscs',
  'mpap': 'rjzxg',
  'sdar': 'pbzqs',
  'sdap': 'yhshqs',
  'spar': 'wrbyg',
  'spap': 'yhshz',
  'gdar': 'sxmysr',
  'gdap': 'wrtjz',
  'gpar': 'lhzy',
  'gpap': 'zsbfg'
};

/**
 * 智能提取命定画像的短 Key（如 crpfz）
 */
export function getDestinyShortKey(result: any): string {
  if (!result) return 'crpfz';
  if (typeof result === 'string') {
    const trimmed = result.trim().toLowerCase();
    if (DESTINY_SHARE_PROFILES[trimmed]) return trimmed;
    if (TITLE_TO_SHORT_KEY[result]) return TITLE_TO_SHORT_KEY[result];
    if (KEY_TO_SHORT_KEY[trimmed]) return KEY_TO_SHORT_KEY[trimmed];
  }
  const title = result.title || '';
  if (TITLE_TO_SHORT_KEY[title]) return TITLE_TO_SHORT_KEY[title];

  const key = result.key ? String(result.key).toLowerCase() : '';
  if (KEY_TO_SHORT_KEY[key]) return KEY_TO_SHORT_KEY[key];

  const id = result.id ? String(result.id).replace('r_', '').toLowerCase() : '';
  if (KEY_TO_SHORT_KEY[id]) return KEY_TO_SHORT_KEY[id];

  return 'crpfz';
}

/**
 * 根据画像对象或标识获取分享画像信息
 */
export function getDestinyShareProfile(result: any): DestinyShareProfile {
  const shortKey = getDestinyShortKey(result);
  return DESTINY_SHARE_PROFILES[shortKey] || DESTINY_SHARE_PROFILES.crpfz;
}

/**
 * 获取正式分享链接的生产域名
 * 当本地 localhost/127.0.0.1 调试时，自动采用正式线上域名，确保发给微信朋友时能真正点开测试
 */
export function getDestinyShareOrigin(): string {
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
export async function generateDestinyQrCodeSvg(text: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#1C1415',
        light: '#ffffff'
      }
    });
    return svgString;
  } catch (error) {
    console.error('命定恋人纯前端二维码生成异常:', error);
    return '';
  }
}

/**
 * 构建高美感、超短语义化分享链接
 * 示例：https://test.mutong-xhs.top/destiny-lover?share=crpfz
 */
export function buildDestinyShareUrl(result: any): string {
  const origin = getDestinyShareOrigin();
  const shortKey = getDestinyShortKey(result);
  return `${origin}/destiny-lover?share=${encodeURIComponent(shortKey)}`;
}

/**
 * 组装东方新中式美学的浪漫种草文案
 */
export function generateDestinyShareCopy(
  result: any, 
  userInfo?: { nickname?: string; status?: string }, 
  shareUrl?: string
): string {
  const profile = getDestinyShareProfile(result);
  const title = result?.title || profile.title;
  const subtitle = result?.subtitle || profile.subtitle;
  const rawQuote = result?.quote || profile.quote;
  const nickname = userInfo?.nickname || '我';
  const url = shareUrl || buildDestinyShareUrl(result);

  return `📜【命中注定的恋人 · 潜意识心动档案】
${nickname}已完成命定契约测算，命定之人是：【${title}】！
✨ 命盘印记：${subtitle}
💫 潜意识吸引：${rawQuote}

“在茫茫人海中，谁才是与你灵魂骨相完全契合的命定之人？”
👇 点击查收你的新中式金丝玉牌心动档案，测测你的命中注定：
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
 * 微信内置浏览器与移动端环境探测
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
    console.error('命定恋人同步剪贴板写入失败:', err);
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
 * 图文双全剪贴板写入：将种草文案与高清档案图片一同写入系统剪贴板
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
    <img src="${dataUrl}" alt="命中注定的恋人 · 心动档案卡" style="max-width: 100%; border: 2px solid #8A2B2B; box-shadow: 4px 4px 12px rgba(138,43,43,0.2);" />
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
