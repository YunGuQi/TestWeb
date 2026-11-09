// skill-data.js · 共享数据层（工作包生成器 / 分配表生成器 复用）
//
// 职责：把「测试画像.md」与各测试的 `lib/*-data.ts` 结果定义读成同一种内存结构，
//       并集中放置生成器需要的常量（四个 0 词表 / 档位归属 / 钩子词库 / 行宽上限）。
//       **本文件不做任何判定**。
//
// 为什么单独一层：数据源有 5 个测试、5 种字段形态（`condition` 有的是 JSON 字符串、
//   有的直接是对象；结果名有的带 `【】`、有的在 `name`、有的在 `title`），
//   解析口径写两遍必然漂移。此处一次写死，上层只消费。
//
// 用法（供上层脚本 require）：
//   const SD = require('./skill-data.js');
//   const root = SD.findRoot(__dirname);
//   const profile = SD.parseProfile(SD.profilePath(root, '性格城市匹配'));
//   const all = SD.loadResults(root, profile.dataSource);
//   const picked = SD.pickResults(all, { spec: ['r3', '深圳'], pick: 0, seed: 0 });

const fs = require('fs');
const path = require('path');

// ── 仓库根定位（与上层脚本同口径：向上找 .git）──────────────────────────────
const findRoot = (from) => {
  let cur = path.resolve(from);
  for (;;) {
    if (fs.existsSync(path.join(cur, '.git'))) return cur;
    const up = path.dirname(cur);
    if (up === cur) return process.cwd();
    cur = up;
  }
};

// ── 常量真源（生成器专用执行副本）────────────────────────────────────────────
// 为什么在这里：这四个词表原来内联在校验脚本里，生成器运行时从那份源码里读。
//   校验脚本删除后，生成器仍需要它们（工作包要内联 0 词表、分配表要核对钩子原句、
//   要按档分整活与 emoji），故迁到共用数据层。**本文件不判定任何东西，只放常量**。
//
// 真源与副本的关系（改一处必须同步另一处，没有工具再替你核对）：
//   · 四个 0 词表真源 = `references/03_合规审查与自检.md` §7.2（读者面）+ §四 ❌ 区（医疗词）
//   · MOOD_TABLE 真源 = `references/00_画像与档位.md` §2.4.1 的档位归属表
const PROD = ['报告', '第X页', '前半段', '后半段', '后半截', '翻到最后', '话术库'];
const TERM = ['测出', '测完', '测了'];
const MED = ['确诊', '解药', '抑郁', '治疗', '处方', '症状', '药物', '疗效', '挂号', '心理疾病'];
const BAN = [
  '敢不敢在评论区报个', '说真的，你是不是也经常', '不得不说，真的太准了', '解析说',
  '真的一针见血', '赶紧去查查', '快去测测看吧', '低于60分', '快去测测看',
];
const REDLINE_WORDS = { 产品词: PROD, 测试术语: TERM, 医疗词: MED, 封杀词: BAN };

// 情绪档位归属：可整活 = 情绪上扬 / 带攻击性 / 自带自嘲；低气压 = 脆弱易碎 / 郑重认领 / 下沉躺平。
// 两态按「情绪温度」分，不看档名字面（旧版硬编码破防/认命、冷笑/解气，只对大女主成立）。
const MOOD_TABLE = [
  { test: '大女主觉醒测试', wild: ['解气', '冷笑'], calm: ['破防', '认命'] },
  { test: '命定恋人', wild: ['嘴硬', '嘲甜'], calm: ['心动', '认栽'] },
  { test: '性格城市匹配', wild: ['自嘲', '反骨'], calm: ['认领', '向往'] },
  { test: '恋爱物种领养中心', wild: ['炸毛', '自嘲'], calm: ['撒娇', '破防'] },
  { test: '深度情绪内耗', wild: ['自嘲', '解气'], calm: ['摆烂', '认领'] },
];

// 互动钩子词库（情绪轻叹 / 自然共情 / 清醒定调 / 强情绪破局钩子）：
// 封面与标题位专用，负责在 feed 瀑布流中提供强抓手，不以正文场景实物标准判定。
const HOOK = [
  '让人心疼', '静音', '烫手', '卸下来',
  '清静', '体面掀桌', '比啥都强', '边界',
  '窒息感', '自救', '别抢', '不可爱',
  '谁能', '凭什么',
  '当场掀桌子', '耳边风', '把命还给自己', '学会狠心拒绝', '硬道理',
];

