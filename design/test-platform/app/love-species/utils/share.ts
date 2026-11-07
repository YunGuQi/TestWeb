import QRCode from 'qrcode';

export interface LoveSpeciesShareProfile {
  key: string;          // 4位核心代码，如 "AESI"
  title: string;        // 如 "直球粘人精 · 掉毛大胖橘"
  emoji: string;        // 如 "🐱"
  tags: string[];       // 核心标签
  oneLiner: string;     // 一句话变种特征
  partnerTip: string;   // 伴侣互测相处箴言
  bestMatch: string;    // 天生绝配
  toxicMatch: string;   // 避雷预警
}

/**
 * 16 大亲密关系变种（恋爱物种特工）专属元数据配置表
 * 统一采用 4 位英文代码作为短 Key，极致短链，语义清晰
 */
export const LOVE_SPECIES_SHARE_PROFILES: Record<string, LoveSpeciesShareProfile> = {
  AESI: {
    key: 'AESI',
    title: '直球粘人精 · 掉毛大胖橘',
    emoji: '🐱',
    tags: ['#大橘为重', '#消息秒回'],
    oneLiner: '表面大橘为重，实则离不开人的全天候掉毛粘人精',
    partnerTip: '闹脾气时千万别冷战，递个罐头顺顺毛立刻呼噜',
    bestMatch: '纯爱战神 · 铁憨憨大金毛 (AHCR)',
    toxicMatch: '查岗黑洞 · 莫挨老子渣猫 (DECI)'
  },
  AESR: {
    key: 'AESR',
    title: '双标战神 · 护食黑柴犬',
    emoji: '🐕',
    tags: ['#对内摇尾', '#对外龇牙'],
    oneLiner: '外人面前高冷龇牙，对自家人双标护短到极致的护食狂犬',
    partnerTip: '给足专属偏爱与财务透明，TA会为你撕碎一切风雨',
    bestMatch: '全自动保姆 · 操心边牧 (AECR)',
    toxicMatch: '风吹草动连夜跑 · 惊恐飞鼠 (DHSI)'
  },
  AECI: {
    key: 'AECI',
    title: '狂暴小太阳 · 撒欢二哈',
    emoji: '🐺',
    tags: ['#精力过载', '#纯血乐天派'],
    oneLiner: '自带发光属性的热血笨蛋，能把平淡生活过成拆家狂欢',
    partnerTip: '在TA偶尔电量耗尽时，做一个安静倾听与拥抱的避风港',
    bestMatch: '直球粘人精 · 掉毛大胖橘 (AESI)',
    toxicMatch: '八百个心眼 · 侦探猫头鹰 (DHSR)'
  },
  AECR: {
    key: 'AECR',
    title: '全自动保姆 · 操心边牧',
    emoji: '🐶',
    tags: ['#爹妈系男友', '#自动放牧'],
    oneLiner: '智商超群的生活规划管家，把爱意刻进每一件柴米油盐里',
    partnerTip: '多肯定TA的操心付出，别把TA的体贴当成理所当然',
    bestMatch: '双标战神 · 护食黑柴犬 (AESR)',
    toxicMatch: '嘴硬心烂 · 傲娇暹罗猫 (DESI)'
  },
  AHSI: {
    key: 'AHSI',
    title: '阴阳大师 · 炸毛黑猫',
    emoji: '🐈‍⬛',
    tags: ['#冷脸洗内裤', '#口是心非'],
    oneLiner: '嘴上说着随便你心里默念敢试试，高敏易炸毛的神秘黑猫',
    partnerTip: '阴阳怪气时千万别讲道理，一把抱住疯狂顺毛立刻化险为夷',
    bestMatch: '狂暴小太阳 · 撒欢二哈 (AECI)',
    toxicMatch: '查岗黑洞 · 莫挨老子渣猫 (DECI)'
  },
  AHSR: {
    key: 'AHSR',
    title: '又怂又爱 · 脆皮垂耳兔',
    emoji: '🐰',
    tags: ['#胆小如鼠', '#暗戳戳试探'],
    oneLiner: '看似软萌实则极度缺乏安全感，拿放大镜暗中审视现实的脆皮兔',
    partnerTip: '主动亮出经济诚意与长远规划，比一万句情话更能让兔子安心',
    bestMatch: '纯爱战神 · 铁憨憨大金毛 (AHCR)',
    toxicMatch: '利益合伙人 · 搞钱杜宾犬 (DECR)'
  },
  AHCI: {
    key: 'AHCI',
    title: '就地装死 · 摆烂猫猫虫',
    emoji: '🐛',
    tags: ['#遇事装死', '#别逼我'],
    oneLiner: '慢热浪漫主义大师，遇事一滚就地装死躲进茧里的佛系小可爱',
    partnerTip: '给TA足够的缓冲期，别紧逼表态，等TA自己拱出来蹭你',
    bestMatch: '直球粘人精 · 掉毛大胖橘 (AESI)',
    toxicMatch: '嘴硬心烂 · 傲娇暹罗猫 (DESI)'
  },
  AHCR: {
    key: 'AHCR',
    title: '纯爱战神 · 铁憨憨大金毛',
    emoji: '🦮',
    tags: ['#纯爱无脑', '#笨拙真诚'],
    oneLiner: '不玩套路的纯爱战神，用行动、陪伴和存折默默守护一生的暖男汪',
    partnerTip: '珍惜TA笨拙的真诚，多夸夸TA的体贴，给TA挠挠下巴即可',
    bestMatch: '又怂又爱 · 脆皮垂耳兔 (AHSR)',
    toxicMatch: '风吹草动连夜跑 · 惊恐飞鼠 (DHSI)'
  },
  DESI: {
    key: 'DESI',
    title: '嘴硬心烂 · 傲娇暹罗猫',
    emoji: '🐱',
    tags: ['#全身上下嘴最硬', '#推开又偷看'],
    oneLiner: '全身上下嘴最硬，越爱越推开，午夜在被窝里偷偷复盘流泪',
    partnerTip: '看穿TA的毒舌尖刺，在TA发狠时霸道抱紧胜过千言万语',
    bestMatch: '狂暴小太阳 · 撒欢二哈 (AECI)',
    toxicMatch: '查岗黑洞 · 莫挨老子渣猫 (DECI)'
  },
  DESR: {
    key: 'DESR',
    title: '法官级算账 · 防盗铁刺猬',
    emoji: '🦔',
    tags: ['#感情合伙制', '#绝不倒贴'],
    oneLiner: '人间清醒防御大师，吵架逻辑如法官开庭，绝不恋爱脑倒贴',
    partnerTip: '保持清晰的权责与财务边界，真诚的等价交换是唯一通关密码',
    bestMatch: '全自动保姆 · 操心边牧 (AECR)',
    toxicMatch: '阴阳大师 · 炸毛黑猫 (AHSI)'
  },
  DECI: {
    key: 'DECI',
    title: '查岗黑洞 · 莫挨老子渣猫',
    emoji: '🐈',
    tags: ['#已读乱回', '#自由第一'],
    oneLiner: '漫不经心游走在爱意边缘，谁查岗就让谁下头的莫挨老子渣猫',
    partnerTip: '散养是唯一法则，给TA绝对自由，饿了自然会回窝蹭你',
    bestMatch: '直球粘人精 · 掉毛大胖橘 (AESI)',
    toxicMatch: '嘴硬心烂 · 傲娇暹罗猫 (DESI)'
  },
  DECR: {
    key: 'DECR',
    title: '利益合伙人 · 搞钱杜宾犬',
    emoji: '🐕‍🦺',
    tags: ['#顶级慕强', '#恋爱不如搞钱'],
    oneLiner: '把恋爱当作天使轮投资的搞钱杜宾，极致慕强，只与强者同行',
    partnerTip: '保持平等的独立实力，成为TA认可的战友，换来永不背叛的忠诚',
    bestMatch: '法官级算账 · 防盗铁刺猬 (DESR)',
    toxicMatch: '又怂又爱 · 脆皮垂耳兔 (AHSR)'
  },
  DHSI: {
    key: 'DHSI',
    title: '风吹草动连夜跑 · 惊恐飞鼠',
    emoji: '🐿️',
    tags: ['#逃跑冠军', '#风吹草动连夜买站票'],
    oneLiner: '高敏回避型天花板，稍有风吹草动便连夜买站票逃回树洞',
    partnerTip: '保持无止境的耐心，别堵门别施压，放一粒坚果静静等待',
    bestMatch: '就地装死 · 摆烂猫猫虫 (AHCI)',
    toxicMatch: '双标战神 · 护食黑柴犬 (AESR)'
  },
  DHSR: {
    key: 'DHSR',
    title: '八百个心眼 · 侦探猫头鹰',
    emoji: '🦉',
    tags: ['#暗中调查', '#利己精算师'],
    oneLiner: '八百个心眼全天候背调，不见兔子不撒鹰的深夜理智猎手',
    partnerTip: '坦诚相待，提供无可挑剔的现实安全壁垒，TA才会展露温柔',
    bestMatch: '纯爱战神 · 铁憨憨大金毛 (AHCR)',
    toxicMatch: '狂暴小太阳 · 撒欢二哈 (AECI)'
  },
  DHCI: {
    key: 'DHCI',
    title: '情绪已入土 · 佛系卡皮巴拉',
    emoji: '🦫',
    tags: ['#情绪入土', '#顶级松弛感'],
    oneLiner: '情绪入土、万物皆可OK，头顶橘子看淡世间抓马的松弛感宗师',
    partnerTip: '享受如白开水般长久的陪伴，别试图刺激TA，陪TA发呆即可',
    bestMatch: '直球粘人精 · 掉毛大胖橘 (AESI)',
    toxicMatch: '风吹草动连夜跑 · 惊恐飞鼠 (DHSI)'
  },
  DHCR: {
    key: 'DHCR',
    title: '寡王巅峰 · 零度高岭雪豹',
    emoji: '🐆',
    tags: ['#雪山寡王', '#爱能当饭吃吗'],
    oneLiner: '万仞雪原绝壁之上的独行寡王，事业搞钱第一，感情可有可无',
    partnerTip: '唯有同样独立强大的顶峰王者，才配走进TA的零度世界',
    bestMatch: '利益合伙人 · 搞钱杜宾犬 (DECR)',
    toxicMatch: '直球粘人精 · 掉毛大胖橘 (AESI)'
  }
};

