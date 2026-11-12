// make-plan.js · 分配表生成器（动笔前把跨卡配额一次排死）
//
// 用法（一律在仓库根执行）:
//   node ".agent/skills/xhs-note-operator/scripts/make-plan.js" --test 性格城市匹配 --pick 6 --seed 20260921
//   node ".agent/skills/xhs-note-operator/scripts/make-plan.js" --test 大女主觉醒测试 --results r1,r3,r5
//   可选：--out <.scratch/<slug>/plan.md>  --slug <目录名>  --dry-run（只打印不落盘）
//
// 为什么要有它：乙类占比 / 单型占比 / 主展开型分布 / 封面全批同款 / 每组钩子不足
//   这一类事，**只有整批写完才看得出来**。等写完再发现 = 返工 6 次（P1 实测基线）。
//   把配额在开写前排死，执行者每张卡照表落笔，这些坑从一开始就踩不到。
//   **注意：本脚本不判定任何东西**，它只做信息重组（拉丁方轮转 + 排表）。
//
// 口径来源：展开型主型取自 02_四模式.md §三；四档取自画像；档位归属取自共用数据层
//   skill-data.js 的 MOOD_TABLE（逐名核对）；互动钩子原句必须命中 skill-data.js 的 HOOK 词库
//   （同义改写词库不认，实测会让整组掉到 1/4）。

const fs = require('fs');
const path = require('path');
const SD = require(path.join(__dirname, 'skill-data.js'));

// ── 参数 ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const TEST = arg('--test');
const OUT = arg('--out');
const SLUG = arg('--slug', TEST || '');
const DRY = has('--dry-run');
const RESULTS = arg('--results') ? String(arg('--results')).split(',').map((s) => s.trim()).filter(Boolean) : [];
const PICK = Number(arg('--pick', '0')) || 0;
const SEED_ARG = arg('--seed');
const SEED = SD.resolveSeed(SEED_ARG);

const die = (e) => { console.error(`❌ ${e && e.message ? e.message : e}`); process.exit(1); };
process.on('uncaughtException', die);

if (!TEST) {
  console.error('用法: node "…/make-plan.js" --test <测试名> (--pick N [--seed S/auto] | --results r1,r3,…) [--out 路径]');
  process.exit(1);
}
if (!PICK && !RESULTS.length) {
  console.error('必须给 --pick N [--seed S/auto] 或 --results r1,r3,… 之一 —— 计划要可复现。');
  process.exit(1);
}

const root = SD.findRoot(__dirname);
const profile = SD.parseProfile(SD.profilePath(root, TEST));
const all = SD.loadResults(root, profile.dataSource);
const picked = SD.pickResults(all, { spec: RESULTS, pick: PICK, seed: SEED });
const R = picked.length;               // 结果数
const N = R * 4;                       // 卡数

