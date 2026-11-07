import QRCode from 'qrcode';

export interface SharePayload {
  k: string;       // 画像 key，如 'rum', 'bnd', 'sen'
  t: string;       // 画像标题，如 '深夜复盘家'
  f: number;       // 隐性内耗总扣费金额
  r: number;       // 击败人类百分比
  ot: string;      // 击败文本描述
  u?: number;      // 是否解锁态
}

export const PROFILE_INFO_MAP: Record<string, { title: string; beatText: string; quote: string; defaultCost: number }> = {
  rum_low_bnd: { 
    title: '【自我PUA带师】', 
    beatText: '内核极致进化自省度击败 97.1% 脆皮人类', 
    quote: '每一个无法释怀的细节，都是大脑在替灵魂做压力测试。',
    defaultCost: 24150
  },
  low: { 
    title: '【人间铁壁】', 
    beatText: '精神绝对防御力击败 98.8% 脆皮人类', 
    quote: '只要我没有道德，你就绑架不了我。',
    defaultCost: 6800
  },
  bnd: { 
    title: '【精神守财奴】', 
    beatText: '自我边界清醒掌控力击败 96.5% 脆皮人类', 
    quote: '内耗太贵，我的精力要留给搞钱和睡觉。',
    defaultCost: 11200
  },
  isolated: { 
    title: '【情绪断电绝缘体】', 
    beatText: '低质社交过滤定力击败 98.2% 脆皮人类', 
    quote: '我的世界很小，只容得下真诚的人。',
    defaultCost: 8900
  },
  sen: { 
    title: '【薛定谔的敏感】', 
    beatText: '微表情直觉洞察力击败 95.8% 脆皮人类', 
    quote: '不是我太敏感，只是我比你更早嗅到空气里的不对劲。',
    defaultCost: 19800
  },
  sen_pls: { 
    title: '【情绪海绵】', 
    beatText: '超感场域共情深度击败 98.5% 脆皮人类', 
    quote: '我吸收了所有的情绪，却忘了给自己拧干。',
    defaultCost: 26500
  },
  pls: { 
    title: '【心软神明降临】', 
    beatText: '利他社交包容能量击败 94.2% 脆皮人类', 
    quote: '总想做别人的避难所，谁来做我的屋檐？',
    defaultCost: 16800
  },
  rum: { 
    title: '【深夜复盘家】', 
    beatText: '多维思维推演深度击败 97.8% 脆皮人类', 
    quote: '白天云淡风轻，晚上在大脑里开复盘听证会。',
    defaultCost: 18500
  },
  burnout: { 
    title: '【工伤级脆皮打工人】', 
    beatText: '极限复杂事务抗荷力击败 98.9% 脆皮人类', 
    quote: '身体在工位，灵魂早就提了离职。',
    defaultCost: 28900
  },
  high: { 
    title: '【灵魂透支大户】', 
    beatText: '精神全域超频运转率击败 99.2% 脆皮人类', 
    quote: '电量只剩 1%，却还在替全世界发光。',
    defaultCost: 32000
  }
};

/**
 * 获取正式分享链接的生产域名
 * 当本地 localhost 调试时，自动采用正式线上域名，确保发给微信朋友时能真正点开测试
 */
export function getShareOrigin(): string {
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
export async function generateQrCodeSvg(text: string): Promise<string> {
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
 * 构建高美感、超短语义化分享链接（彻底摒弃臃肿的 Base64 乱码长串）
 * 示例：https://test.mutong-xhs.top/emo?share=rum_low_bnd&cost=24150
 */
export function buildShareUrl(result: any, isUnlocked: boolean = false): string {
  const origin = getShareOrigin();
  const key = result?.key || 'rum';
  const cost = typeof result?.totalFriction === 'number' ? result.totalFriction : 18500;
  return `${origin}/emo?share=${encodeURIComponent(key)}&cost=${cost}`;
}

/**
 * 解析并校验 URL 中的好友分享参数（同时兼容短参数模式与旧版 Base64 模式）
 */
export function parseSharePayload(rawShare: string, searchParams?: URLSearchParams): SharePayload | null {
  if (!rawShare) return null;

  // 1. 优先尝试极简语义化 Key 模式（如 share=rum_low_bnd）
  const cleanKey = decodeURIComponent(rawShare).trim();
  if (PROFILE_INFO_MAP[cleanKey]) {
    const info = PROFILE_INFO_MAP[cleanKey];
    let friction = info.defaultCost;
    if (searchParams) {
      const rawCost = searchParams.get('cost');
      if (rawCost && !isNaN(parseInt(rawCost, 10))) {
        friction = parseInt(rawCost, 10);
      }
    }
    return {
      k: cleanKey,
      t: info.title,
      f: friction,
      r: 97.5,
      ot: info.beatText,
      u: 1
    };
  }

  // 2. 兼容旧版 Base64 容错解析
  try {
    const decodedUrlParam = decodeURIComponent(rawShare);
    const jsonStr = decodeURIComponent(atob(decodedUrlParam));
    const parsed = JSON.parse(jsonStr) as SharePayload;
    if (parsed && typeof parsed === 'object' && (parsed.t || parsed.k)) {
      return parsed;
    }
  } catch (e) {
    // 静默降级
  }

  return null;
}

/**
 * 组装极具情绪痛点的小红书/朋友圈种草文案
 */
export function generateShareCopy(result: any, shareUrl: string): string {
  const title = result?.title || '脆皮人类';
  const friction = typeof result?.totalFriction === 'number' 
    ? `¥${result.totalFriction.toLocaleString()}` 
    : '已超标';
  const overallText = result?.overallText || '深度共情力击败 98.5% 脆皮人类';

  return `🧾【安安心灵便利店 · 情绪消费结账单】
我的情绪鉴定结果出来了：我是「${title}」！
💔 本月隐性内耗扣费：${friction}
📊 官方权威鉴定：${overallText}

“别把所有情绪都自己买单，来看看你的心都把能量花在哪了？”
👇 点击查收我的情绪明细，测测你的内耗账单：
${shareUrl}`;
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
 * 跨端剪贴板写入纯文本（带 textarea fallback 降级）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  return syncCopyText(text);
}


/**
 * 图文双全剪贴板写入：将种草文案与高清测试小票图片一同写入系统剪贴板
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
    <img src="${dataUrl}" alt="深度情绪内耗明细小票" style="max-width: 100%; border: 2px solid #000; box-shadow: 4px 4px 0px #000;" />
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


