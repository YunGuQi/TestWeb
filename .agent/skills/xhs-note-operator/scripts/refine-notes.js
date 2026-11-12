// refine-notes.js · 通用发帖文案一键排版规整、红线排查与格式核验工具
//
// 适用全业务 5 大测试：
//   - 命定恋人 / 深度情绪内耗 / 恋爱物种领养中心 / 大女主觉醒测试 / 性格城市匹配
//
// 核心原则与门禁设计：
//   【四大硬门禁】（唯一阻断 process.exit(1) 的机审红线）：
//     1. SSOT 真源防编造：结果名、数值雷达维度与得分、quote 金句必须严格对齐数据源（family-origin-data.ts 等），绝不捏造（如严禁编造“内核90+”）；
//     2. 医疗与平台合规红线：严禁 4 个 0 词表（产品词、测试术语、具体临床诊疗词[脱敏/系统脱敏/确诊/抑郁等]、机械营销封杀词[赶紧去查查/快去测测看吧等]）；严格放行“心理/心理测试”合规通用词；
//     3. 草稿铁律绝不自动发布：只做草稿绝不发布，严禁任何浏览器 CDP/自动化发帖调用；
//     4. 基础版式与标签规范：封面 2~4 行且总字数 ≤ 16 字；标题 ≤ 20 字；标签严格 5 个（位1品牌、位2品类、位3结果名）；纯文本无 emoji。
//   【非阻塞灵感参考看板】（全面剥离风格管制，绝不判红、不阻断）：
//     - 热梗雷达覆盖度、口语虚词数量、≤6字短行停顿、5大场域场景道具、末行词表、6:3:1配比、STYLE_ADVISORY风格建议等全部降为参考，以 💡 建议形式展示；
//   【批次去同构两项硬门禁】：
//     1. 原声对话与开篇事件不跨篇复用；
//     2. 连续 3 篇句式骨架结构模式不完全相同。

const fs = require('fs');
const path = require('path');
const SD = require(path.join(__dirname, 'skill-data.js'));

/** @returns {'长短长'|'短长短'|'长短'|'短长'|'长短错落'|null} */
function detectCoverRhythm(lengths) {
  if (!lengths.length) return null;
  const isS = (n) => n <= 4;
  const isL = (n) => n >= 6;
  if (lengths.length === 3) {
    const [a, b, c] = lengths;
    if (isL(a) && isS(b) && isL(c)) return '长短长';
    if (isS(a) && isL(b) && isS(c)) return '短长短';
    return null;
  }
  if (lengths.length === 2) {
    const [a, b] = lengths;
    if (isL(a) && isS(b)) return '长短';
    if (isS(a) && isL(b)) return '短长';
    return null;
  }
  if (lengths.length === 4) {
    const [a, b, c, d] = lengths;
    if (isL(a) && isS(b) && isL(c) && isS(d)) return '长短长短';
    if (isS(a) && isL(b) && isS(c) && isL(d)) return '短长短长';
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    if (min <= 4 && max >= 6 && max - min >= 3) return '长短错落';
    return null;
  }
  return null;
}

/**
 * 写作网感与呼吸节奏参考分析（纯参考看板，不判红、不阻塞）
 */
function checkCardRhythmAndPerturbation(bodyLines) {
  const oralWords = SD.ORAL_PERTURBATION_WORDS || [];
  const oralHits = oralWords.filter(w => bodyLines.some(l => l.includes(w)));
  const cleanLines = bodyLines.filter(l => !l.startsWith('#') && !l.startsWith('['));
  const shortLines = cleanLines.filter(l => l.length <= 10);
  const advisories = [];

  const minOral = bodyLines.length <= 3 ? 1 : 2;
  if (bodyLines.length > 0 && oralHits.length < minOral) {
    advisories.push(
      `[网感建议] 口语虚词建议覆盖 ${minOral} 种 (现 ${oralHits.length} 种)，参考虚词库: ${oralWords.slice(0, 4).join('/')}`
    );
  }

  return {
    oralHits,
    shortLines,
    advisories,
    pass: true,
  };
}

/**
 * 1. 封面与标题硬门禁（总字数<=16、标题<=20、行数2~4）
 */
