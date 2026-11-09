// refine-notes.js · 通用发帖文案一键排版规整、红线排查与格式核验工具
//
// 适用全业务 5 大测试：
//   - 命定恋人 / 深度情绪内耗 / 恋爱物种领养中心 / 大女主觉醒测试 / 性格城市匹配
//
// 用法:
//   node ".agent/skills/xhs-note-operator/scripts/refine-notes.js" --file "design/product-docs/性格城市匹配/docs/2026-09-25_发帖文案.md" [--fix]
//
// 功能：
//   1. 自动扫描 4 个 0 词表（产品词、测试术语、医疗词、封杀词）；
//   2. 自动检测并智能断行：确保正文每行严格 <= 15 字；
//   3. 自动检测并修剪标题：确保标题严格 <= 20 字；
//   4. 检查封面长短板（有一行 <=4 字且有一行 >=6 字，行长差 >=3 字，总字数 <=16 字）；
//   4b. 3 行封面必须落成「长短长」或「短长短」（短≤4 / 长≥6）；
//   5. 检查标签严格 5 个；
//   6. 搭配 --fix 参数时自动写回修复。

/** @returns {'长短长'|'短长短'|'长短'|'短长'|null} */
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
    // 4 行只要具备短板+长板且非全齐，仍算过（节奏标签放宽）
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    if (min <= 4 && max >= 6 && max - min >= 3) return '长短错落';
    return null;
  }
  return null;
}

const fs = require('fs');
const path = require('path');
const SD = require(path.join(__dirname, 'skill-data.js'));

function checkCardRhythmAndPerturbation(bodyLines) {
  const issues = [];
  const oralWords = SD.ORAL_PERTURBATION_WORDS || [];
  const oralHits = oralWords.filter(w => bodyLines.some(l => l.includes(w)));
  if (bodyLines.length > 0 && oralHits.length < 2) {
    issues.push(
      `[正文网感] 口语虚词扰动不足 2 种 (现 ${oralHits.length} 种)，偏向公文化/AI排比，建议注入：${oralWords.slice(0, 4).join('/')} 等`
    );
  }

  const shortLines = bodyLines.filter(l => l.length <= 6 && !l.startsWith('#') && !l.startsWith('['));
  if (bodyLines.length >= 4 && shortLines.length < 2) {
    issues.push(`[正文节奏] 缺少 ≤6 字短行停顿 (现 ${shortLines.length} 处，要求至少 2 处)，读感均称如一堵墙`);
  }
  return {
    oralHits,
    shortLines,
    issues,
    pass: issues.length === 0,
  };
}

/**
 * 1. 封面与标题机审门禁
 * 只查：钩子强度与白名单、0 词表、字数规范（封面 2~4 行、短<=4、长>=6、总字数<=16；标题<=20字）、模式一数字量纲
 * 绝对严禁使用“无生活场景实物”去判封面/标题不合格！
 */
function checkCoverAndTitle({ coverLines = [], title = '', meta = '' }) {
  const issues = [];

  if (title && title.length > 20) {
    issues.push(`[标题字数] 标题超长 (${title.length} 字): ${title}`);
  }

  const cLengths = coverLines.map(l => l.length);
  const minLen = Math.min(...cLengths);
  const maxLen = Math.max(...cLengths);
  const totalCover = cLengths.reduce((a, b) => a + b, 0);

  if (coverLines.length < 2 || coverLines.length > 4) {
    issues.push(`[封面行数] 须为 2~4 行 (现 ${coverLines.length} 行): [${coverLines.join(' / ')}]`);
  }
  if (totalCover > 16) {
    issues.push(`[封面字数] 封面总字数超16字 (${totalCover} 字): [${coverLines.join(' / ')}]`);
  }
  if (!(minLen <= 4 && maxLen >= 6)) {
    issues.push(`[封面长短] 未满足短板<=4且长板>=6 (短:${minLen}, 长:${maxLen}): [${coverLines.join(' / ')}]`);
  }
  const rhythm = detectCoverRhythm(cLengths);
  if (!rhythm) {
    issues.push(`[封面节奏] 封面节奏不合格，现 [${cLengths.join('/')}] → [${coverLines.join(' / ')}]`);
  }

  // 模式一数字量纲校验
  if (meta && meta.includes('模式=模式一')) {
    const hasNum = coverLines.some(l => /\d/.test(l) || /%|％/.test(l));
    if (!hasNum) {
      issues.push(`[封面量纲] 模式一封面缺少阿拉伯数字/百分比量纲: [${coverLines.join(' / ')}]`);
    }
  }

  return {
    issues,
    pass: issues.length === 0,
  };
}