// 高吸睛强情绪口号钩子（大哥审定：极佳点击抓手，封面/标题专用，严禁判假）：
// 1. “谁让我不痛快我就当场掀桌子……过好自己的日子，比啥都强”
// 2. “二十岁我悟出了一个硬道理。职场勾心斗角全当耳边风”
// 3. “不回消息不是失联。是把命还给自己” / “直到那天我才懂，学会狠心拒绝，世界立刻清静了”
const HIGH_CTR_HOOKS = [
  '谁让我不痛快我就当场掀桌子',
  '过好自己的日子，比啥都强',
  '二十岁我悟出了一个硬道理',
  '三十岁我悟出了一个硬道理',
  '职场勾心斗角全当耳边风',
  '不回消息不是失联',
  '不回应就是不失联',
  '是把命还给自己',
  '学会狠心拒绝，世界立刻清静了',
];

// 正文单行上限（字）。它是节奏的来源，不是凑字数的手段（口径见 01_双位与正文.md §一.2）。
const LINE_MAX = 15;

// 口语虚词与语气扰动词池（打破 AI 规整感，注入真人呼吸节奏）
const ORAL_PERTURBATION_WORDS = [
  '其实', '真的', '就是', '不过', '反倒',
  '索性', '倒不如', '冷不丁', '话说回来', '说白了',
  '倒也是', '横竖', '权当', '不料'
];

// ── 5 大生活场域与 60+ 针眼道具微动作（按场景严格分组真源）────────────────
const SCENE_REALMS = [
  {
    realm: '职场向上与边界防线',
    alias: '职场边界',
    verbs: ['反扣', '挂起', '退订', '锁死', '按停', '推迟', '静音', '贴合', '合上', '剪断', '交接', '退出', '划掉', '关闭', '戴上'],
    objects: ['工牌', '打卡机', '钉钉', '降噪耳机', '显示器', '防窥膜', '工位', '绿萝', '折叠床', '工作机', '日报', '全勤奖', '邮件', '指纹识别区', '闸机'],
    props: [
      '工牌反扣进包底', '群聊免打扰折叠', '工作机周五静音', '准点打卡按停', '工作日报冷句陈述',
      '工位降噪耳机挂起', '日历锁死专注块', '非紧急消息推迟回', '会议全程静音监听', '离线文档只读交接',
      '午休拉上工位折叠床', '电脑屏幕防窥膜贴合', '退出全员编辑权限', '工位绿萝剪黄叶',
    ],
  },
  {
    realm: '家庭物理边界与切割',
    alias: '家庭切割',
    verbs: ['推在', '扣合', '旋上', '留在', '立户', '切断', '订票', '退订', '换密码', '转回', '反锁', '搬走', '寄回', '收下', '拉开'],
    objects: ['门禁卡', '茶几', '行李箱', '拉杆', '备用钥匙', '钥匙', '鞋柜', '户口本', '防盗门', '高铁票', '连环语音', '旧物箱', '压岁钱', '自提柜', '锁舌'],
    props: [
      '门禁卡推在茶几上', '行李箱拉杆扣合声', '亲戚借钱冷回复', '钥匙留在玄关鞋柜', '户口本单独立户',
      '电源键切断连环语音', '年夜饭前订高铁票', '家庭群清空消息提醒', '寄回童年旧物箱', '外卖只填私人新地址',
      '老屋门锁换密码不通知', '收下压岁钱原数转回', '退掉返程高铁改签', '防盗门锁舌合上',
    ],
  },
  {
    realm: '亲密关系冷退缩与断舍离',
    alias: '亲密退缩',
    verbs: ['封箱', '划断', '退回', '丢进', '点掉', '半价转', '改回', '清空', '归还', '撕扯', '删掉', '挂断', '拉上'],
    objects: ['封箱胶带', '快递', '对戒', '垃圾桶', '红心歌单', '旧物', '紧急联系人', '床品四件套', '隐藏相册', '双人合照', '微信记录', '丰巢柜', '相簿'],
    props: [
      '封箱胶带刺啦封箱', '微信单向删除记录', '丰巢退回未拆快递', '地铁闸机面交钥匙', '对戒丢进楼下垃圾桶',
      '点掉双人红心歌单', '二手平台半价转旧物', '改回紧急联系人', '换掉双人床品四件套', '清空相册隐藏空间',
      '归还门禁卡不发再见', '删除共同相簿共享人', '胶带用钥匙划断',
    ],
  },
  {
    realm: '社交内耗解绑与被动迎合粉碎',
    alias: '社交解绑',
    verbs: ['离席', '跳过', '关闭', '秒收', '转账', '退群', '代酒', '推掉', '已读不回', '不点', '删好友', '叫车'],
    objects: ['AA转账', '朋友圈', '降噪耳塞', '群聊', '微信步数', '茶杯', '酒杯', '账单', '出租车', '聚餐', '红点', '外套'],
    props: [
      '聚会中途离席打车', 'AA转账秒收不寒暄', '朋友圈设三天可见', '收到闲聊已读不回', '举茶代酒拒绝敬酒',
      '推掉无效聚餐退群', '关闭微信步数排行', '关掉朋友圈点赞提醒', '面对越界冷眼三秒', '拒绝帮忙干脆说不',
      '群聊接龙直接跳过', '随礼按最低标准转账', '桌底默默叫车',
    ],
  },
  {
    realm: '独处空间重建与安全岛',
    alias: '独处安全岛',
    verbs: ['点亮', '拉拢', '划燃', '打湿', '码满', '换新', '煮热', '切为', '泡脚', '拧开', '盖紧', '挂上', '穿上'],
    objects: ['小夜灯', '智能门锁', '遮光窗帘', '香薰蜡烛', '火柴', '热水', '滤纸', '乌龙茶', '泡脚桶', '电热毯', '次卧', '砂锅', '耳塞', '黑胶唱片', '毛毯', '暖气'],
    props: [
      '深夜玄关小夜灯', '独居换新智能门锁', '周末手机飞行模式', '一人食砂锅热汤面', '窗台绿萝浇透水',
      '厚重遮光窗帘拉拢', '香薰蜡烛划火柴声', '戴上降噪静音耳塞', '黑胶唱片沙沙底噪', '手冲热水打湿滤纸',
      '冰箱码满无糖乌龙', '深夜泡脚桶热气腾腾', '暖气旋钮拧到最大',
    ],
  },
];