function checkCoverAndTitle({ coverLines = [], title = '', meta = '' }) {
  const issues = [];
  const advisories = [];

  if (title && title.length > 20) {
    issues.push(`[标题字数超标] 标题超长 (${title.length} 字，必须 <= 20 字): ${title}`);
  }

  const cLengths = coverLines.map(l => l.length);
  const totalCover = cLengths.reduce((a, b) => a + b, 0);

  if (coverLines.length < 2 || coverLines.length > 4) {
    issues.push(`[封面行数超标] 须为 2~4 行 (现 ${coverLines.length} 行): [${coverLines.join(' / ')}]`);
  }
  if (totalCover > 16) {
    issues.push(`[封面总字数超标] 封面总字数超16字 (${totalCover} 字): [${coverLines.join(' / ')}]`);
  }

  const rhythm = detectCoverRhythm(cLengths);
  if (!rhythm) {
    advisories.push(`[封面节奏提示] 建议封面采用长短长或短长短错落节奏 (现 [${cLengths.join('/')}]): [${coverLines.join(' / ')}]`);
  }

  // 模式一数字量纲提示
  if (meta && (meta.includes('模式=模式一') || meta.includes('模式一'))) {
    const hasNum = coverLines.some(l => /\d/.test(l) || /%|％/.test(l));
    if (!hasNum) {
      advisories.push(`[封面认领提示] 模式一建议封面展示数值或百分比量纲强化认领感: [${coverLines.join(' / ')}]`);
    }
  }

  // 严禁考试得分词
  if (coverLines.some(l => /低于\d+分|考了\d+分|得分/.test(l))) {
    issues.push(`[封面违规词] 封面严禁出现考试得分词: [${coverLines.join(' / ')}]`);
  }

  return {
    issues,
    advisories,
    pass: issues.length === 0,
  };
}

/**
 * 2. 正文硬门禁与人味分析
 * 硬门禁：无机械营销封杀词、纯文本无 emoji、测试自然出现一次闭环
 * 风格降级：场景实物、短行、末行词表全部降为灵感参考
 */