/**
 * 2. 正文机审门禁（唠家常、因果主语连贯、前3行逻辑闭环与场景情节、口语虚词、短行停顿）
 * 注意：收尾微动作留白为可选！正文聊天唠家常，说到哪算哪，说完就停，允许停在测试转折句本身（如“那里才适合我”）。
 */
function checkBody({ bodyLines = [], coverLines = [], title = '' }) {
  const issues = [];
  if (!bodyLines || bodyLines.length === 0) return { issues, pass: true };

  // 单行字数
  bodyLines.forEach((l, idx) => {
    if (l.length > 15) {
      issues.push(`[正文单行] 第 ${idx + 1} 行单行超15字 (${l.length} 字): ${l}`);
    }
  });

  // 口语虚词与短行停顿
  const rp = checkCardRhythmAndPerturbation(bodyLines);
  issues.push(...rp.issues);

  // 前 3 行生活场域实物微动作或日常情节
  const sceneCheck = SD.detectSceneAction ? SD.detectSceneAction(bodyLines.slice(0, 3)) : { hit: true };
  // 日常高频唠家常生活实物补充
  const dailyLifeEntities = [
    '暖宝宝', '棉袄', '羽绒服', '大骨汤', '电饭煲', '自提柜', '拖鞋', '玻璃杯', '被子',
    '暖气', '泡面', '奶茶', '抹布', '白霜', '冷风', '手凉', '虾', '桌子', '耳机',
    '外卖', '手机', '床', '窗帘', '门', '钥匙', '包'
  ];
  const hasDailyEntity = bodyLines.slice(0, 3).some(line => dailyLifeEntities.some(ent => line.includes(ent)));

  if (!sceneCheck.hit && !hasDailyEntity) {
    issues.push(`[正文人味] 正文前 3 行缺失生活场域道具或具体物理情节（无生活实物与具象细节），属于空对空抽象议论`);
  }

  // 逻辑闭环：标题或封面若提出核心冲突/事件/具象指称，正文前 3 行必须有具体情节交代承接
  const combinedHeader = `${coverLines.join(' ')} ${title}`;
  const keyEventKeywords = ['暖冬', '降温', '冷透', '冻僵', '冻死', '受够了', '打碎碗', '龙虾', '拉黑', '退群', '借钱', '加班', '工牌', '门禁卡', '暖气', '羽绒服', '旧棉袄', '发烧', '退烧药'];
  for (const kw of keyEventKeywords) {
    if (combinedHeader.includes(kw)) {
      const top3 = bodyLines.slice(0, 3);
      const bodyHasEcho = top3.some(l => l.includes(kw)) ||
        (kw === '暖冬' && top3.some(l => l.includes('暖') || l.includes('冷') || l.includes('冻') || l.includes('温') || l.includes('凉'))) ||
        (kw === '降温' && top3.some(l => l.includes('冷') || l.includes('风') || l.includes('冻') || l.includes('霜') || l.includes('凉'))) ||
        (kw === '冷透' && top3.some(l => l.includes('冷') || l.includes('风') || l.includes('凉') || l.includes('冻'))) ||
        (kw === '冻僵' && top3.some(l => l.includes('冻') || l.includes('凉') || l.includes('冷') || l.includes('冰') || l.includes('僵') || l.includes('手'))) ||
        (kw === '冻死' && top3.some(l => l.includes('冻') || l.includes('冷') || l.includes('风') || l.includes('冰') || l.includes('凉') || l.includes('透'))) ||
        (kw === '受够了' && top3.some(l => l.includes('冷') || l.includes('冻') || l.includes('风') || l.includes('吹') || l.includes('烦') || l.includes('够'))) ||
        (kw === '旧棉袄' && (top3.some(l => l.includes('棉袄') || l.includes('衣服') || l.includes('穿') || l.includes('冷') || l.includes('冻')) || bodyLines.some(l => l.includes('棉袄')))) ||
        (kw === '加班' && top3.some(l => l.includes('加班') || l.includes('群') || l.includes('工牌') || l.includes('工位') || l.includes('领导') || l.includes('九点') || l.includes('十点'))) ||
        (kw === '工牌' && top3.some(l => l.includes('工牌') || l.includes('打卡') || l.includes('工位') || l.includes('包'))) ||
        (kw === '门禁卡' && top3.some(l => l.includes('门禁') || l.includes('钥匙') || l.includes('茶几') || l.includes('玄关'))) ||
        (kw === '打碎碗' && top3.some(l => l.includes('杯') || l.includes('碎') || l.includes('碗') || l.includes('地'))) ||
        (kw === '龙虾' && top3.some(l => l.includes('虾') || l.includes('吃') || l.includes('夹'))) ||
        (kw === '退群' && top3.some(l => l.includes('群') || l.includes('退') || l.includes('免打扰') || l.includes('消息'))) ||
        (kw === '借钱' && top3.some(l => l.includes('借') || l.includes('钱') || l.includes('转账') || l.includes('还')));
      if (!bodyHasEcho) {
        issues.push(`[正文逻辑闭环] 封面/标题承诺了“${kw}”，正文前 3 行未见对应情节交代，割裂悬空`);
      }
    }
  }

  // 严禁跳过今日钩子直接跳进回忆（若封面/标题承诺了今日寒潮槽点，正文前 2 行必须有今日受冻体感，不可直接首行跳小时候）
  const hasTodayColdHook = /暖冬|冻死|降温|受够了/.test(combinedHeader);
  if (hasTodayColdHook && bodyLines.length > 0) {
    const isDirectMemory = /^(小时候|小时候那件|我小时候|记得小时候)/.test(bodyLines[0].trim());
    const top3HasTodayCold = bodyLines.slice(0, 3).some(l => /今天|出门|风吹|冷风|吹透|手套|手.*凉|手.*冰/.test(l));
    if (isDirectMemory || !top3HasTodayCold) {
      issues.push(`[正文逻辑闭环] 封面/标题承诺了今日寒潮槽点，正文前 3 行未交代今日受冻体感/动作，直接跳入回忆，钩子割裂悬空`);
    }
  }

  // 严禁碎片行：每行都要有主语/时间/动作/因果连贯，严禁孤立天气报或无主语状态碎片
  const FRAGMENT_PATTERN = /^(风(也|真|太|也太|真的太)?(凶|大|猛|冷)了?|天气(太|真|好|实在太)冷了?|真(冻人|冷啊?)|冷死(我|人)了?|我?(冻透|冷透|冻僵)了|冷风(好大|太凶)|太冷了|好冷啊|外面真冷)$/;
  bodyLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (FRAGMENT_PATTERN.test(trimmed)) {
      issues.push(`[正文碎片行] 第 ${idx + 1} 行 "${line}" 属于无时间/动作/因果的天气报或孤立碎片，必须改为带主语+动作+因果的具体连贯叙事（如“我放学跑回家，手冻得握不住笔”）`);
    }
  });

  // 道具前后交代闭环：正文里不许出现前面没交代过的道具，凡是正文里第一次出现的实物（伞、雨、车等），前面 3 行或标题/封面里必须出现过
  // 反面典型：寒衣节内耗那篇，正文前 8 行没雨没伞，最后一句突然写“我都忘了能跟谁借伞”
  const UNANCHORED_PROPS = [
    { prop: '伞', keywords: ['伞', '雨伞', '借伞', '打伞', '撑伞', '收伞'], anchorTerms: ['伞', '雨', '阴天', '下雨'] },
    { prop: '雨', keywords: ['淋雨', '暴雨', '雨水', '冒雨', '被雨淋'], anchorTerms: ['雨', '天气', '下雨', '阴雨'] },
    { prop: '车', keywords: ['打车', '出租车', '末班车', '公交车', '方向盘', '车牌'], anchorTerms: ['车', '打车', '通勤', '下班', '回家', '路上', '加班'] }
  ];
  const headerAndTop3 = `${combinedHeader} ${bodyLines.slice(0, 3).join(' ')}`;
  for (const item of UNANCHORED_PROPS) {
    for (let i = 3; i < bodyLines.length; i++) {
      const line = bodyLines[i];
      const matchWord = item.keywords.find(kw => line.includes(kw));
      if (matchWord) {
        const isAnchored = item.anchorTerms.some(term => headerAndTop3.includes(term));
        if (!isAnchored) {
          issues.push(`[道具未提前交代] 第 ${i + 1} 行首次出现实物道具“${matchWord}”，但封面/标题及前 3 行从未交代或铺垫过，属于后半段突兀天降道具（如前文无雨无伞文末突然天降借伞），判不合格重写`);
        }
        break;
      }
    }
  }

  // 第二人称说教句式排查
  bodyLines.forEach((line, idx) => {
    if (SD.PREACHY_PATTERN && SD.PREACHY_PATTERN.test(line)) {
      issues.push(`[正文说教] 第 ${idx + 1} 行出现第二人称说教句式: "${line}"`);
    }
  });

  // 末行假大空宣誓升华排查（放行唠家常聊完即停、放行测试转折句如“那里才适合我”、“难怪我每年冬天都难受”）
  // 钩子口号只许在封面/标题，正文结尾绝对不许喊口号！正文只能停在测试转折句本身
  const lastLine = bodyLines[bodyLines.length - 1] || '';
  if (SD.SLOGAN_END_PATTERN && SD.SLOGAN_END_PATTERN.test(lastLine)) {
    if (!lastLine.includes('适合我') && !lastLine.includes('老家')) {
      issues.push(`[正文宣誓] 末行违规出现宣誓口号: "${lastLine}" (钩子口号只许在封面/标题，正文只能停在测试转折句本身)`);
    }
  }

  return {
    issues,
    pass: issues.length === 0,
    oralHits: rp.oralHits,
    shortLines: rp.shortLines,
    sceneCheck,
  };
}