// 中文标题与各类 ID 到核心 key 的双向映射池
const TITLE_TO_KEY: Record<string, string> = {
  // 翻新后完整标题
  '直球粘人精 · 掉毛大胖橘': 'AESI',
  '双标战神 · 护食黑柴犬': 'AESR',
  '狂暴小太阳 · 撒欢二哈': 'AECI',
  '全自动保姆 · 操心边牧': 'AECR',
  '阴阳大师 · 炸毛黑猫': 'AHSI',
  '又怂又爱 · 脆皮垂耳兔': 'AHSR',
  '就地装死 · 摆烂猫猫虫': 'AHCI',
  '纯爱战神 · 铁憨憨大金毛': 'AHCR',
  '嘴硬心烂 · 傲娇暹罗猫': 'DESI',
  '法官级算账 · 防盗铁刺猬': 'DESR',
  '查岗黑洞 · 莫挨老子渣猫': 'DECI',
  '利益合伙人 · 搞钱杜宾犬': 'DECR',
  '风吹草动连夜跑 · 惊恐飞鼠': 'DHSI',
  '八百个心眼 · 侦探猫头鹰': 'DHSR',
  '情绪已入土 · 佛系卡皮巴拉': 'DHCI',
  '寡王巅峰 · 零度高岭雪豹': 'DHCR',
  // 历史旧标题兼容
  '噬元橘猫': 'AESI',
  '护食幼狼': 'AESR',
  '满电海獭': 'AECI',
  '筑巢小燕子': 'AECR',
  '剧毒水母': 'AHSI',
  '脆皮洋桔梗': 'AHSR',
  '幻影变色龙': 'AHCI',
  '慢热冬眠熊': 'AHCR',
  '刺客猞猁': 'DESI',
  '装甲刺猬': 'DESR',
  '傲娇曼岛猫': 'DECI',
  '极地白狼': 'DECR',
  '沙漠耳狐': 'DHSI',
  '暗夜猫头鹰': 'DHSR',
  '待机水豚': 'DHCI',
  '冰川雪豹': 'DHCR'
};