// ── 枚举与真源 ──────────────────────────────────────────────────────────────
const MODES = ['模式一', '模式二', '模式三', '模式四'];
const MODE_FULL = {
  模式一: '数字标尺与阶梯判词流', 模式二: '现实大反差 + 极短自嘲流',
  模式三: '生活痛点 + 真实自白流', 模式四: '生活怪癖暗号 + 同频集结流',
};
// 02_四模式.md §三：模式 → 主展开型
const MODE_MAIN = { 模式一: '清单轰炸', 模式二: '倒带', 模式三: '一事到底', 模式四: '对话实录' };
const DEV_TYPES = ['一事到底', '清单轰炸', '对话实录', '判词连打', '倒带'];
const STARTS = ['A场景直入', 'B对话直入', 'C判决直入', 'D结果前置', 'E疑问自答', 'F数字型', 'G反常识', 'H陈述直入'];
const GAPS = ['人物反应收尾', '未答的疑问', '短句收束', '评论区承接'];
const SRC_TYPES = ['甲1截半', '甲2全接+补刀', '甲3续写', '乙1问答', '乙2换人称', '乙3判词', '乙4时间'];
const YI_TYPES = ['乙1问答', '乙2换人称', '乙3判词', '乙4时间'];
// 目标末行字数：3/7/11/14 是四个锚点，另配 5/9 两个中间值——末行长短要有错落，
// 只有 4 个锚点时落笔贴合目标就会收得偏齐，白挨一次整批回看。
const TARGET_LAST = [3, 7, 11, 14, 5, 9];
const LINES_CYCLE = [3, 2, 4, 3, 4, 2, 3, 4, 2, 3, 4, 3];   // 封面行数（全批错落，不许恒定）
/** 3 行封面强制长短长 / 短长短轮转；2/4 行用长短 / 短长 / 长短长短 等错落标签 */
const RHYTHM_FOR_LINES = {
  2: ['长短', '短长'],
  3: ['长短长', '短长短'],
  4: ['长短长短', '短长短长'],
};
function pickCoverRhythm(lines, cardOrdinal) {
  const pool = RHYTHM_FOR_LINES[lines] || RHYTHM_FOR_LINES[3];
  return pool[cardOrdinal % pool.length];
}

// 互动钩子：形态 → 原句池（情绪轻叹 / 清醒定调 / 扎心自白 / 反思自问，杜绝问卷式小编感）。
// 三条硬约束，缺一条这张表就是废的（下面有断言，违反就地停机）：
//   ① 每条都必须命中 skill-data.js 的 HOOK 词库；
//   ② 每条都 ≤ 单行上限（skill-data.js 的 LINE_MAX，≤35 字）；
//   ③ 池内不重复（复用计数才有意义）。
// 每个形态给 4 条，配合「同句全批最多复用 2 次」可支撑到 16 个结果（需求 8 次/形态）。
const HOOK_FORMS = [
  { form: '轻叹共情', phrases: [
    '有些小心翼翼，真的让人心疼。',
    '太懂事的人，连委屈都是静音的。',
    '受过伤的人，连善意都觉得烫手。',
    '关上防盗门，才敢把疲惫卸下来。',
  ] },
  { form: '清醒定调', phrases: [
    '学会狠心拒绝，世界立刻清静了。',
    '与其委屈求全，不如体面掀桌。',
    '过好自己的日子，比啥都强。',
    '守好自己的边界，日子才算清静。',
  ] },
  { form: '扎心自白', phrases: [
    '被比较的窒息感，刻进了骨子里。',
    '关上门的夜里，我自救了无数次。',
    '属于我的东西，一分一厘都别抢。',
    '学着不可爱，世界反而讲道理了。',
  ] },
  { form: '反思自问', phrases: [
    '谁能替我倒杯水？',
    '凭什么还要当提款机？',
    '凭什么惯着越界的人？',
    '凭什么讨好所有人？',
  ] },
];

// 从共用数据层取 HOOK 词库 / MOOD_TABLE / 单行上限（逐名核对，不在本文件重写一份）
const HOOK = SD.HOOK;
const MOOD_TABLE = (() => {
  const one = SD.MOOD_TABLE.find((r) => r.test === TEST);
  if (!one) die(`skill-data.js 的 MOOD_TABLE 里没有「${TEST}」—— 请先在 references/00_画像与档位.md §2.4.1 与 skill-data.js 两处补登记`);
  return { wild: [...one.wild], calm: [...one.calm] };
})();
const LINE_MAX = SD.LINE_MAX;