function checkBody({ bodyLines = [], coverLines = [], title = '' }) {
  const issues = [];
  const advisories = [];
  if (!bodyLines || bodyLines.length === 0) return { issues, advisories, pass: true };

  // 单行字数提示（放宽至 <=35 字，保护原声对话与引用完整性，绝不机械切碎）
  bodyLines.forEach((l, idx) => {
    if (l.length > 35) {
      issues.push(`[正文单行超长] 第 ${idx + 1} 行单行超35字 (${l.length} 字)，建议人工断行: ${l}`);
    }
  });

  // 网感与口语分析（仅作建议）
  const rp = checkCardRhythmAndPerturbation(bodyLines);
  advisories.push(...rp.advisories);

  // 场景道具分析（仅作人味参考提示，绝不判红）
  const sceneCheck = SD.detectSceneAction ? SD.detectSceneAction(bodyLines.slice(0, 3)) : { hit: true };
  if (!sceneCheck.hit) {
    advisories.push(`[人味细节提示] 正文前 3 行未检测到预设生活实物道具，建议确保包含具体生活动作或环境细节`);
  }

  // 第二人称说教句式排查（引号外他人对话原声除外）
  bodyLines.forEach((line, idx) => {
    const isDialogueQuote = /[“"'].*你.*[”"']/.test(line);
    if (!isDialogueQuote && SD.PREACHY_PATTERN && SD.PREACHY_PATTERN.test(line)) {
      advisories.push(`[说教语气提示] 第 ${idx + 1} 行疑似出现第二人称说教句式: "${line}"，建议换为第一人称叙事`);
    }
  });

  // 纯文本表情符号排查（硬门禁）
  const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/u;
  bodyLines.forEach((line, idx) => {
    if (EMOJI_REGEX.test(line)) {
      issues.push(`[表情符号违规] 第 ${idx + 1} 行出现 emoji 表情符号: "${line}" (文案强制纯文本)`);
    }
  });

  // 测试自然出现一次闭环强检
  const testLoopRegex = /(测出|报告|指数|测试|自测|拿到.*卡片|得分|测评|截图|锁屏|卡片|底气|铠甲|大女主|黑莲花|六边形|结界|蔷薇|破茧)/;
  const hasTestClosedLoop = bodyLines.some(l => testLoopRegex.test(l));
  if (!hasTestClosedLoop) {
    issues.push(`[测试未自然出现] 正文全篇未见测试道具或金句痕迹（测出/自测/卡片/截图/锁屏/金句等），未形成测试闭环`);
  }

  // 末行检查：严禁机械营销套路词（硬门禁）
  if (bodyLines.length > 0) {
    const lastLine = bodyLines[bodyLines.length - 1].trim();
    const marketingBanWords = [
      '敢不敢在评论区报个', '评论区报一下', '评论区报个', '快去测测看吧', '快去测测看',
      '快去测', '赶紧去查查', '快来测', '评论区留言', '评论区告诉我', '戳评论区',
      '快去试试', '测测你的', '测测你', '敢不敢'
    ];
    const hitBan = marketingBanWords.find(bw => lastLine.includes(bw));
    if (hitBan) {
      issues.push(`[末行机械营销违规] 末行违规命中机械营销套路词“${hitBan}”，严禁机械逼问，须改为部落接头暗号或动作定格`);
    } else if (!lastLine || /^[。，！？…—~#*\s]+$/.test(lastLine) || lastLine.length < 2) {
      issues.push(`[末行内容为空] 末行有效字符不足 ("${lastLine}")`);
    } else if (lastLine.length > 30) {
      issues.push(`[末行暗号超长] 末行超长 (${lastLine.length} 字，建议 <= 25 字): "${lastLine}"`);
    }
  }

  return {
    issues,
    advisories,
    pass: issues.length === 0,
    oralHits: rp.oralHits,
    shortLines: rp.shortLines,
    sceneCheck,
  };
}

/**
 * 3. 标签与画像硬门禁（品牌词、品类词、结果名 SSOT 核真）
 */
function checkTags(tags = [], profile = null, meta = '') {
  const issues = [];
  if (tags && tags.length > 0 && tags.length !== 5) {
    issues.push(`[标签数量违规] 标签数必须严格等于 5 个 (现 ${tags.length} 个)`);
  }
  if (profile) {
    if (tags && tags.length > 0 && profile.brandTag) {
      const allowedBrand = [profile.brandTag, `${profile.brandTag}测试`];
      if (!allowedBrand.includes(tags[0])) {
        issues.push(`[品牌词错误] 品牌标签为“${tags[0]}”，应为“${profile.brandTag}”`);
      }
    }
    if (tags && tags.length > 1 && profile.categoryTag) {
      if (tags[1] !== profile.categoryTag) {
        issues.push(`[品类词错误] 品类标签为“${tags[1]}”，应为“${profile.categoryTag}”`);
      }
    }
  }

  // 结果名核真校验（硬门禁）
  if (profile && profile.accents && profile.accents.length > 0) {
    let rName = '';
    if (meta) {
      const mResult = meta.match(/结果=([^｜|]+)/);
      if (mResult) rName = mResult[1].trim();
    }
    if (!rName && tags && tags.length > 2) {
      rName = tags[2].replace(/^#/, '').trim();
    }
    if (rName) {
      const matched = profile.accents.some(a => {
        const aClean = a.name.split('（')[0].split('(')[0].trim();
        return a.name === rName || a.name.includes(rName) || rName.includes(aClean)
          || (a.name.includes(`（${rName}）`)) || (a.name.includes(`(${rName})`));
      });
      if (!matched) {
        const validNames = profile.accents.map(a => a.name.split('（')[0].trim()).join(' / ');
        issues.push(`[结果名编造] 结果名“${rName}”在测试画像中不存在！合法真实结果为: ${validNames}`);
      }
    }
  }

  return {
    issues,
    pass: issues.length === 0,
  };
}

/**
 * 4. SSOT 真源防编造强检门禁（雷达维度与得分、金句原文逐字核验）
 */
function checkRadarAndSSOT({ card, ssotResult, pinnedComment = '' }) {
  const issues = [];
  if (!ssotResult) return { issues, pass: true };

  const rawRadar = ssotResult.raw.radar || [];
  const subjects = rawRadar.map(r => ({
    name: (r.subject || r.label || '').trim(),
    val: Number(r.A ?? r.value ?? 0)
  })).filter(s => s.name);

  const fullText = [
    ...(card.coverLines || []),
    card.title || '',
    ...(card.bodyLines || []),
    pinnedComment || ''
  ].join('\n');

  // 1. 检查测出/雷达指标提法：例如 测出共情97 / 疏离感98% / 测出内核90+
  const regex = /(?:测出|指数|得分|分数)?\s*([\u4e00-\u9fa5]{2,4})\s*[:：=为]?\s*(\d{2,3}|\d{2}\+)[%％\+]?/g;
  let match;
  while ((match = regex.exec(fullText)) !== null) {
    const dim = match[1];
    const scoreStr = match[2];
    const ignoredDims = ['二十', '三十', '四十', '五十', '九点', '十点', '一年', '两年', '半年', '几级', '前排', '第一', '第二', '第三', '年级'];
    if (ignoredDims.some(d => dim.includes(d))) continue;

    const foundSubject = subjects.find(s => s.name.includes(dim) || dim.includes(s.name));
    if (foundSubject) {
      const numScore = parseInt(scoreStr, 10);
      if (numScore !== foundSubject.val) {
        issues.push(`[SSOT雷达数值编造] 维度“${foundSubject.name}”真实得分为 ${foundSubject.val}，文案内编造写为 “${dim}${scoreStr}”`);
      }
    } else if (dim.length >= 2 && (match[0].includes('测出') || ['内核', '边界', '松弛', '焦虑', '要强', '果敢', '坦诚', '共情', '悦己', '信任', '责任', '随和', '淡漠', '反叛', '孤独', '讨好'].some(k => dim.includes(k)))) {
      const validNames = subjects.map(s => `${s.name}${s.val}`).join(' / ');
      issues.push(`[SSOT雷达指标编造] 发现编造维度 “${dim}${scoreStr}”，真实结果《${ssotResult.name}》雷达指标仅为: ${validNames}`);
    }
  }

  // 2. 检查金句 quote 引用
  if (ssotResult.raw.quote) {
    const trueQuote = ssotResult.raw.quote.replace(/[“”"'\s，。！？、]/g, '');
    const cleanBody = (card.bodyLines || []).join('\n');
    const bracketMatches = cleanBody.match(/【(.*?)】/g);
    if (bracketMatches) {
      for (const bm of bracketMatches) {
        const quoteSub = bm.replace(/[【】“”"'\s，。！？、]/g, '');
        if (quoteSub.length >= 4 && !trueQuote.includes(quoteSub) && !quoteSub.includes(trueQuote)) {
          issues.push(`[SSOT金句捏造] 引用金句 “${bm}” 未在真源中找到匹配，真源金句为: “${ssotResult.raw.quote}”`);
        }
      }
    }
  }

  return { issues, pass: issues.length === 0 };
}

/**
 * 复合卡片单卡检查
 */
function checkCard({ bodyLines = [], coverLines = [], title = '', tags = [], meta = '', profile = null, ssotResult = null, pinnedComment = '' }) {
  const ct = checkCoverAndTitle({ coverLines, title, meta });
  const b = checkBody({ bodyLines, coverLines, title });
  const t = checkTags(tags, profile, meta);
  const ssot = checkRadarAndSSOT({ card: { coverLines, title, bodyLines }, ssotResult, pinnedComment });

  const hardIssues = [...ct.issues, ...b.issues, ...t.issues, ...ssot.issues];
  const advisories = [...ct.advisories, ...b.advisories];

  return {
    coverPass: ct.pass,
    bodyPass: b.pass,
    tagPass: t.pass,
    ssotPass: ssot.pass,
    coverIssues: ct.issues,
    bodyIssues: b.issues,
    tagIssues: t.issues,
    ssotIssues: ssot.issues,
    issues: hardIssues,
    advisories,
    pass: hardIssues.length === 0,
    oralHits: b.oralHits,
    shortLines: b.shortLines,
    ht: { sceneCheck: b.sceneCheck },
  };
}

/**
 * 批次去同构引擎（仅保留 2 个硬检查，其余全部降为参考看板）
 * 硬检查 1: 原声对话与开篇事件不跨篇复用
 * 硬检查 2: 连续 3 篇句式骨架结构模式不完全相同
 */
function checkBatchCircuitBreakers(cardList = []) {
  const hardIssues = [];
  const styleAdvisories = [];

  if (!cardList || cardList.length === 0) {
    return {
      hardIssues: [],
      styleAdvisories: [],
      pass: true,
      stats: {},
    };
  }

  // ── 硬检查 1：原声对话与开篇事件不跨篇复用 ──
  const dialogueMap = new Map();
  const eventHeadMap = new Map();

  cardList.forEach(c => {
    if (!c.bodyLines || c.bodyLines.length === 0) return;
    // 检查首行开篇事件
    const head = c.bodyLines[0].trim();
    if (head.length >= 6) {
      if (!eventHeadMap.has(head)) eventHeadMap.set(head, []);
      eventHeadMap.get(head).push(c.cardNum);
    }
    // 提取正文引号内的原声对话
    const fullBody = c.bodyLines.join(' ');
    const dialogueMatches = fullBody.match(/[“"']([^”"']{6,})[”"']/g) || [];
    dialogueMatches.forEach(d => {
      const cleanD = d.replace(/[“"']/g, '').trim();
      if (!dialogueMap.has(cleanD)) dialogueMap.set(cleanD, []);
      dialogueMap.get(cleanD).push(c.cardNum);
    });
  });

  dialogueMap.forEach((cardNums, diag) => {
    if (cardNums.length > 1) {
      hardIssues.push(`[批次同构] 原声对话跨篇复用违规: “${diag}” 在卡号 [${cardNums.join(', ')}] 中被重复使用，必须独一无二！`);
    }
  });

  eventHeadMap.forEach((cardNums, headText) => {
    if (cardNums.length > 1) {
      hardIssues.push(`[批次同构] 开篇事件跨篇复用违规: “${headText}” 在卡号 [${cardNums.join(', ')}] 中完全一致，必须各自独立！`);
    }
  });

  // ── 硬检查 2：连续 3 篇句式骨架结构模式不完全相同 ──
  const classifyLine = (line) => {
    if (/[“"'].{4,}[”"']/.test(line)) return 'D'; // Dialogue 原声对话
    if (/手抖|手心|伸手|心疼|悬在|冷汗|编借口|本能|冷眼/.test(line)) return 'P'; // Physical 身体/生理动作
    if (/【.*】|卡片|锁屏|截图|底气|铠甲|撑伞/.test(line)) return 'Q'; // Quote 金句道具
    if (/下班|走人|关机|反锁|锁门|泡脚|洗菜|免打扰|推了|删了|换锁/.test(line)) return 'A'; // Action 生活定格
    if (/[？?吗吧]|对暗号|怎么推|集合|认领/.test(line)) return 'I'; // Interaction 互动暗号
    return 'E'; // Narrative Event 日常事件叙述
  };

  const skeletons = cardList.map(c => {
    if (!c.bodyLines || c.bodyLines.length === 0) return 'EMPTY';
    return c.bodyLines.map(classifyLine).join('->');
  });

  for (let i = 0; i < skeletons.length - 2; i++) {
    const s1 = skeletons[i];
    const s2 = skeletons[i + 1];
    const s3 = skeletons[i + 2];
    if (s1 !== 'EMPTY' && s1 === s2 && s2 === s3) {
      hardIssues.push(`[批次同构] 连续 3 篇卡片 (卡 ${cardList[i].cardNum}, ${cardList[i + 1].cardNum}, ${cardList[i + 2].cardNum}) 句式骨架模式完全相同: [${s1}]，必须打破流水线同构结构！`);
    }
  }

  // ── 降级参考指标统计（仅看板展示，不阻塞） ──
  const hezheCards = cardList.filter(c => c.bodyLines && c.bodyLines.some(l => l.includes('合着')));
  const cechuHeadCards = cardList.filter(c => c.bodyLines && c.bodyLines.length > 0 && /^测出/.test(c.bodyLines[0].trim()));
  const tauntingCards = cardList.filter(c => c.bodyLines && c.bodyLines.some(l => l.includes('你敢')));
  const youCards = cardList.filter(c => c.bodyLines && c.bodyLines.some(l => l.includes('你呢')));

  const oralWords = SD.ORAL_PERTURBATION_WORDS || [];
  const matchedMemes = new Set();
  cardList.forEach(c => {
    if (!c.bodyLines) return;
    oralWords.forEach(w => {
      if (c.bodyLines.some(l => l.includes(w))) matchedMemes.add(w);
    });
  });

  if (hezheCards.length > 2) {
    styleAdvisories.push(`[词频建议] 全批卡片包含 ${hezheCards.length} 篇“合着”，建议控制在 1 篇内提升词汇多样性`);
  }
  if (cechuHeadCards.length > 3) {
    styleAdvisories.push(`[破题建议] 全批首行以“测出”破题共 ${cechuHeadCards.length} 篇，建议多用日常事件直入`);
  }
  if (tauntingCards.length > 0) {
    styleAdvisories.push(`[语气建议] 发现 ${tauntingCards.length} 篇包含“你敢”，建议消除质问爹味`);
  }

  return {
    hardIssues,
    styleAdvisories,
    pass: hardIssues.length === 0,
    stats: {
      hezheCount: hezheCards.length,
      cechuHeadCount: cechuHeadCards.length,
      tauntingCount: tauntingCards.length,
      youCount: youCards.length,
      memeVarietyCount: matchedMemes.size,
      matchedMemes: Array.from(matchedMemes),
      skeletons,
    },
  };
}

function runCli() {
  const argv = process.argv.slice(2);
  const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
  const has = (k) => argv.includes(k);

  const FILE = arg('--file');
  const AUTO_FIX = has('--fix');

  if (!FILE) {
    console.error('用法: node "…/refine-notes.js" --file <文件路径> [--fix]');
    process.exit(1);
  }

  const filePath = path.resolve(FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(filePath, 'utf8');

  console.log(`\n🔍 开始全面合规与真实性审查: ${path.basename(filePath)} (模式: ${AUTO_FIX ? '自愈修复+核验' : '仅核验'})`);

  // 1. 红线词排查（产品词、医疗临床词、商业套路封杀词、发布代码）
  const REDLINE = [
    ...SD.REDLINE_WORDS.产品词,
    ...SD.REDLINE_WORDS.测试术语,
    ...SD.REDLINE_WORDS.医疗词,
    ...SD.REDLINE_WORDS.封杀词,
  ];

  let redlineHits = [];
  const linesAll = content.split('\n');
  linesAll.forEach((l, idx) => {
    if (l.startsWith('>') || l.startsWith('#')) return;
    REDLINE.forEach(word => {
      if (l.includes(word)) {
        redlineHits.push({ line: idx + 1, word, text: l.trim() });
      }
    });
    // CDP 自动发帖代码排查（硬门禁）
    if (/puppeteer|playwright|browser_publish|page\.goto.*publish|xhs_publish/.test(l)) {
      redlineHits.push({ line: idx + 1, word: '自动发布CDP代码', text: l.trim() });
    }
  });

  // 2. 切分各卡片并解析
  const parts = content.split(/(```text[\s\S]*?```)/g);
  let cardCount = 0;
  let hardFormatIssues = [];
  let allAdvisories = [];
  let fixLogs = [];

  const rootDir = SD.findRoot(filePath);
  const loadAllProfiles = (r) => {
    const map = new Map();
    if (SD.listTests) {
      const tNames = SD.listTests(r);
      tNames.forEach(tName => {
        try {
          const pFile = SD.profilePath(r, tName);
          if (fs.existsSync(pFile)) {
            const prof = SD.parseProfile(pFile);
            map.set(tName, prof);
          }
        } catch (e) {}
      });
    }
    return map;
  };
  const profilesMap = loadAllProfiles(rootDir);

  // 缓存各测试数据源
  const resultsCache = new Map();
  const getResultsForProfile = (prof) => {
    if (!prof || !prof.dataSource) return [];
    if (resultsCache.has(prof.test)) return resultsCache.get(prof.test);
    try {
      const res = SD.loadResults(rootDir, prof.dataSource);
      resultsCache.set(prof.test, res);
      return res;
    } catch (e) {
      return [];
    }
  };

  const resolveCardProfile = ({ meta = '', tags = [], filePath = '', surroundingText = '' }) => {
    for (const [tName, prof] of profilesMap.entries()) {
      if (filePath.includes(tName)) return prof;
    }
    if (meta) {
      for (const [tName, prof] of profilesMap.entries()) {
        if (meta.includes(tName)) return prof;
      }
      if (meta.includes('大女主')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('大女主')) return prof;
        }
      }
      if (meta.includes('城市')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('城市')) return prof;
        }
      }
      if (meta.includes('命定') || meta.includes('恋人')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('恋人')) return prof;
        }
      }
      if (meta.includes('物种')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('物种')) return prof;
        }
      }
      if (meta.includes('内耗')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('内耗')) return prof;
        }
      }
    }
    if (surroundingText) {
      for (const [tName, prof] of profilesMap.entries()) {
        if (surroundingText.includes(tName)) return prof;
      }
    }
    if (tags && tags.length > 0) {
      for (const [, prof] of profilesMap.entries()) {
        if (tags.includes(prof.brandTag) || tags.includes(prof.categoryTag)) return prof;
      }
    }
    return null;
  };

  const validCards = [];
  const refinedParts = parts.map((part, pIdx) => {
    if (!part.startsWith('```text')) return part;
    cardCount++;

    const textMatch = part.match(/```text([\s\S]*?)```/);
    if (!textMatch) return part;

    const rawBody = textMatch[1].trim();
    let meta = '';
    const prev = parts[pIdx - 1] || '';
    const next = parts[pIdx + 1] || '';
    const mNext = next.match(/^\s*`([^`]*结果=[^`]*)`/);
    const mPrev = prev.match(/`([^`]*结果=[^`]*)`\s*$/);
    if (mNext) meta = mNext[1];
    else if (mPrev) meta = mPrev[1];

    // 提取置顶首评
    let pinnedComment = '';
    const mComment = next.match(/(?:置顶首评|首评)[：:]\s*(?:<br>|\n\s*)?>?\s*`?([^`\r\n]+)`?/);
    if (mComment) pinnedComment = mComment[1].trim();

    const lines = rawBody.split('\n').map(l => l.trim()).filter(Boolean);
    let newLines = [];
    let inBody = false;

    let coverLines = [];
    let titleStr = '';
    let fixedTitle = '';
    let tagLine = '';
    let bodyLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.startsWith('<!--')) continue;

      if (line.startsWith('#')) {
        inBody = false;
        tagLine = line;
        newLines.push(line);
        continue;
      }

      if (line.startsWith('[标题]')) {
        inBody = true;
        titleStr = line.replace('[标题]', '').trim();
        fixedTitle = titleStr;
        if (fixedTitle.length > 20 && AUTO_FIX) {
          // 标题超长绝不粗暴截字，仅打出建议日志由作者人工精简，保护语义完整
          fixLogs.push(`[WARN 卡 ${cardCount}] 标题超长 (${fixedTitle.length} 字 > 20 字)，已保留原句，建议人工精简: "${titleStr}"`);
        }
        newLines.push(`[标题]${fixedTitle}`);
        continue;
      }

      if (!inBody) {
        coverLines.push(line.replace('[封面]', '').trim());
        newLines.push(line);
      } else {
        newLines.push(line);
        bodyLines.push(line);
      }
    }

    let tags = tagLine ? tagLine.split(/\s+/).filter(Boolean) : [];
    const surroundingText = prev + '\n' + next;
    const cardProfile = resolveCardProfile({ meta, tags, filePath, surroundingText });
    const allResults = getResultsForProfile(cardProfile);

    // 匹配真实 SSOT 结果
    let ssotResult = null;
    let rName = '';
    if (meta) {
      const mResult = meta.match(/结果=([^｜|]+)/);
      if (mResult) rName = mResult[1].trim();
    }
    if (!rName && tags && tags.length > 2) {
      rName = tags[2].replace(/^#/, '').trim();
    }
    if (rName && allResults.length > 0) {
      ssotResult = allResults.find(r => r.name === rName || r.name.includes(rName) || rName.includes(r.name));
    }
    if (!ssotResult && meta && allResults.length > 0) {
      const mCardId = meta.match(/cardId=([a-zA-Z0-9]+)/);
      if (mCardId) {
        const cIdPrefix = mCardId[1].split('_')[0]; // e.g. r1, r2, r5
        ssotResult = allResults.find(r => r.id === cIdPrefix || `r${r.idx}` === cIdPrefix);
      }
    }

    // 单卡门禁审查
    const cardCheck = checkCard({
      bodyLines,
      coverLines,
      title: fixedTitle || titleStr,
      tags,
      meta,
      profile: cardProfile,
      ssotResult,
      pinnedComment,
    });

    cardCheck.issues.forEach(iss => hardFormatIssues.push({ card: cardCount, text: iss }));
    cardCheck.advisories.forEach(adv => allAdvisories.push({ card: cardCount, text: adv }));

    validCards.push({
      cardNum: cardCount,
      coverLines: [...coverLines],
      title: fixedTitle || titleStr,
      bodyLines: [...bodyLines],
      tags: [...tags],
      meta,
      pinnedComment,
      ssotResult,
    });

    return '```text\n' + newLines.join('\n') + '\n```';
  });

  if (AUTO_FIX) {
    fs.writeFileSync(filePath, refinedParts.join(''), 'utf8');
    console.log(`💾 自动修复已规范写回原文件。`);
    if (fixLogs.length > 0) {
      console.log(`\n🛠️  执行了以下 ${fixLogs.length} 项自愈调整:`);
      fixLogs.forEach(log => console.log(`   ${log}`));
    }
  }

  // 汇总硬门禁看板
  console.log(`\n📊 机审硬门禁看板 (扫描卡片: ${cardCount} 张):`);

  if (redlineHits.length) {
    console.log(`❌ 1. 0词表与合规违规 (${redlineHits.length} 处):`);
    redlineHits.forEach(h => console.log(`   第 ${h.line} 行 [${h.word}]: ${h.text}`));
  } else {
    console.log(`✅ 1. 0词表与合规门禁：0 违规（产品词/临床医疗词/商业套路词/CDP发布 全绿）`);
  }

  const ssotIssues = hardFormatIssues.filter(i => i.text.includes('SSOT') || i.text.includes('结果名编造'));
  if (ssotIssues.length > 0) {
    console.log(`❌ 2. SSOT 真源防编造违规 (${ssotIssues.length} 处):`);
    ssotIssues.forEach(i => console.log(`   · [卡 ${i.card}] ${i.text}`));
  } else {
    console.log(`✅ 2. SSOT 真源防编造门禁：0 违规（结果名/雷达维度与得分/金句原文 全部吻合真源）`);
  }

  const formatOnlyIssues = hardFormatIssues.filter(i => !i.text.includes('SSOT') && !i.text.includes('结果名编造'));
  if (formatOnlyIssues.length > 0) {
    console.log(`❌ 3. 版式与标签硬门禁违规 (${formatOnlyIssues.length} 处):`);
    formatOnlyIssues.forEach(i => console.log(`   · [卡 ${i.card}] ${i.text}`));
  } else {
    console.log(`✅ 3. 版式与标签硬门禁：全部达标（封面 2~4 行 ≤16 字、标题 ≤20 字、标签恰好 5 个）`);
  }

  // 批次去同构体检
  const batchResult = checkBatchCircuitBreakers(validCards);
  if (batchResult.hardIssues.length > 0) {
    console.log(`❌ 4. 批次去同构硬门禁违规 (${batchResult.hardIssues.length} 处):`);
    batchResult.hardIssues.forEach(iss => console.log(`   · ${iss}`));
  } else {
    console.log(`✅ 4. 批次去同构硬门禁：全部通过（原声对话不跨篇复用、事件不跨篇复用、连续3篇骨架不同构）`);
  }

  // 风格灵感看板（非阻塞建议）
  console.log(`\n💡 写作灵感与网感参考看板 (非阻塞建议，仅供写手参考):`);
  console.log(`   · 全批热梗覆盖度: ${batchResult.stats.memeVarietyCount || 0} 种 (${(batchResult.stats.matchedMemes || []).slice(0, 8).join('/') || '无'})`);
  console.log(`   · “合着”口语词出现篇数: ${batchResult.stats.hezheCount || 0} 篇`);
  console.log(`   · “测出”首行破题篇数: ${batchResult.stats.cechuHeadCount || 0} 篇`);
  console.log(`   · 挑衅质问句“你敢”篇数: ${batchResult.stats.tauntingCount || 0} 篇`);
  console.log(`   · 骨架结构模式概览: [${(batchResult.stats.skeletons || []).join(', ')}]`);

  if (allAdvisories.length > 0) {
    console.log(`\n💡 正文细节优化灵感建议 (共 ${allAdvisories.length} 条，不阻断发帖):`);
    allAdvisories.slice(0, 6).forEach(a => console.log(`   · [卡 ${a.card}] ${a.text}`));
    if (allAdvisories.length > 6) {
      console.log(`   ... 其余 ${allAdvisories.length - 6} 条灵感建议已折叠`);
    }
  }

  console.log(``);

  const hasFatalErrors = redlineHits.length > 0 || hardFormatIssues.length > 0 || !batchResult.pass;
  if (hasFatalErrors) {
    console.error(`🛑 审查未通过：存在上述硬门禁违规，必须修正后方可进入下一流程！`);
    process.exit(1);
  } else {
    console.log(`🎉 恭喜！全项机审硬门禁 100% 满分通过！可以安全推进！\n`);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  detectCoverRhythm,
  checkCardRhythmAndPerturbation,
  checkCoverAndTitle,
  checkBody,
  checkTags,
  checkRadarAndSSOT,
  checkCard,
  checkBatchCircuitBreakers,
  runCli,
};