/**
 * 3. 标签与画像机审（品牌词、品类词、结果名核验）
 */
function checkTags(tags = [], profile = null, meta = '') {
  const issues = [];
  if (tags && tags.length > 0 && tags.length !== 5) {
    issues.push(`[标签数量] 标签数不等于5 (${tags.length} 个)`);
  }
  if (profile) {
    // 品牌词校验
    if (tags && tags.length > 0 && profile.brandTag) {
      if (tags[0] !== profile.brandTag) {
        issues.push(`[品牌词错误] 品牌标签为“${tags[0]}”，但在测试画像《${profile.test}》中位1品牌词为“${profile.brandTag}”，不许只数标签够5个就放过！`);
      }
    }
    // 品类词校验
    if (tags && tags.length > 1 && profile.categoryTag) {
      if (tags[1] !== profile.categoryTag) {
        issues.push(`[品类词错误] 品类标签为“${tags[1]}”，但在测试画像《${profile.test}》中位2品类词为“${profile.categoryTag}”`);
      }
    }
  }

  // 结果名核真校验
  if (profile && profile.accents && profile.accents.length > 0) {
    let rName = '';
    if (meta) {
      const mResult = meta.match(/结果=([^｜|]+)/);
      if (mResult) rName = mResult[1].trim();
    }
    if (rName) {
      const matched = profile.accents.some(a => {
        const aClean = a.name.split('（')[0].split('(')[0].trim();
        return a.name === rName || a.name.includes(rName) || rName.includes(aClean)
          || (a.name.includes(`（${rName}）`)) || (a.name.includes(`(${rName})`));
      });
      if (!matched) {
        const validNames = profile.accents.map(a => a.name.split('（')[0].trim()).join(' / ');
        issues.push(`[结果名编造] 结果名“${rName}”在测试画像《${profile.test}》中不存在！画像合法真实结果为: ${validNames}`);
      }
    }
  }

  return {
    issues,
    pass: issues.length === 0,
  };
}

