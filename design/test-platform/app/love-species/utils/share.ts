import QRCode from 'qrcode';

export interface LoveSpeciesShareProfile {
  key: string;          // 4位核心代码，如 "AESI"
  title: string;        // 如 "噬元橘猫"
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
    title: '噬元橘猫',
    emoji: '🐱',
    tags: ['#极度粘人', '#直球选手', '#易受惊吓'],
    oneLiner: '表面独立傲娇，实则离不开人的全天候高浓度粘人精',
    partnerTip: '闹脾气时千万别冷战，递个零食揉揉脑袋立刻顺毛',
    bestMatch: '慢热冬眠熊 (AHCR)',
    toxicMatch: '傲娇曼岛猫 (DECI)'
  },
  AESR: {
    key: 'AESR',
    title: '护食幼狼',
    emoji: '🐺',
    tags: ['#双标护短', '#现实主义', '#领地意识'],
    oneLiner: '外人面前清冷独立，对自家人双标护短到极致的领地掌控者',
    partnerTip: '给足专属偏爱与安全边界，TA会为你抵挡一切狂风暴雨',
    bestMatch: '筑巢小燕子 (AECR)',
    toxicMatch: '沙漠耳狐 (DHSI)'
  },
  AECI: {
    key: 'AECI',
    title: '满电海獭',
    emoji: '🦦',
    tags: ['#顶级情绪价值', '#六边形战士', '#小太阳'],
    oneLiner: '自带发光特质的情绪充电桩，能把平淡生活过成浪漫庆典',
    partnerTip: '在TA偶尔电量耗尽时，做一个安静倾听与拥抱的避风港',
    bestMatch: '噬元橘猫 (AESI)',
    toxicMatch: '暗夜猫头鹰 (DHSR)'
  },
  AECR: {
    key: 'AECR',
    title: '筑巢小燕子',
    emoji: '🐦',
    tags: ['#爹系妈系', '#务实陪伴', '#靠谱担当'],
    oneLiner: '细水长流的生活规划大师，把爱意藏在每一件琐碎小事里',
    partnerTip: '多肯定TA的付出，别把TA的体贴周到当成理所应当',
    bestMatch: '护食幼狼 (AESR)',
    toxicMatch: '刺客猞猁 (DESI)'
  },
  AHSI: {
    key: 'AHSI',
    title: '剧毒水母',
    emoji: '🪼',
    tags: ['#情绪黑洞', '#美丽且危险', '#高敏易碎'],
    oneLiner: '极致浪漫与极度敏感并存，拥有超敏微表情情感探测雷达',
    partnerTip: '真诚是唯一的解药，任何敷衍与隐瞒都会被TA瞬间捕捉',
    bestMatch: '满电海獭 (AECI)',
    toxicMatch: '傲娇曼岛猫 (DECI)'
  },
  AHSR: {
    key: 'AHSR',
    title: '脆皮洋桔梗',
    emoji: '🥀',
    tags: ['#患得患失', '#现实考量', '#极度缺爱'],
    oneLiner: '看似柔弱纤细，实则内心极度渴望坚定被选择的深情宿主',
    partnerTip: '用一次又一次的言出必行，浇灌TA容易患得患失的心',
    bestMatch: '慢热冬眠熊 (AHCR)',
    toxicMatch: '极地白狼 (DECR)'
  },
  AHCI: {
    key: 'AHCI',
    title: '幻影变色龙',
    emoji: '🦎',
    tags: ['#极致浪漫', '#阴晴不定', '#需要新鲜感'],
    oneLiner: '情绪多面而难以捉摸，在感情中不断追寻深度精神共鸣',
    partnerTip: '保持神秘感与新鲜感，与TA在灵魂旷野里共同漫游',
    bestMatch: '噬元橘猫 (AESI)',
    toxicMatch: '刺客猞猁 (DESI)'
  },
  AHCR: {
    key: 'AHCR',
    title: '慢热冬眠熊',
    emoji: '🐻',
    tags: ['#稳如泰山', '#默默守护', '#过日子第一名'],
    oneLiner: '嘴笨心诚的定海神针，不善甜言蜜语却永远在身后稳稳托举',
    partnerTip: '尊重TA偶入树洞的独处时间，TA的回应虽慢但从不缺席',
    bestMatch: '脆皮洋桔梗 (AHSR)',
    toxicMatch: '沙漠耳狐 (DHSI)'
  },
  DESI: {
    key: 'DESI',
    title: '刺客猞猁',
    emoji: '🐅',
    tags: ['#傲娇至死', '#嘴硬心软', '#极度缺爱'],
    oneLiner: '浑身带刺却渴望被温柔拥抱，嘴上说着嫌弃身体却很诚实',
    partnerTip: '看穿TA口是心非的防御机制，用厚脸皮的坚定瓦解TA的心防',
    bestMatch: '满电海獭 (AECI)',
    toxicMatch: '傲娇曼岛猫 (DECI)'
  },
  DESR: {
    key: 'DESR',
    title: '装甲刺猬',
    emoji: '🦔',
    tags: ['#人间清醒', '#及时止损', '#防御点满'],
    oneLiner: '一旦察觉不对立即缩进硬壳，擅长用绝对理智包装脆弱内心',
    partnerTip: '别逼TA快速表态，给TA足够的安全空间慢慢探出触角',
    bestMatch: '筑巢小燕子 (AECR)',
    toxicMatch: '剧毒水母 (AHSI)'
  },
  DECI: {
    key: 'DECI',
    title: '傲娇曼岛猫',
    emoji: '🐈',
    tags: ['#绝对自我', '#理智得可怕', '#需要空间'],
    oneLiner: '精神领地神圣不可侵犯，不依附任何人却唯独对灵魂契合者驻足',
    partnerTip: '像对待野生猫科动物一样尊重距离，越不强求TA越粘你',
    bestMatch: '噬元橘猫 (AESI)',
    toxicMatch: '刺客猞猁 (DESI)'
  },
  DECR: {
    key: 'DECR',
    title: '极地白狼',
    emoji: '🐺',
    tags: ['#生人勿近', '#利益至上', '#慕强'],
    oneLiner: '冷峻孤傲的顶峰并肩者，唯有同频且强大的灵魂才能与TA共猎',
    partnerTip: '展示你的内核定力与独特价值，平等势均力敌是吸引TA的法门',
    bestMatch: '装甲刺猬 (DESR)',
    toxicMatch: '脆皮洋桔梗 (AHSR)'
  },
  DHSI: {
    key: 'DHSI',
    title: '沙漠耳狐',
    emoji: '🦊',
    tags: ['#听觉雷达', '#细节狂魔', '#难以触及'],
    oneLiner: '能听见空气中所有细微声响，极度敏感且习惯保持防卫距离',
    partnerTip: '别做浮夸承诺，把心意落在每一个不经意的小细节里',
    bestMatch: '幻影变色龙 (AHCI)',
    toxicMatch: '护食幼狼 (AESR)'
  },
  DHSR: {
    key: 'DHSR',
    title: '暗夜猫头鹰',
    emoji: '🦉',
    tags: ['#极致利己', '#暗中观察', '#不见兔子不撒鹰'],
    oneLiner: '黑夜中洞察人性的冷眼旁观者，在感情中精细权衡沉没成本',
    partnerTip: '用时间证明你的诚意与靠谱，一旦通过审核TA将极其忠诚',
    bestMatch: '慢热冬眠熊 (AHCR)',
    toxicMatch: '满电海獭 (AECI)'
  },
  DHCI: {
    key: 'DHCI',
    title: '待机水豚',
    emoji: '🦦',
    tags: ['#情绪绝缘体', '#万物皆可佛', '#顶级松弛感'],
    oneLiner: '情绪极为平稳的顶级松弛神兽，任何惊涛骇浪都掀不起TA的波澜',
    partnerTip: '跟着TA的节奏享受平淡岁月，别试图用作和闹来试探TA的底线',
    bestMatch: '噬元橘猫 (AESI)',
    toxicMatch: '沙漠耳狐 (DHSI)'
  },
  DHCR: {
    key: 'DHCR',
    title: '冰川雪豹',
    emoji: '🐆',
    tags: ['#高岭之花', '#孤独求败', '#极度独立'],
    oneLiner: '栖息在雪线之上的清冷孤王，不需要群居陪伴却渴望极致懂得',
    partnerTip: '无需千言万语，一个懂得的眼神胜过世间万般纠缠',
    bestMatch: '极地白狼 (DECR)',
    toxicMatch: '噬元橘猫 (AESI)'
  }
};

// 中文标题与各类 ID 到核心 key 的双向映射池
const TITLE_TO_KEY: Record<string, string> = {
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