// 原句池三条硬约束的自检：违反就地停机（池废了，别让它带着错往下排）
(() => {
  const all = HOOK_FORMS.flatMap((f) => f.phrases.map((p) => ({ form: f.form, p })));
  const dup = [...new Set(all.map((x) => x.p).filter((p, i, a) => a.indexOf(p) !== i))];
  if (dup.length) die(`钩子原句池里有重复句：[${dup.join(' / ')}] —— 复用计数会被自己人吃掉`);
  const noHit = all.filter((x) => !HOOK.some((w) => x.p.includes(w)));
  if (noHit.length) die(`钩子原句池里这些句不命中 HOOK 词库：[${noHit.map((x) => `${x.p}（${x.form}）`).join(' / ')}] —— 词库只认字面，同义改写一律不认`);
  const tooLong = all.filter((x) => [...x.p].length > LINE_MAX);
  if (tooLong.length) die(`钩子原句池里这些句超过 ${LINE_MAX} 字（单行上限）：[${tooLong.map((x) => `${x.p}（${[...x.p].length} 字）`).join(' / ')}] —— 照抄即超宽，断行又会砍成共用前缀撞成重复整句，请压到 ≤${LINE_MAX} 字`);
  const thin = HOOK_FORMS.filter((f) => f.phrases.length < 2);
  if (thin.length) die(`钩子原句池这些形态不足 2 条：[${thin.map((f) => f.form).join(' / ')}] —— 同形态轮换立刻复用超限`);
})();
const tierOf = (m) => (MOOD_TABLE.wild.includes(m) ? '可整活' : MOOD_TABLE.calm.includes(m) ? '低气压' : '未登记');

// 画像四档与 MOOD_TABLE 双向核对：对不上就地停机，别产出一张档位归属说不清的表
const unreg = profile.moods.filter((m) => tierOf(m) === '未登记');
if (unreg.length) die(`画像四档 [${profile.moods.join(' ')}] 里有未登记档名 [${unreg.join(' ')}]（skill-data.js 的 MOOD_TABLE 只登记了 可整活=[${MOOD_TABLE.wild.join(' ')}] 低气压=[${MOOD_TABLE.calm.join(' ')}]）`);
if (profile.moods.length !== 4) die(`画像情绪四档应恰好 4 个，实读 ${profile.moods.length} 个：[${profile.moods.join(' ')}]`);

// ── 排布 ────────────────────────────────────────────────────────────────────
const cards = [];   // { no, r, mode, src, start, dev, mood, gap, realm, prop, wild, emoji, lines, target, hook, hookForm }

// ── 场域与具象道具分配池（5 大场域轮转 + 具象针眼道具）──────────────────────
const SCENE_REALMS = SD.SCENE_REALMS;
// 为每个场域根据种子打乱道具队列，确保同批次内道具不撞车且随种子动态变化
const realmPropsPool = SCENE_REALMS.map((r, ri) => {
  const rnd = SD.mulberry32((SEED + ri * 997) >>> 0);
  const arr = [...r.props];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { realm: r.realm, alias: r.alias, props: arr, pointer: 0 };
});

// 1. 档与场域道具：
//    每个结果内四档互不相同，按结果序做拉丁方轮转 → 全批每档恰好 R 张；
//    5 大生活场域循环轮转，针眼道具从乱序池中不重样抽取。
picked.forEach((res, r) => {
  MODES.forEach((mode, k) => {
    const cardIdx = r * 4 + k;
    const realmIdx = cardIdx % realmPropsPool.length;
    const rObj = realmPropsPool[realmIdx];
    const prop = rObj.props[rObj.pointer % rObj.props.length];
    rObj.pointer++;

    cards.push({
      no: cardIdx + 1, r, resIdx: res.idx, resName: res.name, mode,
      realm: rObj.realm, prop,
      mood: profile.moods[(k + r) % 4],
      start: STARTS[(k + (r * 3) % 8) % 8],
      gap: GAPS[(k + r) % 4],
      lines: LINES_CYCLE[(r * 4 + k) % LINES_CYCLE.length],
      target: TARGET_LAST[(k + r) % TARGET_LAST.length],
      rhythm: '',
      src: '', dev: '', wild: false, emoji: 0, hook: '', hookForm: '',
    });
  });
});
cards.forEach((c, i) => {
  c.rhythm = pickCoverRhythm(c.lines, i);
});