function checkCard({ bodyLines = [], coverLines = [], title = '', tags = [], meta = '', profile = null }) {
  const ct = checkCoverAndTitle({ coverLines, title, meta });
  const b = checkBody({ bodyLines, coverLines, title });
  const t = checkTags(tags, profile, meta);

  return {
    coverPass: ct.pass,
    bodyPass: b.pass,
    tagPass: t.pass,
    coverIssues: ct.issues,
    bodyIssues: b.issues,
    tagIssues: t.issues,
    issues: [...ct.issues, ...b.issues, ...t.issues],
    pass: ct.pass && b.pass && t.pass,
    oralHits: b.oralHits,
    shortLines: b.shortLines,
    ht: { sceneCheck: b.sceneCheck },
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

  console.log(`\n🔍 开始全面审查与格式规整: ${path.basename(filePath)} (模式: ${AUTO_FIX ? '自动修复+核验' : '仅核验'})`);

  // 1. 红线词排查
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
  });

  // 2. 切分各卡片（兼容元数据在代码块前或代码块后）
  const parts = content.split(/(```text[\s\S]*?```)/g);
  let cardCount = 0;
  let formatIssues = [];
  let fixLogs = [];

  const rootDir = SD.findRoot(filePath);
  // 预加载所有测试画像
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

  // 根据路径/元数据/标签/上下文精确解析卡片所属的测试画像
  const resolveCardProfile = ({ meta = '', tags = [], filePath = '', surroundingText = '' }) => {
    for (const [tName, prof] of profilesMap.entries()) {
      if (filePath.includes(tName)) return prof;
    }
    if (meta) {
      for (const [tName, prof] of profilesMap.entries()) {
        if (meta.includes(tName)) return prof;
      }
      if (meta.includes('大女主') || meta.includes('dame')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('大女主')) return prof;
        }
      }
      if (meta.includes('城市') || meta.includes('city')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('城市')) return prof;
        }
      }
      if (meta.includes('命定') || meta.includes('恋人') || meta.includes('destiny')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('恋人')) return prof;
        }
      }
      if (meta.includes('物种') || meta.includes('species')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('物种')) return prof;
        }
      }
      if (meta.includes('内耗') || meta.includes('friction')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('内耗')) return prof;
        }
      }
      const mRes = meta.match(/结果=([^｜|]+)/);
      if (mRes) {
        const r = mRes[1].trim();
        for (const [, prof] of profilesMap.entries()) {
          if (prof.accents && prof.accents.some(a => a.name.includes(r) || r.includes(a.name.split('（')[0].trim()))) {
            return prof;
          }
        }
      }
    }
    if (surroundingText) {
      for (const [tName, prof] of profilesMap.entries()) {
        if (surroundingText.includes(tName)) return prof;
      }
      if (surroundingText.includes('大女主')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('大女主')) return prof;
        }
      }
      if (surroundingText.includes('城市') || surroundingText.includes('性格城市') || surroundingText.includes('城市人格')) {
        for (const [tName, prof] of profilesMap.entries()) {
          if (tName.includes('城市')) return prof;
        }
      }
    }
    if (tags && tags.length > 0) {
      for (const [, prof] of profilesMap.entries()) {
        if (tags.includes(prof.brandTag) || tags.includes(prof.categoryTag)) return prof;
      }
    }
    return null;
  };

  const refinedParts = parts.map((part, pIdx) => {
    if (!part.startsWith('```text')) return part;
    cardCount++;

    const textMatch = part.match(/```text([\s\S]*?)```/);
    if (!textMatch) return part;

    const rawBody = textMatch[1].trim();
    let meta = '';
    const prev = parts[pIdx - 1] || '';
    const next = parts[pIdx + 1] || '';
    // 机读元数据写在代码块后：优先取 next，避免误吃上一张卡的「模式=」
    const mNext = next.match(/^\s*`([^`]*结果=[^`]*)`/);
    const mPrev = prev.match(/`([^`]*结果=[^`]*)`\s*$/);
    if (mNext) meta = mNext[1];
    else if (mPrev) meta = mPrev[1];

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
        if (fixedTitle.length > 20) {
          if (AUTO_FIX) {
            if (fixedTitle.includes('（') && fixedTitle.includes('）')) {
              const m = fixedTitle.match(/^(.*?)（(.*?)）$/);
              if (m) {
                let pre = m[1], post = m[2];
                let maxPre = 20 - post.length - 2;
                if (pre.length > maxPre) pre = pre.slice(0, maxPre);
                fixedTitle = `${pre}（${post}）`;
              }
            }
            if (fixedTitle.length > 20) fixedTitle = fixedTitle.slice(0, 20);
            fixLogs.push(`[FIXED 卡 ${cardCount}] 标题超长修剪至 20 字以内: "${titleStr}" -> "${fixedTitle}"`);
          }
        }
        newLines.push(`[标题]${fixedTitle}`);
        continue;
      }

      if (!inBody) {
        // 封面行
        coverLines.push(line.replace('[封面]', '').trim());
        newLines.push(line);
      } else {
        // 正文行
        let processedLine = line;
        // 如果开启 AUTO_FIX 且命中第二人称说教，机械替换为第一人称
        if (AUTO_FIX && SD.PREACHY_PATTERN && SD.PREACHY_PATTERN.test(processedLine)) {
          const orig = processedLine;
          processedLine = processedLine
            .replace(/你是不是也经常/g, '我有时候也经常')
            .replace(/你是不是经常/g, '我有时候经常')
            .replace(/你是不是/g, '我有时候')
            .replace(/你记住/g, '我一直记得')
            .replace(/劝你/g, '索性')
            .replace(/你不必/g, '我不再')
            .replace(/你应该/g, '我打算')
            .replace(/你得明白/g, '我后来才明白');
          if (orig !== processedLine) {
            fixLogs.push(`[FIXED 卡 ${cardCount}] 第二人称转为第一人称叙述: "${orig}" -> "${processedLine}"`);
          }
        }

        if (processedLine.length <= 15) {
          newLines.push(processedLine);
          bodyLines.push(processedLine);
        } else {
          if (AUTO_FIX) {
            // 智能断行算法
            const splitLine = (s) => {
              if (s.length <= 15) return [s];
              const puncs = ['，', '。', '！', '？', '；', '：', '”', '、', ' '];
              let bestIdx = -1;
              for (let p of puncs) {
                let idx = s.indexOf(p);
                while (idx !== -1) {
                  if (idx + 1 <= 15 && (s.length - idx - 1) <= 15) {
                    bestIdx = idx + 1;
                    break;
                  }
                  idx = s.indexOf(p, idx + 1);
                }
                if (bestIdx !== -1) break;
              }
              if (bestIdx === -1) {
                for (let p of puncs) {
                  let idx = s.lastIndexOf(p, 14);
                  if (idx > 3) {
                    bestIdx = idx + 1;
                    break;
                  }
                }
              }
              if (bestIdx === -1) {
                bestIdx = Math.min(12, Math.floor(s.length / 2));
              }
              const head = s.slice(0, bestIdx).trim();
              const tail = s.slice(bestIdx).trim();
              return [...splitLine(head), ...splitLine(tail)];
            };
            const pieces = splitLine(processedLine);
            pieces.forEach(p => { if (p) { newLines.push(p); bodyLines.push(p); } });
            fixLogs.push(`[FIXED 卡 ${cardCount}] 正文超长行智能断行 (${processedLine.length}字 -> ${pieces.length}行): "${processedLine}"`);
          } else {
            newLines.push(processedLine);
            bodyLines.push(processedLine);
          }
        }
      }
    }

    // AUTO_FIX: 末行宣誓口号机械剥离
    if (AUTO_FIX && bodyLines.length > 0) {
      const lastLine = bodyLines[bodyLines.length - 1];
      if (SD.SLOGAN_END_PATTERN && SD.SLOGAN_END_PATTERN.test(lastLine)) {
        // 从 bodyLines 和 newLines 中剔除该末行
        bodyLines.pop();
        const tagIdx = newLines.findIndex(l => l.startsWith('#'));
        if (tagIdx !== -1) {
          // 标签行前一行即为末行
          const removed = newLines.splice(tagIdx - 1, 1)[0];
          fixLogs.push(`[FIXED 卡 ${cardCount}] 自动剔除末行宣誓口号: "${removed}"`);
        } else {
          const removed = newLines.pop();
          fixLogs.push(`[FIXED 卡 ${cardCount}] 自动剔除末行宣誓口号: "${removed}"`);
        }
      }
    }

    // 校验与自愈标签数（对照测试画像真源）
    let tags = tagLine ? tagLine.split(/\s+/).filter(Boolean) : [];
    const surroundingText = prev + '\n' + next;
    const cardProfile = resolveCardProfile({ meta, tags, filePath, surroundingText });

    if (tagLine) {
      if (cardProfile && AUTO_FIX) {
        if (tags.length > 0 && cardProfile.brandTag && tags[0] !== cardProfile.brandTag) {
          const old = tags[0];
          tags[0] = cardProfile.brandTag;
          fixLogs.push(`[FIXED 卡 ${cardCount}] 修正位1品牌词: "${old}" -> "${cardProfile.brandTag}"`);
        }
        if (tags.length > 1 && cardProfile.categoryTag && tags[1] !== cardProfile.categoryTag) {
          const old = tags[1];
          tags[1] = cardProfile.categoryTag;
          fixLogs.push(`[FIXED 卡 ${cardCount}] 修正位2品类词: "${old}" -> "${cardProfile.categoryTag}"`);
        }
      }
      if (tags.length !== 5) {
        if (AUTO_FIX) {
          if (tags.length > 5) {
            const cutTags = tags.slice(0, 5);
            tags = cutTags;
            fixLogs.push(`[FIXED 卡 ${cardCount}] 标签超过 5 个，自动裁剪前 5 个: ${cutTags.join(' ')}`);
          } else {
            // tags.length < 5
            const padTags = cardProfile ? [cardProfile.brandTag, cardProfile.categoryTag] : [];
            for (const ft of padTags) {
              if (ft && !tags.includes(ft) && tags.length < 5) {
                tags.push(ft);
              }
            }
            if (tags.length === 5) {
              fixLogs.push(`[FIXED 卡 ${cardCount}] 补齐测试固定品牌/品类标签至 5 个: ${tags.join(' ')}`);
            } else {
              newLines.push(`<!-- [REWRITE_REQUIRED: 标签数不足5个且无法自动确定真实标签] -->`);
            }
          }
        }
      }
      if (AUTO_FIX) {
        const tagIdx = newLines.findIndex(l => l.startsWith('#'));
        if (tagIdx !== -1) {
          newLines[tagIdx] = tags.join(' ');
        }
      }
    }

    // 分层执行机审校验
    const ct = checkCoverAndTitle({ coverLines, title: fixedTitle, meta });
    const b = checkBody({ bodyLines, coverLines, title: fixedTitle });
    const t = checkTags(tags, cardProfile, meta);

    ct.issues.forEach(i => formatIssues.push({ type: 'cover', card: cardCount, text: i }));
    b.issues.forEach(i => formatIssues.push({ type: 'body', card: cardCount, text: i }));
    t.issues.forEach(i => formatIssues.push({ type: 'tag', card: cardCount, text: i }));

    // AUTO_FIX 下对于结果名编造，绝不盲目伪造，打上 [REWRITE_REQUIRED]
    if (AUTO_FIX && t.issues.some(i => i.includes('[结果名编造]'))) {
      newLines.push(`<!-- [REWRITE_REQUIRED: 结果名在测试画像中不存在，属于编造成果，需按真实结果重写] -->`);
      fixLogs.push(`[REWRITE_REQUIRED 卡 ${cardCount}] 结果名在测试画像中不存在，标记需重写`);
    }

    // AUTO_FIX 下对于前 3 行空洞无物、缺失生活实物的卡，绝不自动胡编，打上 [REWRITE_REQUIRED]
    if (AUTO_FIX && !b.sceneCheck.hit) {
      newLines.push(`<!-- [REWRITE_REQUIRED: 正文前3行缺失生活场域道具或物理微动作，通篇空洞需重写] -->`);
      fixLogs.push(`[REWRITE_REQUIRED 卡 ${cardCount}] 正文前3行无场景实物与微动作，已标记需生成器重写，不执行臆造填充`);
    }

    return '```text\n' + newLines.join('\n') + '\n```';
  });

  if (AUTO_FIX) {
    fs.writeFileSync(filePath, refinedParts.join(''), 'utf8');
    console.log(`💾 自动修复已写回原文件。`);
    if (fixLogs.length > 0) {
      console.log(`\n🛠️  执行了以下 ${fixLogs.length} 项确定性自愈修复:`);
      fixLogs.forEach(log => console.log(`   ${log}`));
    }
  }

  // 汇总输出
  console.log(`\n📊 审查结论 (扫描卡片: ${cardCount} 张):`);
  if (redlineHits.length) {
    console.log(`❌ 发现红线/0词表违规 ${redlineHits.length} 处:`);
    redlineHits.forEach(h => console.log(`   第 ${h.line} 行 [${h.word}]: ${h.text}`));
  } else {
    console.log(`✅ 红线/0词表：0 违规`);
  }

  const coverIssues = formatIssues.filter(i => i.type === 'cover');
  const bodyIssues = formatIssues.filter(i => i.type === 'body');
  const tagIssues = formatIssues.filter(i => i.type === 'tag');

  const coverFailCards = new Set(coverIssues.map(i => i.card));
  const bodyFailCards = new Set(bodyIssues.map(i => i.card));
  const tagFailCards = new Set(tagIssues.map(i => i.card));

  console.log(`\n📐 双层门禁分项体检看板:`);
  console.log(`   1. 封面与标题层: 不合格 ${coverFailCards.size} / ${cardCount} 张 (合格率 ${((cardCount - coverFailCards.size) / cardCount * 100).toFixed(1)}%)`);
  if (coverIssues.length > 0) {
    coverIssues.slice(0, 5).forEach(i => console.log(`      · [卡 ${i.card}] ${i.text}`));
    if (coverIssues.length > 5) console.log(`      ... 剩余 ${coverIssues.length - 5} 处封面问题已省略`);
  } else {
    console.log(`      ✅ 封面长短节奏、字数规范、高抓手钩子全部达标`);
  }

  console.log(`   2. 标签与画像层: 不合格 ${tagFailCards.size} / ${cardCount} 张 (合格率 ${((cardCount - tagFailCards.size) / cardCount * 100).toFixed(1)}%)`);
  if (tagIssues.length > 0) {
    tagIssues.slice(0, 5).forEach(i => console.log(`      · [卡 ${i.card}] ${i.text}`));
    if (tagIssues.length > 5) console.log(`      ... 剩余 ${tagIssues.length - 5} 处标签/画像问题已省略`);
  } else {
    console.log(`      ✅ 标签数量（恰好5个）、位1品牌词、位2品类词与结果名核真全部达标`);
  }

  console.log(`   3. 正文层 (新标准回溯): 不合格 ${bodyFailCards.size} / ${cardCount} 张 (合格率 ${((cardCount - bodyFailCards.size) / cardCount * 100).toFixed(1)}%)`);
  console.log(`      ⚠️  【回溯特别说明】：正文系按最新「唠家常·人味硬门禁与逻辑闭环新规」回溯评估，绝不代表历史笔记不可用，严禁批量改写或删除历史文件！`);

  if (bodyIssues.length > 0) {
    const stats = {
      '正文口语虚词不足2种': bodyIssues.filter(i => i.text.includes('口语虚词扰动不足')).length,
      '缺少<=6字短行停顿': bodyIssues.filter(i => i.text.includes('缺少 ≤6 字短行停顿')).length,
      '前3行缺失场景微动作/具象情节': bodyIssues.filter(i => i.text.includes('前 3 行缺失生活场域道具')).length,
      '正文缺少逻辑闭环': bodyIssues.filter(i => i.text.includes('缺少逻辑闭环')).length,
      '道具未提前交代/天降道具': bodyIssues.filter(i => i.text.includes('道具未提前交代')).length,
      '第二人称说教句': bodyIssues.filter(i => i.text.includes('第二人称说教')).length,
      '末行宣誓升华口号': bodyIssues.filter(i => i.text.includes('末行违规出现假大空宣誓')).length,
      '单行超15字': bodyIssues.filter(i => i.text.includes('单行超15字')).length,
    };
    console.log(`\n📋 正文违规分类分布:`);
    Object.entries(stats).forEach(([k, v]) => {
      if (v > 0) console.log(`   · ${k}: ${v} 处`);
    });

    console.log(`\n🔍 正文违规明细前 10 条:`);
    bodyIssues.slice(0, 10).forEach(i => console.log(`   [卡 ${i.card}] ${i.text}`));
    if (bodyIssues.length > 10) console.log(`   ... 剩余 ${bodyIssues.length - 10} 处已省略`);
  } else {
    console.log(`✅ 正文层（单行<=15字/口语虚词/短行停顿/逻辑闭环/唠家常聊完即停）：全部合格`);
  }
  console.log(``);
}

if (require.main === module) {
  runCli();
}

module.exports = {
  detectCoverRhythm,
  checkCardRhythmAndPerturbation,
  checkCard,
  runCli,
};