/**
 * 智能提取恋爱物种短 Key（如 AESI）
 */
export function getLoveSpeciesShortKey(result: any): string {
  if (!result) return 'AESI';
  if (typeof result === 'string') {
    const upper = result.trim().toUpperCase();
    if (LOVE_SPECIES_SHARE_PROFILES[upper]) return upper;
    if (TITLE_TO_KEY[result.trim()]) return TITLE_TO_KEY[result.trim()];
  }
  const rawKey = result.key ? String(result.key).toUpperCase().trim() : '';
  if (LOVE_SPECIES_SHARE_PROFILES[rawKey]) return rawKey;

  const title = result.title ? String(result.title).trim() : '';
  if (TITLE_TO_KEY[title]) return TITLE_TO_KEY[title];

  return 'AESI';
}

/**
 * 根据画像对象或标识获取恋爱物种分享信息
 */
export function getLoveSpeciesShareProfile(result: any): LoveSpeciesShareProfile {
  const shortKey = getLoveSpeciesShortKey(result);
  return LOVE_SPECIES_SHARE_PROFILES[shortKey] || LOVE_SPECIES_SHARE_PROFILES.AESI;
}

/**
 * 解析 URL 中的 share 邀请参数
 */
export function parseLoveSpeciesShareKey(rawShare: string): LoveSpeciesShareProfile | null {
  if (!rawShare) return null;
  const decoded = decodeURIComponent(rawShare).trim();
  const shortKey = getLoveSpeciesShortKey(decoded);
  return LOVE_SPECIES_SHARE_PROFILES[shortKey] || null;
}