// 2. 展开型：模式组内主型 = 该模式指定主型，主型张数 floor(2R/3)（上限就是 2/3，取等号不超）；
//    其余（换型）**同组内不许同型**（工单 03），且全批换型种类 ≥3。
const mainCount = Math.floor((R * 2) / 3);
const altCount = R - mainCount;
// 备选池以「判词连打」打头（它是最容易被顶格复用的备选型），按模式序轮转取用
const ALT_POOL = ['判词连打', ...DEV_TYPES.filter((t) => t !== '判词连打')];
MODES.forEach((mode, mi) => {
  const grp = cards.filter((c) => c.mode === mode);
  const main = MODE_MAIN[mode];
  const pool = [];
  for (let i = 0; i < ALT_POOL.length; i++) {
    const t = ALT_POOL[(i + mi) % ALT_POOL.length];
    if (t !== main && !pool.includes(t)) pool.push(t);
  }
  if (pool.length < altCount) die(`${mode} 的备选展开型不够 ${altCount} 种（主型「${main}」占了 1 种，只剩 ${pool.length} 种）—— 结果数太多，请拆批`);
  const alts = pool.slice(0, altCount);
  // 换型落在组内哪几张：按模式序错开，避免「每组的换型永远是最后两张」
  const pos = [];
  for (let i = 0; i < altCount; i++) {
    let p = (mi + i * 3) % R;
    while (pos.includes(p)) p = (p + 1) % R;
    pos.push(p);
  }
  grp.forEach((c, i) => { c.dev = pos.includes(i) ? alts[pos.indexOf(i)] : main; });
});

// 3. 取材型：先按配额建多重集，再逐结果填（每组内不重复），最后逐条验配额。
//    配额（01_双位与正文.md §一.1）：乙类合计 ≥ 1/3；甲2 ≤ 1/4；甲1 / 甲3 各 ≤ 1/6；单型 ≤ 1/4。
const quota = (() => {
  const 甲1 = Math.floor(N / 6), 甲3 = Math.floor(N / 6);
  const 甲2 = Math.max(0, Math.floor(N / 4) - 1);
  const 乙 = N - 甲1 - 甲2 - 甲3;
  const bag = [];
  const push = (t, n) => { for (let i = 0; i < n; i++) bag.push(t); };
  push('甲1截半', 甲1); push('甲3续写', 甲3); push('甲2全接+补刀', 甲2);
  // 乙类四型尽量均分：11 → 3/3/3/2
  const base = Math.floor(乙 / 4);
  YI_TYPES.forEach((t, i) => push(t, base + (i < 乙 % 4 ? 1 : 0)));
  return bag;
})();
// 逐结果填：每次挑「本组还没用过 + 池里剩余最多」的型（并列时按 SRC_TYPES 序，保证可复现）
const remain = {};
quota.forEach((t) => { remain[t] = (remain[t] || 0) + 1; });
cards.forEach((c) => { if (!c.src) return; });
for (let r = 0; r < R; r++) {
  const grp = cards.filter((c) => c.r === r);
  const used = new Set();
  grp.forEach((c) => {
    const cand = SRC_TYPES.filter((t) => (remain[t] || 0) > 0 && !used.has(t));
    if (!cand.length) die(`结果 ${r + 1} 的取材型排不出来（剩余池 ${JSON.stringify(remain)}）—— 配额与结果数不匹配`);
    cand.sort((a, b) => (remain[b] - remain[a]) || (SRC_TYPES.indexOf(a) - SRC_TYPES.indexOf(b)));
    const t = cand[0];
    c.src = t; used.add(t); remain[t]--;
  });
}
// 配额自检：不满足就地停机，绝不产出一张注定撞坑的表
const srcCount = {};
cards.forEach((c) => { srcCount[c.src] = (srcCount[c.src] || 0) + 1; });
const yiTotal = YI_TYPES.reduce((a, t) => a + (srcCount[t] || 0), 0);
const maxSrc = Math.max(...Object.values(srcCount));
const quotaBad = [];
if (yiTotal * 3 < N) quotaBad.push(`乙类 ${yiTotal}/${N} < 1/3`);
if ((srcCount['甲2全接+补刀'] || 0) * 4 > N) quotaBad.push(`甲2 ${srcCount['甲2全接+补刀']}/${N} > 1/4`);
if ((srcCount['甲1截半'] || 0) * 6 > N) quotaBad.push(`甲1 ${srcCount['甲1截半']}/${N} > 1/6`);
if ((srcCount['甲3续写'] || 0) * 6 > N) quotaBad.push(`甲3 ${srcCount['甲3续写']}/${N} > 1/6`);
if (maxSrc * 4 > N) quotaBad.push(`单型最大 ${maxSrc}/${N} > 1/4`);
if (quotaBad.length) die(`取材型配额排不满足：${quotaBad.join('；')}`);