// 宣誓口号句式正则（仅锚定在末行或结尾句：口号升华拦截，具体生活动作与测试转折句放行）
// 钩子口号只许在封面/标题，正文结尾严禁喊口号
const SLOGAN_END_PATTERN = /(风雪自己扛|我就是自己的|做自己的(庇护所|太阳|救赎)|先救自己|我先救自己|我决定做个|重新开始|彻底放下|才是真正的|迎风奔跑|成为自己的|不该硬扛.*该换|不该.*就该|比啥都强|当场掀桌|全当耳边风|把命还给自己|世界立刻清静|做回自己|放过自己)/;

// 第二人称说教句式正则（全句排查）
const PREACHY_PATTERN = /(你是不是经常|你记住|劝你|你不必|你应该|你得明白|你别再|大家记住)/;

/**
 * 校验正文前 3 行是否命中生活场景的物理微动作或道具
 * @param {string[]} lines 正文前几行（过滤掉空行、[标题]、标签）
 * @returns {{ hit: boolean, realm?: string, detail?: string }}
 */
function detectSceneAction(lines) {
  const checkLines = lines.slice(0, 3);
  for (const line of checkLines) {
    if (!line) continue;
    for (const realm of SCENE_REALMS) {
      // 1. 命中任一 props 片段
      for (const p of realm.props) {
        // 取 props 的前 3~4 字核心名词
        const core = p.slice(0, 4);
        if (line.includes(core)) {
          return { hit: true, realm: realm.realm, detail: `命中道具: ${core} (${line})` };
        }
      }
      // 2. 同时命中该场景下的专属实物与动作动词
      const hitObj = realm.objects.find(o => line.includes(o));
      const hitVerb = realm.verbs.find(v => line.includes(v));
      if (hitObj && hitVerb) {
        return { hit: true, realm: realm.realm, detail: `命中场景结构 [${hitObj} + ${hitVerb}]: ${line}` };
      }
      // 3. 命中专属实物（具象名词具有高区分度）
      if (hitObj && (line.includes('了') || line.includes('上') || line.includes('下') || line.includes('在') || line.includes('把') || line.includes('开') || line.includes('关'))) {
        return { hit: true, realm: realm.realm, detail: `命中具象实物动作 [${hitObj}]: ${line}` };
      }
    }
  }
  return { hit: false };
}