/**
 * 获取正式分享链接的生产域名
 * 当本地 localhost/127.0.0.1 调试时，自动采用正式线上域名，确保发给微信朋友时能真正点开测试
 */
export function getLoveSpeciesShareOrigin(): string {
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
export async function generateLoveSpeciesQrCodeSvg(text: string): Promise<string> {
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
    console.error('恋爱物种纯前端二维码生成异常:', error);
    return '';
  }
}

/**
 * 构建高美感、超短语义化分享链接
 * 示例：https://test.mutong-xhs.top/love-species?share=AESI
 */
export function buildLoveSpeciesShareUrl(result: any): string {
  const origin = getLoveSpeciesShareOrigin();
  const shortKey = getLoveSpeciesShortKey(result);
  return `${origin}/love-species?share=${encodeURIComponent(shortKey)}`;
}

/**
 * 组装特工恋爱物种与伴侣互测查岗暗号种草文案
 */
export function generateLoveSpeciesShareCopy(
  result: any, 
  userInfo?: { nickname?: string; status?: 'single' | 'relationship' }, 
  shareUrl?: string
): string {
  const profile = getLoveSpeciesShareProfile(result);
  const title = result?.title || profile.title;
  const emoji = result?.emoji || profile.emoji;
  const tagsStr = (result?.tags && Array.isArray(result.tags)) 
    ? result.tags.join(' ') 
    : profile.tags.join(' ');
  const nickname = userInfo?.nickname || '我';
  const url = shareUrl || buildLoveSpeciesShareUrl(result);

  return `🐾【恋爱物种特工档案 · 亲密关系变种鉴定】
${nickname}已完成基因测序，鉴定恋爱物种为：${emoji}【${title}】！
🏷️ 物种标签：${tagsStr}
🧬 变种特质：${profile.oneLiner}
💡 伴侣顺毛指南：${profile.partnerTip}
❤️ 天生绝配：${profile.bestMatch} | ⚠️ 避雷预警：${profile.toxicMatch}

“在亲密关系的世界里，你究竟是全天候粘人精，还是带刺的清冷猎手？”
👇 点击查收你的特工级亲密关系档案，艾特TA来测测契合度：
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
    console.error('恋爱物种同步剪贴板写入失败:', err);
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #121212;">
  <div style="white-space: pre-wrap; font-size: 14px; margin-bottom: 12px; font-weight: bold;">${escapeHtml(text)}</div>
  <div style="margin-top: 8px;">
    <img src="${dataUrl}" alt="恋爱物种特工档案" style="max-width: 100%; border: 2px solid #121212; box-shadow: 4px 4px 0px #121212;" />
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