// 4. 整活 + emoji：只落在可整活档；**模式三不注入整活**（02_四模式.md §三：它是低气压档的载体）。
//    每张可整活档至少 1 张整活；emoji 在可整活档内占 1/3~2/3（取中位 1/2，两头都不踩线）。
MOOD_TABLE.wild.forEach((mood) => {
  const arr = cards.filter((c) => c.mood === mood);
  if (!arr.length) return;
  const eligible = arr.filter((c) => c.mode !== '模式三');
  // 按**该档总张数**算（≈1/3，与 P1 夹具的「每可整活档 2 张」同密），再按可用张数封顶——
  // 按 eligible.length 算会让模式三占位多的那一档只剩 1 张，整活密度无故不均。
  const needWild = Math.max(1, Math.min(eligible.length, Math.round(arr.length / 3)));
  // 隔一张取一张（不是取最早那几张）——整活卡要摊开在整批里，别挤在前两个结果
  eligible.filter((_, i) => i % 2 === 0).slice(0, needWild).forEach((c) => { c.wild = true; });
  // emoji 比例必须落在 [1/3, 2/3]（emoji 按档的排程口径）。n=1 时这个区间是空的（1/1 = 100%），
  // 数学上无解 —— 与其产出一张注定不合格的表，不如停机说清「这批太小了」。
  const lo = Math.ceil(arr.length / 3), hi = Math.floor((arr.length * 2) / 3);
  if (lo > hi) die(`档「${mood}」本批只有 ${arr.length} 张卡，emoji 配额（1/3~2/3）无整数解 —— 该档至少要 2 张卡（本批至少 2 个结果）`);
  const needEmoji = Math.min(hi, Math.max(lo, Math.round(arr.length / 2)));
  arr.filter((_, i) => i % 2 === 0).slice(0, needEmoji).forEach((c) => { c.emoji = 1; });
});

// 5. 互动钩子：每个结果恰好 2 张、形态不重复；原句全批同句最多复用 2 次。
const HOOK_MODE_PAIRS = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
const formUse = {};      // 形态 → 已用次数
const phraseUse = {};    // 原句 → 已用次数
picked.forEach((_, r) => {
  const grp = cards.filter((c) => c.r === r);
  const pair = HOOK_MODE_PAIRS[r % HOOK_MODE_PAIRS.length];
  pair.forEach((k, j) => {
    const form = HOOK_FORMS[(r * 2 + j) % HOOK_FORMS.length];
    const idx = formUse[form.form] || 0;
    const phrase = form.phrases[idx % form.phrases.length];
    const reuse = ((phraseUse[phrase] || 0) + 1);
    if (reuse > 2) die(`钩子原句「${phrase}」要被用第 ${reuse} 次，超过「同句全批最多复用 2 次」—— 结果数太多，请补原句池或拆批`);
    phraseUse[phrase] = reuse; formUse[form.form] = idx + 1;
    if (!HOOK.some((w) => phrase.includes(w))) die(`钩子原句「${phrase}」不含 HOOK 词库里的任何词 —— 词库不认，这张卡的钩子就不成立`);
    grp[k].hook = phrase; grp[k].hookForm = form.form;
  });
});
// 全批原句去重统计：给渲染用，也是「重复不再来自钩子句」的可查证据
const hookRows = cards.filter((c) => c.hook);
const hookUniq = new Set(hookRows.map((c) => c.hook)).size;
const hookMaxUse = Math.max(0, ...Object.values(phraseUse));