// 动态种子归一化：当传入 'auto'、空串或未指定时，以当前日期（YYYYMMDD）为动态种子
const resolveSeed = (val) => {
  if (val === undefined || val === null || val === '' || String(val).trim().toLowerCase() === 'auto') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return Number(`${y}${m}${d}`) >>> 0;
  }
  const n = Number(val);
  if (!Number.isNaN(n) && n > 0) return n >>> 0;
  let h = 0;
  const s = String(val);
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return (h >>> 0) || 20261028;
};

// 该测试的画像文件路径。测试名 = `design/product-docs/<测试名>/` 的目录名。
const profilePath = (root, test) => path.join(root, 'design', 'product-docs', test, 'docs', '测试画像.md');

// 列出所有已建档的测试名（有 `docs/测试画像.md` 的目录）
const listTests = (root) => {
  const base = path.join(root, 'design', 'product-docs');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => fs.existsSync(path.join(base, n, 'docs', '测试画像.md')));
};

// ── Markdown 表格读取 ───────────────────────────────────────────────────────
// 从 startIdx 行起读连续的 `| … |` 行，返回二维单元格数组（已去首尾竖线与空白）；分隔行自动跳过。
const readTable = (lines, startIdx) => {
  const rows = [];
  for (let i = startIdx; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith('|')) break;
    const cells = l.replace(/^\||\|$/g, '').split('|').map((s) => s.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;   // 分隔行
    rows.push(cells);
  }
  return rows;
};
const findRow = (lines, re) => lines.findIndex((l) => re.test(l.trim()));

// ── 测试画像解析 ────────────────────────────────────────────────────────────
// 只读素材解析：不做语义判断、不补默认值（缺项就是缺项，上层自己报错）。
/**
 * 解析该测试的 `docs/测试画像.md`。
 * @param {string} file 画像文件绝对路径
 * @returns {{test:string,file:string,dataSource:string,resultCount:number,brandTag:string,
 *   categoryTag:string,moods:string[],tone:string,fields:string[],
 *   accents:Array<{name:string,accent:string,wild:string}>,comment:string,
 *   zones:Array<{zone:string,apply:string,handle:string}>,
 *   discards:Array<{raw:string,from:string,alt:string}>,notes:string}}
 */