// ── 渲染 ────────────────────────────────────────────────────────────────────
const yn = (b) => (b ? '✓' : '—');
const rowsMd = cards.map((c) => `| ${c.no} | r${c.r + 1} | ${c.mode} | ${c.src} | ${c.start} | ${c.dev} | ${c.mood} | ${c.gap} | ${c.realm} | ${c.prop} | ${yn(c.wild)} | ${c.emoji} | ${c.lines} | ${c.rhythm} | ${c.target} | ${c.hook || '—'} | ${c.hookForm || '—'} |`);

const devSummary = MODES.map((m) => {
  const grp = cards.filter((c) => c.mode === m);
  const main = MODE_MAIN[m];
  const alts = grp.filter((c) => c.dev !== main).map((c) => `卡${c.no} → ${c.dev}`);
  return `| ${m} | ${main} | ${grp.filter((c) => c.dev === main).length}/${grp.length} | ${alts.join(' ｜ ') || '—'} |`;
}).join('\n');

const countOf = (key, skipEmpty) => {
  const d = {};
  cards.forEach((c) => {
    const v = c[key];
    if (skipEmpty && (v === '' || v == null)) return;
    d[v] = (d[v] || 0) + 1;
  });
  return d;
};
const moodCount = countOf('mood'), realmCount = countOf('realm'), srcCountFinal = countOf('src'), linesCount = countOf('lines'), formCount = countOf('hookForm', true);
const emojis = MOOD_TABLE.wild.map((m) => `${m} ${cards.filter((c) => c.mood === m && c.emoji).length}/${moodCount[m]}`).join('　');
const wilds = MOOD_TABLE.wild.map((m) => `${m} ${cards.filter((c) => c.mood === m && c.wild).length}/${moodCount[m]}`).join('　');

const md = `# 分配表 · ${TEST} · ${R} 结果 × 四模式 = ${N} 卡

> **动笔前就定死**：模式 / 取材型 / 起手型 / 展开型 / 档 / 缺口型 / 场域 / 针眼道具 / 整活 / emoji / 封面行数 / 封面节奏 / 目标末行字数 /
> 互动钩子 / 钩子形态 全批一次排定，「整批写完才发现」的那类坑（取材型撞在一起、封面全批同款、钩子句重复、道具同质化）从一开始就踩不到。
> **封面节奏**：3 行必须写成「长短长」或「短长短」（短≤4 字、长≥6 字）；2/4 行按表内标签错落，禁止 \`3/3/3\`、\`8/8/8\` 一堵墙。
> 生成命令（可复现）：
> \`node ".agent/skills/xhs-note-operator/scripts/make-plan.js" --test ${TEST} ${PICK ? `--pick ${PICK} --seed ${SEED_ARG === 'auto' ? 'auto' : SEED}` : `--results ${RESULTS.join(',')}`}\`
> 每张卡的取值**照抄本表**，不要自己改型；正文首句强制落入分配的针眼道具；正文自然包含至少 2 个口语虚词（其实/真的/反倒/索性 等，见 \`ORAL_PERTURBATION_WORDS\`）并包含至少 2 处 ≤6 字短行停顿；交付前过 \`references/03_合规审查与自检.md\` §七 的自检清单。

## 结果清单（rN → 真实结果）

| 标号 | 数据源序号 | 结果名 |
|---|---|---|
${picked.map((res, i) => `| r${i + 1} | r${res.idx} | ${res.name} |`).join('\n')}

- 数据源：\`design/test-platform/${profile.dataSource}\`（实读 ${all.length} 个结果，本批选中 ${R} 个）
- 标签前 2 位（全批恒定）：\`${profile.brandTag || '（画像未填）'}\` \`${profile.categoryTag || '（画像未填）'}\`

## 分片 → worker

> 并行模式：**1 worker = 1 个结果 × 四模式**（4 卡）。**否决** 1 模式 = 1 worker（四模式共享同一份结果素材，
> 拆开会让四个 worker 各自重读一遍素材，还判不了「同结果四篇骨架差异」）。

| 分片 | 卡号 | 结果 | 输出文件 |
|---|---|---|---|
${picked.map((res, i) => `| S${i + 1} | 卡${i * 4 + 1}–卡${i * 4 + 4} | r${i + 1} ${res.name} | \`.scratch/${SLUG || TEST}/shard-r${i + 1}.md\` |`).join('\n')}