const parseProfile = (file) => {
  if (!fs.existsSync(file)) throw new Error(`找不到测试画像：${file}`);
  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split(/\r?\n/);
  const test = (txt.match(/^#\s*测试画像\s*·\s*(.+?)\s*$/m) || [])[1]
    || path.basename(path.dirname(path.dirname(file)));
  // 画像键值表里第一列常被写成 `**#位1 品牌词**（全批恒定）` —— 取值前一律拍平成纯文本：
  // 去 `*` / 反引号，再去掉尾部的括注（中文全角或半角），然后做「以 label 开头」匹配。
  const plain = (s) => s.replace(/[*`]/g, '').replace(/[（(][^（()）]*[)）]\s*$/, '').trim();
  const kv = new Map();                      // 拍平后的键 → 值（首见优先）
  lines.forEach((l) => {
    const t = l.trim();
    if (!t.startsWith('|')) return;
    const c = t.replace(/^\||\|$/g, '').split('|');
    if (c.length < 2) return;
    const k = plain(c[0]);
    if (k && !kv.has(k)) kv.set(k, c[1].trim());
  });
  const cell = (label) => {
    if (kv.has(label)) return kv.get(label);
    for (const [k, v] of kv) if (k.startsWith(label)) return v;
    return '';
  };
  const strip = (s) => s.replace(/`/g, '').trim();
  const list = (s) => strip(s).split(/[\/、,，]/).map((x) => x.trim()).filter(Boolean);
  const dataSource = strip(cell('数据源文件'));
  const resultCount = Number((strip(cell('结果数')).match(/\d+/) || [0])[0]) || 0;
  const brandTag = strip(cell('#位1 品牌词'));
  const categoryTag = strip(cell('#位2 品类词'));
  const moods = list(cell('情绪四档'));
  const tone = strip(cell('口音基调'));
  const fields = strip(cell('独有素材字段')).split(/[\/、]/).map((s) => s.trim()).filter(Boolean);

  // 口音表：表头「| 结果名 | 这是个什么脾气的人 | 允许整活 |」
  const accents = [];
  const ai = findRow(lines, /^\|\s*结果名\s*\|/);
  if (ai >= 0) readTable(lines, ai).slice(1).forEach((c) => {
    if (!c[0]) return;
    accents.push({ name: c[0], accent: c[1] || '', wild: (c[2] || '').trim() });
  });

  // 评论区首条成稿：定位「**成稿（直接复制）**」后的第一条正文行（跳过引用/加粗/表格/分隔线）
  let comment = '';
  const ci = findRow(lines, /\*\*成稿（直接复制）\*\*/);
  if (ci >= 0) {
    for (let i = ci + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l || l.startsWith('>') || l.startsWith('**') || l.startsWith('|') || l.startsWith('#') || /^-{3,}$/.test(l)) continue;
      comment = l;
      break;
    }
  }

  // 三分区摘录 / 专属弃用词表
  const zones = [];
  const zi = findRow(lines, /^\|\s*分区\s*\|/);
  if (zi >= 0) readTable(lines, zi).slice(1).forEach((c) => {
    if (c[0]) zones.push({ zone: c[0], apply: c[1] || '', handle: c[2] || '' });
  });
  const discards = [];
  const di = findRow(lines, /^\|\s*弃用表述/);
  if (di >= 0) readTable(lines, di).slice(1).forEach((c) => {
    if (c[0]) discards.push({ raw: c[0], from: c[1] || '', alt: c[2] || '' });
  });

  // §六 本测试专属注意：整段原文保留（含代码块），进工作包时搬运用
  const ni = findRow(lines, /^##\s*六[、.]/);
  const notes = ni >= 0 ? lines.slice(ni + 1).join('\n').trim() : '';

  return { test, file, dataSource, resultCount, brandTag, categoryTag, moods, tone, fields, accents, comment, zones, discards, notes };
};

// 按结果名找口音表条目。画像里的名字常带后缀（如「红墙风骨 · 宏大叙事者（北京）」），
// 数据源里的名字没有——先精确、再剥后缀、再前缀包含。
// 空名字一律判为未命中：`''.startsWith` 恒真，放过它就会静默串到第一个结果的口音上。
const accentOf = (profile, name) => {
  if (!name) return { name, accent: '', wild: '' };
  const hit = profile.accents.find((a) => a.name === name)
    || profile.accents.find((a) => a.name.replace(/[（(].*?[)）]\s*$/, '').trim() === name)
    || profile.accents.find((a) => a.name.startsWith(name) || name.startsWith(a.name));
  return hit || { name, accent: '', wild: '' };
};

// ── 数据源解析 ──────────────────────────────────────────────────────────────
// 从 `lib/*.ts` 里取出结果数组字面量并求值。
// 为什么求值而不是逐字段正则：5 个测试字段形态各不相同（JSON 字符串 / 嵌套对象 / 数组 /
//   函数型 condition），逐字段正则必然漏。数组字面量本身是纯 JS（已核对：无 TS 类型标注、
//   无 `as const`、无 `satisfies`、无反引号模板），`new Function` 可安全求值。
const extractArrayLiteral = (src, ident) => {
  const re = new RegExp('export\\s+const\\s+' + ident + '\\s*(?::[^=]*)?=\\s*\\[');
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length - 1;          // 指向 '['
  let depth = 0, quote = null, esc = false, line = false, block = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i], nx = src[i + 1];
    if (line) { if (ch === '\n') line = false; continue; }
    if (block) { if (ch === '*' && nx === '/') { block = false; i++; } continue; }
    if (quote) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && nx === '/') { line = true; i++; continue; }
    if (ch === '/' && nx === '*') { block = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
};

// 结果数组的导出名：优先含 result 的（大小写不敏感）
const findResultsIdent = (src) => {
  const names = [...src.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*\[/g)].map((m) => m[1]);
  return names.find((n) => /result/i.test(n)) || null;
};

// 剥掉 `【…】` 报告腔标头（红线：不许进正文），只留正文。**仅用于正文体**
// 两种形态要分开处理：
//   ① 段落标头 —— `…社交红线。【精神画像】清醒且…`：标头两侧都是完整句子，标头本身是报告结构，**整个删掉**；
//   ② 具名条目 —— `【商务契约式理性表达】：少用情绪化的怒吼…`：方括号里是这条建议的名字，**保留名字、只去括号**，
//      否则会剩下一句以 `：` 开头的残句（`：少用情绪化的怒吼…`）。
// 判据就是标头后面紧跟着的是不是冒号——是冒号即具名条目。
const TS_STRIP = (s) => String(s)
  .replace(/【([^】]*)】\s*(?=[：:])/g, '$1')      // ② 具名条目
  .replace(/【[^】]*】\s*/g, '')                   // ① 段落标头
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/^[：:、，,；;\s]+/, '')
  .trim();

// 结果名去壳：`【效率先锋 · 破壁极客】` → `效率先锋 · 破壁极客`。
// 注意与 TS_STRIP 的区别——名字整条可能都包在【】里，用 TS_STRIP 会把它抹成空串。
const stripName = (s) => String(s).replace(/[【】]/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();

// 剥 TS 类型标注：`(scores: any) => …` → `(scores) => …`。
// 数据源里只有大女主觉醒测试的 condition 带标注，但这层不假设是哪个文件。
const stripTsTypes = (lit) => lit.replace(/\(([^()]*)\)\s*=>/g, (m, params) => {
  const cleaned = params.split(',').map((p) => {
    const i = p.indexOf(':');
    return i < 0 ? p : p.slice(0, i);
  }).join(',');
  return '(' + cleaned + ') =>';
});

// 递归摊平：嵌套对象摊成 `a.b` → 值；数组/字符串原样保留
const flatten = (obj, prefix = '', out = {}) => {
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  });
  return out;
};

// 数据源里的 `{name}` 是模板占位符（命定恋人 / 恋爱物种 各 16 处），必须换成结果名，
// 否则 `{name}的命定恋人是现实维度的极度强者` 会原样出现在工作包里，被当成正文抄进稿子。
// 替换后仍残留的字母占位符会被记下来（_placeholders），上层据此告警。
const substPlaceholders = (v, name, found = new Set()) => {
  if (typeof v === 'string') {
    const out = v.replace(/\{name\}/g, name);
    [...out.matchAll(/\{([A-Za-z_]\w*)\}/g)].forEach((m) => found.add(m[0]));
    return out;
  }
  if (Array.isArray(v)) return v.map((x) => substPlaceholders(x, name, found));
  if (v && typeof v === 'object') {
    const o = {};
    Object.entries(v).forEach(([k, x]) => { o[k] = substPlaceholders(x, name, found); });
    return o;
  }
  return v;
};

// 标签归一：字符串按逗号切、数组逐个再切，去掉行首 `#` 与空白
const splitTags = (v) => {
  const raw = Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]);
  return raw.flatMap((x) => String(x).split(/[,，、]/))
    .map((x) => x.replace(/^#/, '').trim()).filter(Boolean);
};

/**
 * 读取该测试的数据源，返回归一化后的全量结果。
 * @param {string} root 仓库根
 * @param {string} dataSourceRel 画像里写的「数据源文件」相对路径
 * @returns {Array<{idx:number,id:string,key:string,name:string,raw:object,flat:object,json:object}>}
 *   idx 为 **1 起**序号（与画像口音表 / 分配表对齐）；json 为 `condition` 解析结果（无则 {}）；
 *   flat 里 JSON 字段以 `cond.` 前缀并入，便于统一取用（`cond.tags` / `cond.schedule` …）。
 */
const loadResults = (root, dataSourceRel) => {
  const candidates = [
    path.join(root, 'design', 'test-platform', dataSourceRel),
    path.join(root, dataSourceRel),
    path.join(root, 'design', 'test-platform', 'lib', path.basename(dataSourceRel)),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) throw new Error(`找不到数据源文件：${dataSourceRel}（已试 ${candidates.join(' / ')}）`);
  const src = fs.readFileSync(file, 'utf8');
  const ident = findResultsIdent(src);
  if (!ident) throw new Error(`${file} 里找不到结果数组导出（形如 export const <…Results…> = [）`);
  const lit = extractArrayLiteral(src, ident);
  if (!lit) throw new Error(`${file} 的 ${ident} 数组字面量括号不闭合，无法求值`);
  let arr;
  try {
    arr = new Function('return (' + stripTsTypes(lit) + ');')();
  } catch (e) {
    throw new Error(`${file} 的 ${ident} 求值失败（数据源可能新增了 TS 专有语法）：${e.message}`);
  }
  if (!Array.isArray(arr)) throw new Error(`${file} 的 ${ident} 不是数组`);

  return arr.map((raw0, i) => {
    // 结果名：title（去【】壳）> name > subtitle > id
    const name = stripName(raw0.title || raw0.name || raw0.subtitle || raw0.id || `r${i + 1}`);
    const placeholders = new Set();
    const raw = substPlaceholders(raw0, name, placeholders);
    // `condition` 三种形态：JSON 字符串（城市测试）/ 直接对象 / 不存在
    let json = {};
    if (typeof raw.condition === 'string') {
      try { json = JSON.parse(raw.condition); } catch (e) { json = {}; }
    } else if (raw.condition && typeof raw.condition === 'object') {
      json = raw.condition;
    }
    const flat = flatten(raw);
    Object.entries(flatten(json)).forEach(([k, v]) => { flat['cond.' + k] = v; });
    return { idx: i + 1, id: String(raw.id ?? ''), key: String(raw.key ?? ''), name, raw, flat, json, placeholders: [...placeholders] };
  });
};

// ── 结果挑选 ────────────────────────────────────────────────────────────────
// 两种口径：① 显式清单 `--results r1,r3,深圳`（也接受 id / key / 结果名子串）；
//           ② 种子抽样 `--pick 6 --seed 20260921`（可复算，供回归对照）。
const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
// Fisher–Yates 后按原序返回，保证「同一配方复跑」结果逐字一致
const pickBySeed = (all, count, seed) => {
  const rnd = mulberry32(seed);
  const arr = all.map((_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (count > arr.length) throw new Error(`--pick ${count} 超过该测试结果总数 ${arr.length}`);
  return arr.slice(0, count).sort((a, b) => a - b).map((i) => all[i]);
};

const pickResults = (all, { spec, pick, seed }) => {
  if (Array.isArray(spec) && spec.length) {
    const seen = new Set();
    return spec.map((tokRaw) => {
      const tok = String(tokRaw).trim();
      if (!tok) throw new Error('结果清单里有空项');
      const mIdx = tok.match(/^r(\d+)$/i);
      let hit;
      if (mIdx) {
        const i = Number(mIdx[1]) - 1;
        if (!all[i]) throw new Error(`结果清单里的 ${tok} 越界（该测试共 ${all.length} 个结果）`);
        hit = all[i];
      } else {
        hit = all.find((x) => x.id === tok) || all.find((x) => x.key === tok)
          || all.find((x) => x.name === tok) || all.find((x) => x.name.includes(tok));
      }
      if (!hit) throw new Error(`结果清单里的「${tok}」在数据源里找不到（可用 rN / id / key / 结果名）`);
      if (seen.has(hit.idx)) throw new Error(`结果清单里「${tok}」重复选中了同一个结果（序号 r${hit.idx}）`);
      seen.add(hit.idx);
      return hit;
    });
  }
  if (pick) return pickBySeed(all, pick, seed >>> 0);
  throw new Error('必须给 --results（显式清单）或 --pick N（种子抽样）之一');
};

module.exports = {
  findRoot, profilePath, listTests,
  parseProfile, accentOf,
  loadResults, pickResults, pickBySeed, mulberry32,
  readTable, findRow, flatten, TS_STRIP, stripName, stripTsTypes,
  substPlaceholders, splitTags,
  REDLINE_WORDS, MOOD_TABLE, HOOK, HIGH_CTR_HOOKS, LINE_MAX,
  ORAL_PERTURBATION_WORDS,
  SCENE_REALMS, resolveSeed,
  SLOGAN_END_PATTERN, PREACHY_PATTERN, detectSceneAction,
};