## ${N} 行分配表

| 卡号 | 结果 | 模式 | 取材型 | 起手 | 展开 | 档 | 缺口 | 场域 | 针眼道具 | 整活 | emoji | 封面行数 | 封面节奏 | 目标末行字数 | 互动钩子 | 钩子形态 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${rowsMd.join('\n')}

> 表头缩写对照：\`模式\` 一/二/三/四 = ${MODES.map((m) => `${m}【${MODE_FULL[m]}】`).join('；')}。
> \`起手\` 用 \`01_双位与正文.md\` §2.1 的八型**全称**（含 A~H 前缀）——标注行照抄即可，不给你留转译的机会。
> \`场域\` 与 \`针眼道具\`：为每张卡锁定的真实生活场域（5 大场域轮转）与微动作画面锚点。**正文首句强制落入分配的针眼道具**，杜绝抽象概念与空泛概括。
> \`钩子形态\` 与 \`互动钩子\` 是同一张卡的两列：形态是给整批回看分组用的，原句是**落笔时直接抄进正文**的那句——
> 原句已逐条核对命中 HOOK 词库（同义改写词库不认，实测会让整组掉到 1/4），且**每条都不超单行上限**、
> **全批不重复**：照抄即可，**不要现场改写、不要为了断行把原句砍成共用前缀**（口径见 \`04_分发与排期.md\` §6.3）。

### 全批骨架不重复（工单 03：换型不许同构）

| 模式组 | 主型 | 主型张数 | 换型（同组内各不相同） |
|---|---|---|---|
${devSummary}

**换型种类合计 ${new Set(cards.filter((c) => c.dev !== MODE_MAIN[c.mode]).map((c) => c.dev)).size} 种**（要求 ≥3）。
病根：改造前 24 张里 8 张换型**全用同一个备选型**（判词连打），字面达标、实际还是同一个模具。

### 排布总览（本表已排定的分布）

| 项 | 本表 |
|---|---|
| 情绪四档分布 | ${JSON.stringify(moodCount)} |
| 5大场域分布 | ${JSON.stringify(realmCount)} |
| emoji 按档 | 低气压档全 0；可整活档：${emojis} |
| 整活分布 | 可整活档：${wilds}；低气压档 0；模式三 0 |
| 互动钩子 | 每结果恰 2 张且形态不重复：${JSON.stringify(formCount)}　｜　原句去重 ${hookUniq}/${hookRows.length}，同句最多复用 ${hookMaxUse} 次 |
| 封面行数分布 | ${JSON.stringify(linesCount)}（全批非单一值） |
| 封面节奏分布 | ${JSON.stringify(countOf('rhythm'))}（3 行轮转长短长/短长短） |
| 目标末行字数 | 按 ${TARGET_LAST.join('/')} 混排（${JSON.stringify(countOf('target'))}），落笔时对齐该字数 |

### 落笔时最容易写走形的几处（表里锁不住，只能写的时候自己盯）

| 项 | 落笔要求 | 为什么 |
|---|---|---|
| 针眼道具 | **正文首句必须直接落在分配的物理道具或微动作上** | 杜绝抽象概念与空泛抒情，用可肉眼观察的物理动作（如按压、合盖、静音、撕胶带）拉开场景序幕 |
| 末行长度 | **正文最后一行按「目标末行字数」写**，别顺手都收成 4~6 字 | 末行长短要有错落，全批收成同一个长度读起来就像同一支笔 |
| 封面行字数级差 | 每张封面的最长行 − 最短行 **拉开 ≥3 字** | 反差越大越像真人写的；行长全齐是一堵墙，眼睛没有落点 |
| 封面节奏 | **照抄「封面节奏」列**：3 行只能是长短长或短长短 | 仅有短板/长板不够——中间行必须凹或凸，才是可读形状 |
| 封面总字数 | 每张封面的各行字数合计 **≤16 字（硬顶）** | 超了 feed 缩略图读不全，文字配图生成也易丢末行 |
| 钩子位置 | 钩子原句放**正文最后一行或倒数第二行**，且**整句照抄本表原句** | 评论区的动作引导要落在读者读完那一刻；照抄是因为原句已是「不超单行上限 + 命中词库 + 全批不重复」的解 |
| 钩子断行 | 原句本来不必断行；万不得已要断，钩子那一行必须自带区分度 | 只留 \`你们呢\` / \`评论区报一下\` 这类共用前缀 → 全批撞成同一行，整批回看时一眼就看出来了（P1 实测 2 条重复全是这么砍出来的） |
| 跨卡重复 | 素材是**改写原料**，不是可抄的句子 | 任意两张卡的任意一行逐字相同，整批回看时一眼就看得出来 |
| 口语虚词与扰动 | 正文自然包含至少 **2 个不同**官方口语虚词（其实/真的/反倒/索性 等）并保留至少 2 处 ≤6 字短行停顿 | 打破全篇匀称与 AI 模具感，注入真人呼吸节奏与行长起伏，严禁一堵墙 |
`;

const outPath = OUT ? path.resolve(root, OUT) : path.join(root, '.scratch', SLUG || TEST, 'plan.md');
if (outPath.includes(path.join('design', 'product-docs'))) {
  console.error(`❌ 分配表不许落进 design/product-docs/（它是中间件，不是交付物）：${outPath}\n   请落 .scratch/<slug>/ 下。`);
  process.exit(1);
}
if (!DRY) { fs.mkdirSync(path.dirname(outPath), { recursive: true }); fs.writeFileSync(outPath, md, 'utf8'); }

console.log(`分配表 · ${TEST}｜${R} 结果 × 四模式 = ${N} 卡${DRY ? '（--dry-run，未落盘）' : ''}`);
if (!DRY) console.log(`  落盘 ${path.relative(root, outPath).replace(/\\/g, '/')}`);
console.log(`  种子 ${SEED}${SEED_ARG === 'auto' || !SEED_ARG ? ' (auto 动态日期种子)' : ''}｜取材型 ${JSON.stringify(srcCountFinal)}｜乙类 ${yiTotal}/${N}`);
console.log(`  四档 ${JSON.stringify(moodCount)}｜封面行数 ${JSON.stringify(linesCount)}｜5大场域与针眼道具全轮转`);
console.log(`  下一步：逐卡照本表取型落笔；正文首句强制落入分配的针眼道具；正文注入口语虚词与短行扰动；交付前过 references/03_合规审查与自检.md §七 的自检清单，再调 refine-notes.js 校验合规与排版`);
