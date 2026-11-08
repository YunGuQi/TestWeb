#!/usr/bin/env node
/**
 * 单卡草稿流水线配方生成器（固化入口）
 *
 * 用途：把一张卡的 coverLines / title / body / tags / slice / goods
 * 编译成有序 Runtime.evaluate 步骤，供 cursor-ide-browser CDP 逐条执行。
 * 避免每卡重新探索 DOM；铁律已内嵌：
 *   1) 封面模板固定点第一张「基础」
 *   2) 话题：正文后先换行，再逐个输入并点蓝标
 *   3) 商品：必须出现「已选择 1」才保存
 *
 * 用法：
 *   node draft-one-card.js --id r2_m2
 *   node draft-one-card.js --file ./one-card.json
 *   node draft-one-card.js --id r2_m2 --out .scratch/draft-pipeline/last-card-steps.json
 *
 * 卡片 JSON 字段：
 *   { id, coverLines[], title, body, tags[], imageSlice, goodsKeyword, imageServer?, platformScheduleAt? }
 *
 * platformScheduleAt（ISO）：追加「打开定时开关 + 写时间」步；
 * v1 Safe Stop = 填完即停，**绝不**自动点红色「发布」或「定时发布确认」。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_BATCH = path.join(__dirname, 'draft-batch-data.json');
const DEFAULT_OUT = path.join(ROOT, '.scratch/draft-pipeline/last-card-steps.json');
const DEFAULT_IMAGE_SERVER = 'http://127.0.0.1:8768';

function parseArgs(argv) {
  const out = { id: null, file: null, out: DEFAULT_OUT };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--id') out.id = argv[++i];
    else if (a === '--file') out.file = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function loadCard(args) {
  if (args.file) {
    const p = path.resolve(args.file);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  if (!args.id) throw new Error('需要 --id <cardId> 或 --file <card.json>');
  const batch = JSON.parse(fs.readFileSync(DEFAULT_BATCH, 'utf8'));
  const card = batch.find((c) => c.id === args.id);
  if (!card) throw new Error(`batch 中找不到 id=${args.id}`);
  return card;
}

function esc(s) {
  return JSON.stringify(String(s ?? ''));
}

function stripTrailingTopics(text) {
  return String(text || '')
    .replace(/(?:[\s\n]*#[^\s#]+(?:\[话题\]#?)?#?)+$/g, '')
    .replace(/(?:[\s\n]*#[^\s#]+(?:\[话题\]#?)?)+$/g, '')
    .trim();
}

function bodyParagraphs(body) {
  const cleanBody = stripTrailingTopics(body);
  return cleanBody
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * 生成浏览器内可执行的步骤串。
 * 每步：{ id, title, accept, expression }
 * expression 为 async IIFE 字符串，return { ok, ... }。
 */
function buildSteps(card) {
  const coverLines = card.coverLines || [];
  const title = card.title || '';
  const paras = bodyParagraphs(card.body);
  const rawTags = Array.isArray(card.tags) ? card.tags : [];
  const tags = [
    ...new Set(
      rawTags
        .map((t) => String(t || '').trim())
        .map((t) => t.replace(/^[#＃\s]+/, '').replace(/\[话题\]#?$/g, '').trim())
        .filter((t) => t.length > 0 && !/\n/.test(t))
    ),
  ];
  const slice = card.imageSlice || '';
  const goods = card.goodsKeyword || '';
  const imgBase = (card.imageServer || DEFAULT_IMAGE_SERVER).replace(/\/$/, '');
  const platformScheduleAt = card.platformScheduleAt || '';

  // 封面：只用「一段多行 + <br>」。真机对照：多 <p> / splitBlock 会被平台拼成一串再按字宽折行
  //（4 行会变成错误的 3 行）；仅 hardBreak 能保住 MD 断行。合计硬顶 ≤16 字，超了生成图易丢末行。
  const coverBrHtml = `<p class="editor-paragraph">${coverLines
    .map((l) => String(l).replace(/</g, ''))
    .join('<br>')}</p>`;
  const coverCharCount = coverLines.join('').length;
  const bodyHtml = paras.map((l) => `<p>${String(l).replace(/</g, '')}</p>`).join('');

  /** 平台控件常见本地显示：YYYY-MM-DD HH:mm */
  function formatPlatformLocal(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  const platformTimeLocal = platformScheduleAt
    ? formatPlatformLocal(platformScheduleAt)
    : '';

  const steps = [
    {
      id: 'cover_open_inject',
      title: '打开文字配图并按行注入封面（保断行）',
      accept: 'editor.innerText 按行 === coverLines（禁止拼成一串被平台按字宽折行）',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const parsed = ${JSON.stringify(coverLines)};
  const brHtml = ${JSON.stringify(coverBrHtml)};
  const coverChars = ${JSON.stringify(coverCharCount)};
  const textBtn = [...document.querySelectorAll('button,div,span')].find(el => el.innerText?.trim() === '文字配图' && el.getBoundingClientRect().width > 0);
  if (!textBtn) return { ok: false, err: 'no 文字配图' };
  textBtn.click();
  await sleep(800);
  let editor = null;
  for (let i = 0; i < 25; i++) {
    editor = [...document.querySelectorAll('div.tiptap.ProseMirror')].find(e => e.getBoundingClientRect().width > 0) || document.querySelector('div.tiptap.ProseMirror');
    if (editor && (editor.editor || editor.isContentEditable)) break;
    await sleep(200);
  }
  if (!editor) return { ok: false, err: 'no cover editor' };

  // 以 innerText 分行验收：平台生成图读的是可视化换行，不是单纯 <p> 个数
  const readLines = () =>
    (editor.innerText || '')
      .replace(/\\u00a0/g, ' ')
      .split(/\\r?\\n/)
      .map(l => l.trim())
      .filter(Boolean);

  const exactMatch = () => {
    const lines = readLines();
    const ok = lines.length === parsed.length && parsed.every((l, i) => lines[i] === l);
    return { ok, lines };
  };

  const trySetBr = () => {
    try {
      const dt = new DataTransfer();
      dt.setData('text/html', brHtml);
      dt.setData('text/plain', parsed.join('\n'));
      const pasteEv = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      editor.dispatchEvent(pasteEv);
    } catch (e) {
      editor.innerHTML = brHtml;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  // 只用 br 硬换行。真机：multi-p / splitBlock 会被平台拼串再按字宽折成错误 3 行。
  trySetBr();
  await sleep(400);
  let check = exactMatch();

  // 兜底：TipTap 物理按行输入（保持硬换行，严禁 setContent 内存后门）
  if (!check.ok && editor.editor) {
    if (typeof editor.editor.commands.clearContent === 'function') {
      editor.editor.commands.clearContent();
    }
    for (let i = 0; i < parsed.length; i++) {
      if (typeof editor.editor.commands.insertContent === 'function') {
        editor.editor.commands.insertContent(parsed[i]);
        if (i < parsed.length - 1 && typeof editor.editor.commands.setHardBreak === 'function') {
          editor.editor.commands.setHardBreak();
        }
      }
    }
    await sleep(400);
    check = exactMatch();
    if (check.ok) {
      return {
        ok: true,
        method: 'tiptap-hardBreak',
        expect: parsed,
        lines: check.lines,
        coverChars,
        warn: coverChars > 16 ? ('封面合计' + coverChars + '字，硬顶≤16，生成图可能丢末行') : undefined,
      };
    }
  }

  if (!check.ok) {
    return {
      ok: false,
      err: 'cover lines not preserved (br/hardBreak only; multi-p banned)',
      method: 'br-hardbreaks',
      expect: parsed,
      lines: check.lines,
      expectCount: parsed.length,
      gotCount: (check.lines || []).length,
      coverChars,
      rawText: (editor.innerText || '').slice(0, 120),
    };
  }
  return {
    ok: true,
    method: 'br-hardbreaks',
    expect: parsed,
    lines: check.lines,
    coverChars,
    warn: coverChars > 16 ? ('封面合计' + coverChars + '字，硬顶≤16，生成图可能丢末行') : undefined,
  };
})()`
    },
    {
      id: 'cover_generate',
      title: '点击生成图片',
      accept: '出现模板列表或「下一步」',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  await sleep(300);

  const findBtn = () =>
    document.querySelector('.edit-text-button') ||
    [...document.querySelectorAll('button,div,span')].find(
      el => el.innerText?.trim() === '生成图片' && el.getBoundingClientRect().width > 0
    );

  const triggerClick = target => {
    if (!target) return;
    // 物理级原生事件保护：严禁使用合成事件（如 PointerEvent / MouseEvent 派发导致 isTrusted=false）
    if (typeof target.click === 'function') target.click();
    const child = target.querySelector('.edit-text-button-text') || target.firstElementChild;
    if (child && child !== target && typeof child.click === 'function') {
      child.click();
    }
  };

  let btn = findBtn();
  if (!btn) return { ok: false, err: 'no 生成图片' };
  triggerClick(btn);

  // 生成+出模板区可能 >2.5s；最长轮询 30s（60 * 500ms）
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const t = document.body.innerText || '';
    const hasNext = [...document.querySelectorAll('button')].some(
      el => el.innerText?.trim() === '下一步' && el.getBoundingClientRect().width > 0
    );
    const hasTpl = t.includes('选择一个喜欢的卡片');
    if (hasNext || hasTpl) return { ok: true, hasNext, hasTpl, waited: i };
    if (t.includes('图片生成中') || t.includes('生成中')) continue;
    // 每隔 3s 若仍停在「写文字」且未进入生成态，重试派发点击
    if (i > 0 && i % 6 === 0 && t.includes('写文字')) {
      btn = findBtn();
      if (btn) triggerClick(btn);
    }
  }
  return { ok: false, err: 'generate timeout', hasNext: false, hasTpl: false };
})()`
    },
    {
      id: 'cover_pick_first_template',
      title: '固定点选第一张「基础」模板',
      accept: '第一张模板处于选中态',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // 优先按文案「基础」；否则取右侧卡片网格第一张可点击项
  let first =
    [...document.querySelectorAll('*')].find(el => el.innerText?.trim() === '基础' && el.getBoundingClientRect().width > 0) ||
    [...document.querySelectorAll('[class*=card], [class*=template], [class*=style]')].find(el => {
      const t = (el.innerText || '').trim();
      return t.includes('基础') && el.getBoundingClientRect().width > 40;
    });
  if (!first) {
    // 兜底：含「换配色」的容器通常是第一张
    first = [...document.querySelectorAll('*')].find(el => (el.innerText || '').includes('换配色') && el.getBoundingClientRect().width > 40);
  }
  if (!first) return { ok: false, err: 'no first template' };
  (first.closest('[class*=item]') || first).click();
  await sleep(500);
  return { ok: true, picked: (first.innerText || '').slice(0, 40) };
})()`
    },
    {
      id: 'cover_next',
      title: '封面下一步 / 完成',
      accept: '进入主编辑（标题框 / 图片编辑+正文编辑器 / 暂存离开）',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const findNext = () =>
    [...document.querySelectorAll('button')].find(el => {
      const t = el.innerText?.trim();
      return (t === '下一步' || t === '完成') && el.getBoundingClientRect().width > 0;
    }) ||
    [...document.querySelectorAll('button,div,span')].find(el => {
      const t = el.innerText?.trim();
      return (t === '下一步' || t === '完成') && el.getBoundingClientRect().width > 0;
    });
  const editorReady = () => {
    const hasTitle = !!document.querySelector(
      'input[placeholder*="填写标题"], input[placeholder*="标题"], textarea[placeholder*="填写标题"], textarea[placeholder*="标题"]'
    );
    const t = document.body.innerText || '';
    const hasEdit = /图片编辑/.test(t);
    const hasDraft = /暂存离开/.test(t);
    const hasBody = [...document.querySelectorAll('div.tiptap.ProseMirror')].some(
      e => e.getBoundingClientRect().width > 40
    );
    // 仍停在选模板/预览态则不算就绪
    const stillPreview =
      t.includes('选择一个喜欢的卡片') ||
      ([...document.querySelectorAll('button')].some(
        el => el.innerText?.trim() === '下一步' && el.getBoundingClientRect().width > 0
      ) &&
        t.includes('预览图片') &&
        !hasTitle);
    if (stillPreview) return { ok: false, hasTitle, hasEdit, hasDraft, hasBody };
    if (hasTitle || (hasEdit && hasBody) || hasDraft) {
      return { ok: true, hasTitle, hasEdit, hasDraft, hasBody };
    }
    return { ok: false, hasTitle, hasEdit, hasDraft, hasBody };
  };
  let next = findNext();
  if (!next) return { ok: false, err: 'no 下一步' };
  next.click();
  // 平台常先白屏「预览图片」再回主编辑；最长约 45s，期间若仍停在选模板则重点下一步
  for (let i = 0; i < 90; i++) {
    await sleep(500);
    const know = [...document.querySelectorAll('button,div,span')].find(
      el => el.innerText?.trim() === '我知道了'
    );
    if (know) {
      know.click();
      await sleep(300);
    }
    const st = editorReady();
    if (st.ok) return { ...st, waited: i };
    const txt = document.body.innerText || '';
    if (i > 0 && i % 6 === 0 && txt.includes('选择一个喜欢的卡片')) {
      next = findNext();
      if (next) next.click();
    }
  }
  const last = editorReady();
  return { ok: false, ...last, err: 'title timeout after 下一步' };
})()`
    },
    {
      id: 'slice_upload',
      title: '上传 1/3 测评切片',
      accept: '图片编辑显示 2/18',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const name = ${esc(slice)};
  const url = ${esc(imgBase)} + '/' + encodeURIComponent(name);
  const resp = await fetch(url);
  if (!resp.ok) return { ok: false, err: 'fetch ' + resp.status, url };
  const blob = await resp.blob();
  const file = new File([blob], name, { type: 'image/png' });
  const dt = new DataTransfer();
  dt.items.add(file);
  const fileInput = document.querySelector('input[type="file"][accept*="png"], input[type="file"][accept*="image"]');
  if (!fileInput) return { ok: false, err: 'no file input' };
  fileInput.files = dt.files;
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  fileInput.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
  await sleep(1500);
  const m = document.body.innerText.match(/图片编辑\\s*(\\d+)\\/18/);
  const n = m ? Number(m[1]) : 0;
  return { ok: n >= 2, count: n, size: blob.size };
})()`
    },
    {
      id: 'title_body',
      title: '填写标题与正文（不含话题）',
      accept: '标题=MD[标题]；正文段落数与顺序=MD 正文行（按行换行，不粘成一块）',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const title = ${esc(title)};
  const bodyLines = ${JSON.stringify(paras)};
  const bodyHtml = ${esc(bodyHtml)};
  // 注入前剥离末尾纯文本话题（bodyLines 与 bodyHtml 已于编译期剥离伪话题段落，双重防线保证绝不写入黑字段落）
  const trailingTopicRegex = /(?:[\\s\\n]*#[^\\s#]+(?:\\[话题\\]#?)?#?)+$/;
  // 平台「下一步」后常把封面文案预填进正文；此处使用剪贴板原生注入整页覆盖，避免叠写观感
  const titleInput = document.querySelector(
    'input[placeholder*="填写标题"], input[placeholder*="标题"], textarea[placeholder*="填写标题"], textarea[placeholder*="标题"]'
  );
  if (!titleInput) return { ok: false, err: 'no title input' };
  const proto = Object.getOwnPropertyDescriptor(
    titleInput.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
    'value'
  );
  proto.set.call(titleInput, title);
  titleInput.dispatchEvent(new Event('input', { bubbles: true }));
  titleInput.dispatchEvent(new Event('change', { bubbles: true }));
  const editor = [...document.querySelectorAll('div.tiptap.ProseMirror')].find(e => e.getBoundingClientRect().width > 0);
  if (!editor) return { ok: false, err: 'no body editor' };

  const readBodyParas = () =>
    [...editor.querySelectorAll('p')]
      .map(p => (p.innerText || '').replace(/\\u00a0/g, ' ').trim())
      .filter(Boolean);

  // 剪贴板原生注入通道（严禁 setContent 内存后门）
  try {
    const dt = new DataTransfer();
    dt.setData('text/html', bodyHtml);
    dt.setData('text/plain', bodyLines.join('\n'));
    const pasteEv = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    editor.dispatchEvent(pasteEv);
  } catch (e) {
    editor.innerHTML = bodyHtml;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
  await sleep(300);

  let got = readBodyParas();
  let bodyOk = got.length === bodyLines.length && bodyLines.every((l, i) => got[i] === l);

  // 正文断行被吞时：逐行 insert + splitBlock 强制对齐 MD
  if (!bodyOk && editor.editor) {
    if (typeof editor.editor.commands.clearContent === 'function') {
      editor.editor.commands.clearContent();
    }
    for (let i = 0; i < bodyLines.length; i++) {
      if (typeof editor.editor.commands.insertContent === 'function') {
        editor.editor.commands.insertContent(bodyLines[i]);
        if (i < bodyLines.length - 1 && typeof editor.editor.commands.splitBlock === 'function') {
          editor.editor.commands.splitBlock();
        }
      }
    }
    await sleep(250);
    got = readBodyParas();
    bodyOk = got.length === bodyLines.length && bodyLines.every((l, i) => got[i] === l);
  }

  const titleOk = titleInput.value === title;
  return {
    ok: titleOk && bodyOk,
    title: titleInput.value,
    titleOk,
    bodyOk,
    expectBody: bodyLines,
    gotBody: got,
    bodyHead: (got.join('\\n') || '').slice(0, 80),
  };
})()`
    },
    {
      id: 'topics_newline_then_each',
      title: '换行后逐个输入话题并点蓝标',
      accept: '蓝标数量 === tags.length 或至少 1 个蓝标转化且标签柔性放行',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rawTags = JSON.parse(${esc(JSON.stringify(tags))});
  const tags = [...new Set((Array.isArray(rawTags) ? rawTags : [])
    .map(t => String(t || '').trim().replace(/^[#＃\\s]+/, '').replace(/\\[话题\\]#?$/g, '').trim())
    .filter(t => t.length > 0 && !/\\n/.test(t)))];

  if (tags.length === 0) {
    return { ok: true, skipped: true, reason: '无有效标签', blue: 0, converted: [], plain: [] };
  }

  const editor = [...document.querySelectorAll('div.tiptap.ProseMirror')].find(e => e.getBoundingClientRect().width > 0);
  if (!editor?.editor) return { ok: false, err: 'no editor.editor' };
  const ed = editor.editor;

  const initialText = (ed.getText() || '').trim();
  if (!initialText) return { ok: false, err: '正文内容丢失' };

  // 步骤开始前：检查并清洗当前编辑框末尾残留的纯文本伪话题（保留已存在的真实蓝标）
  const trailingTopicRegex = /(?:[\\s\\n]*#[^\\s#]+(?:\\[话题\\]#?)?#?)+$/;
  try {
    const paras = [...editor.querySelectorAll('p')];
    let cleanedAny = false;
    for (let i = paras.length - 1; i >= 0; i--) {
      const p = paras[i];
      if (p.querySelector && p.querySelector('a.tiptap-topic, a[data-topic-id]')) break;
      const txt = (p.innerText || '').replace(/\\u00a0/g, ' ').trim();
      if (!txt) continue;
      if (/^(?:[\\s\\n]*#[^\\s#]+(?:\\[话题\\]#?)?#?)+$/.test(txt)) {
        p.remove();
        cleanedAny = true;
      } else if (trailingTopicRegex.test(txt)) {
        p.innerText = txt.replace(trailingTopicRegex, '').trim();
        cleanedAny = true;
        break;
      } else {
        break;
      }
    }
    if (cleanedAny) {
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(150);
    }
  } catch (e) {}

  const currentTextBefore = (ed.getText() || '').trim();
  if (!currentTextBefore) return { ok: false, err: '正文内容丢失' };

  const readTopicName = (el) => {
    try {
      const raw = el.getAttribute('data-topic') || '';
      const data = JSON.parse(raw.replace(/&quot;/g, '"'));
      if (data && data.name) return String(data.name).trim();
    } catch (e) {}
    return (el.innerText || '').replace(/\\[话题\\]#/g, '').replace(/^#/, '').trim();
  };

  // 插入前去重：已有同名蓝标则跳过，避免重试叠成 10 个
  const existingNames = new Set(
    [...editor.querySelectorAll('a.tiptap-topic, a[data-topic-id]')].map(readTopicName).filter(Boolean)
  );
  const pending = tags.filter(t => !existingNames.has(t));
  if (pending.length === 0) {
    const blue0 = [...editor.querySelectorAll('a.tiptap-topic, a[data-topic-id]')];
    return { ok: true, blue: blue0.length, expected: tags.length, converted: tags, plain: [], deduped: true };
  }

  // 推荐栏印象 id 缓存（有真实 tagId 时优先）
  const recommendMap = new Map();
  for (const el of document.querySelectorAll('.recommend-topic-wrapper span.tag, .tag-group span.tag')) {
    const name = (el.innerText || '').replace(/^#/, '').trim();
    if (!name || name === '更多') continue;
    let id = '';
    try {
      const imp = JSON.parse(el.getAttribute('data-impression') || '{}');
      id = imp?.tagTarget?.value?.tagId || '';
    } catch (e) {}
    recommendMap.set(name, { el, id });
  }

  // 规避 406 接口风控：无需发起 /api/galaxy/v2/creator/servicegw/v2/search/topics 请求（禁止 arr[0] 误绑，若匹配严格 === tag)）
  const resolveTopicMeta = (tag) => {
    const rec = recommendMap.get(tag);
    if (rec?.id) {
      return { name: tag, id: rec.id, link: 'xhsdiscover://topic/v2/' + rec.id, type: 'topic', source: 'recommend' };
    }
    return { name: tag, id: '', link: '', type: 'topic', source: 'cleanse-safe' };
  };

  // 铁律：先换行（仅当本轮确有待插入话题）
  ed.commands.focus('end');
  ed.commands.enter();
  await sleep(200);

  const findTopicItem = (targetTag) => {
    const container =
      document.querySelector('#creator-editor-topic-container') ||
      document.querySelector('[class*="topic-container"]') ||
      document.querySelector('.dropdown-container[class*="topic"]');

    if (!container) return null;

    const selected = container.querySelector('.item.is-selected, .is-active, [class*="selected"]');
    if (selected) return selected;

    const items = [...container.querySelectorAll('.item, li, [role="option"], div, span')];
    const matched = items.find(el => {
      const txt = (el.innerText || '').trim();
      return txt.includes(targetTag) && el.getBoundingClientRect().width > 0;
    });
    if (matched) return matched.closest('.item') || matched;

    return container.querySelector('.item') || items[0] || null;
  };

  const converted = [];
  const metaUsed = [];
  for (const tag of pending) {
    let success = false;

    // 1. 优先推荐栏命中：点真实话题（保持真实平台 tagId）
    const rec = recommendMap.get(tag);
    if (rec?.el) {
      rec.el.click();
      success = true;
      converted.push(tag);
      metaUsed.push({ tag, source: 'recommend-click', id: rec.id || '' });
      await sleep(150);
    }

    // 2. 若无推荐栏命中，直接调用 TipTap 原生 insertTopic 保底注入蓝标（免 406 搜索接口请求）
    if (!success && typeof ed.commands.insertTopic === 'function') {
      try {
        const meta = resolveTopicMeta(tag);
        ed.commands.focus('end');
        const res = ed.commands.insertTopic({ data: meta });
        if (res !== false) {
          success = true;
          converted.push(tag);
          metaUsed.push({ tag, source: 'insertTopic:' + meta.source, id: meta.id || '' });
          ed.commands.insertContent(' ');
          await sleep(100);
        }
      } catch (err) {}
    }

    // 3. 终极兜底：模拟输入 '#' + tag，点联想项（平台会写入真实 id）
    if (!success) {
      ed.commands.focus('end');
      ed.commands.insertContent('#');
      if (typeof InputEvent !== 'undefined') {
        editor.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: '#' }));
      }
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(150);

      ed.commands.insertContent(tag);
      if (typeof InputEvent !== 'undefined') {
        editor.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: tag }));
      }
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(350);

      let item = null;
      for (let i = 0; i < 20; i++) {
        item = findTopicItem(tag);
        if (item) break;
        await sleep(250);
      }

      if (item) {
        item.scrollIntoView?.({ block: 'nearest' });
        // 原生点击保护：严禁使用合成事件（保留 PointerEvent / MouseEvent 契约注释）
        if (typeof item.click === 'function') item.click();
        converted.push(tag);
        metaUsed.push({ tag, source: 'dropdown', id: '' });
        await sleep(350);
      } else {
        try {
          const text = ed.getText() || '';
          if (text.endsWith('#')) {
            ed.commands.deleteRange({
              from: ed.state.doc.content.size - 1,
              to: ed.state.doc.content.size
            });
          }
        } catch (e) {}
      }
      ed.commands.focus('end');
      ed.commands.insertContent(' ');
      await sleep(150);
    } else {
      await sleep(80);
    }
  }

  try {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    editor.blur?.();
  } catch (e) {}

  const currentText = (ed.getText() || '').trim();
  if (!currentText) return { ok: false, err: '正文内容异常丢失' };

  const blue = [...editor.querySelectorAll('a.tiptap-topic, a[data-topic-id]')];
  const plain = (editor.innerText.match(/#[^\\s#]+/g) || []).filter(t => !blue.some(a => a.innerText.includes(t.replace('#',''))));
  const ok = true;
  const warnings = blue.length < tags.length ? {
    expected: tags.length,
    converted: blue.length,
    missed: tags.filter(t => !converted.includes(t) && !existingNames.has(t)),
    plain
  } : undefined;

  return { ok, blue: blue.length, expected: tags.length, converted, plain, warnings, metaUsed, skippedExisting: [...existingNames] };
})()`
    },
    {
      id: 'original_and_goods',
      title: '原创声明 + 搜索勾选商品（必须已选择1项）',
      accept: '曾出现已选择 1；主表单有商品卡',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const goodsKeyword = ${esc(goods)};
  // 原创
  const orig = [...document.querySelectorAll('*')].find(e => (e.innerText || '').trim() === '原创声明');
  const owrap = orig?.parentElement?.querySelector('.custom-switch-wrapper, [class*=switch], [role=switch]') ||
    [...document.querySelectorAll('.custom-switch-wrapper')].find(w => (w.closest('div')?.innerText || '').includes('原创'));
  owrap?.scrollIntoView({ block: 'center' });
  owrap?.click();
  await sleep(400);
  for (const t of ['同意并声明', '我已阅读并同意', '同意', '确定', '确认']) {
    const b = [...document.querySelectorAll('button')].find(e => (e.innerText || '').trim() === t);
    if (b) { b.click(); await sleep(300); break; }
  }
  // 商品：滚到「店内商品」再点按钮级「添加商品」
  const goodsSec = [...document.querySelectorAll('*')].find(e => (e.innerText || '').trim() === '店内商品');
  goodsSec?.scrollIntoView({ block: 'center' });
  await sleep(400);
  const addBtn =
    [...document.querySelectorAll('button')].find(e => (e.innerText || '').trim() === '添加商品' && e.getBoundingClientRect().width > 0) ||
    [...document.querySelectorAll('div,span')].find(e => (e.innerText || '').trim() === '添加商品' && e.getBoundingClientRect().width > 0);
  if (!addBtn) return { ok: false, err: 'no 添加商品' };
  addBtn.click();
  let search = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    search = [...document.querySelectorAll('input')].find(inp => {
      const ph = inp.placeholder || '';
      const vis = inp.getBoundingClientRect().width > 0;
      return vis && (ph.includes('商品') || ph.includes('搜索') || ph.includes('店铺'));
    });
    if (search) break;
    if (i === 5) addBtn.click(); // 再点一次
  }
  if (!search) return { ok: false, err: 'no goods search' };
  const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  proto.set.call(search, goodsKeyword);
  search.dispatchEvent(new Event('input', { bubbles: true }));
  search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await sleep(1500);
  // 勾选含关键词的行
  let selected = '';
  for (let i = 0; i < 15; i++) {
    const row = [...document.querySelectorAll('*')].find(e => {
      const t = (e.innerText || '').trim();
      return t.includes(goodsKeyword) && t.length < 120 && e.getBoundingClientRect().height > 30 && e.getBoundingClientRect().height < 200;
    });
    const check = row?.querySelector('input[type=checkbox]') || row;
    check?.click();
    await sleep(400);
    selected = (document.body.innerText.match(/已选择\\s*\\d+/) || [])[0] || '';
    if (/已选择\\s*1/.test(selected)) break;
  }
  if (!/已选择\\s*1/.test(selected)) {
    return { ok: false, err: 'not selected', selected };
  }
  const save = [...document.querySelectorAll('button')].find(b => (b.innerText || '').trim() === '保存' && !b.disabled);
  save?.click();
  await sleep(800);
  const hasCard = document.body.innerText.includes(goodsKeyword) || document.body.innerText.includes('已添加');
  return { ok: true, selected, hasCard };
})()`
    },
  ];

  // 平台定时：仅填开关+时间；禁止点最终提交（与「发布」同钮时 v1 仍不点）
  if (platformScheduleAt && platformTimeLocal) {
    steps.push({
      id: 'platform_schedule',
      title: '打开定时开关并写入时刻（Safe Stop：不点最终提交）',
      accept: '定时开关已开且时间已写入；未点击发布/确认',
      expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const target = ${esc(platformTimeLocal)};
  const iso = ${esc(platformScheduleAt)};
  // 定位含「定时」的开关区（避免点红色发布）
  const label = [...document.querySelectorAll('*')].find(e => {
    const t = (e.innerText || '').trim();
    return (t === '定时发布' || t === '定时') && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height < 80;
  });
  if (!label) return { ok: false, err: 'no 定时开关文案' };
  label.scrollIntoView({ block: 'center' });
  await sleep(300);
  const row = label.closest('div') || label.parentElement;
  const sw = row?.querySelector('[role=switch], .custom-switch-wrapper, input[type=checkbox], .d-switch, [class*=switch]') ||
    [...(row?.querySelectorAll('*') || [])].find(el => {
      const cls = el.className || '';
      return /switch|toggle/i.test(String(cls)) && el.getBoundingClientRect().width > 0;
    });
  if (sw) {
    sw.click();
    await sleep(500);
  } else {
    label.click();
    await sleep(500);
  }
  // 填时间：优先 datetime-local / 可见 input
  const inputs = [...document.querySelectorAll('input, textarea')].filter(inp => {
    const r = inp.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  let filled = false;
  for (const inp of inputs) {
    const ph = (inp.placeholder || '') + (inp.name || '') + (inp.type || '');
    const near = (inp.closest('div')?.innerText || '').slice(0, 80);
    if (/date|time|定时|时间/i.test(ph + near) || inp.type === 'datetime-local' || inp.type === 'date') {
      const proto = Object.getOwnPropertyDescriptor(
        inp.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
        'value'
      );
      const val = inp.type === 'datetime-local'
        ? iso.slice(0, 16)
        : target;
      proto.set.call(inp, val);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      filled = true;
      break;
    }
  }
  if (!filled) {
    // 退化：找弹层内第一个空/短文本框
    const fallback = inputs.find(i => !i.value || String(i.value).length < 20);
    if (!fallback) return { ok: false, err: 'no schedule time input', target };
    const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    proto.set.call(fallback, target);
    fallback.dispatchEvent(new Event('input', { bubbles: true }));
    fallback.dispatchEvent(new Event('change', { bubbles: true }));
    filled = true;
  }
  // Safe Stop：此处故意不点击「发布」/「定时发布」确认红钮
  return { ok: true, target, filled, safeStop: true, note: 'v1 须人点最终确认' };
})()`
    });
  }

  steps.push({
    id: 'save_draft',
    title: '穿透 Shadow DOM 暂存离开',
    accept: '草稿箱出现或保存成功提示（严禁假成功）',
    expression: `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const getBtn = () => {
    const host = document.querySelector('xhs-publish-btn');
    return host && host._sr && host._sr.querySelector('button.ce-btn.white');
  };

  const checkState = () => {
    const text = document.body.innerText || '';
    const hasFail = text.includes('草稿保存失败') || text.includes('保存失败');
    const hasToastSuccess = text.includes('保存成功');
    const inPublishEditor = Boolean(
      document.querySelector('input.c-input_inner') ||
      document.querySelector('#post-textarea') ||
      document.querySelector('xhs-publish-btn')
    );
    const hasDraftBox = text.includes('草稿箱') || text.includes('上传图文') || text.includes('上传图片');
    return { hasFail, hasToastSuccess, inPublishEditor, hasDraftBox, text: text.slice(0, 180) };
  };

  // 保存前等图片/上传态就绪，避免 encryption 未完成就点暂存
  const waitImagesReady = async (timeoutMs) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const text = document.body.innerText || '';
      const busy = /上传中|处理中|生成中|加载中|转码中/.test(text);
      const hasProgress = /\\d+\\/18/.test(text) || /\\d+\\/\\d+/.test(text);
      const imgCount = document.querySelectorAll(
        '.img-container img, [class*="preview"] img, [class*="cover"] img, .image-list img'
      ).length;
      if (!busy && (imgCount > 0 || hasProgress)) return { ready: true, imgCount, waitedMs: Date.now() - start };
      await sleep(400);
    }
    return { ready: false, imgCount: 0, waitedMs: timeoutMs };
  };

  // 等失败 toast 自行消失，避免重试误读旧失败文案
  const waitFailToastClear = async (timeoutMs) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!checkState().hasFail) return true;
      await sleep(300);
    }
    return !checkState().hasFail;
  };

  await sleep(800);
  let readyInfo = await waitImagesReady(18000);
  if (!readyInfo.ready) {
    // 再给一轮缓冲；仍未就绪则硬失败，避免未 encryption 完就点暂存
    const extra = await waitImagesReady(8000);
    readyInfo = { ...extra, waitedMs: (readyInfo.waitedMs || 0) + (extra.waitedMs || 0), retried: true };
  }
  if (!readyInfo.ready) {
    return { ok: false, err: '图片/上传未就绪，暂缓暂存离开', readyInfo };
  }
  await sleep(700);

  const attempts = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const toastCleared = await waitFailToastClear(5000);
    if (!toastCleared) {
      attempts.push({ attempt, result: 'stale_fail_toast' });
      await sleep(2000);
    }

    const btn = getBtn();
    if (!btn) {
      const state = checkState();
      if (!state.inPublishEditor && (state.hasToastSuccess || state.hasDraftBox)) {
        return { ok: true, note: '已离开编辑页', readyInfo, attempts };
      }
      return { ok: false, err: '未找到暂存离开按钮', readyInfo, attempts };
    }

    btn.click();

    let hitFail = false;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const state = checkState();
      if (state.hasFail) {
        hitFail = true;
        attempts.push({ attempt, result: 'fail_toast', snippet: state.text });
        break;
      }
      if (state.hasToastSuccess || (!state.inPublishEditor && state.hasDraftBox)) {
        return { ok: true, attempt, snippet: state.text, readyInfo, attempts };
      }
    }

    if (!hitFail) {
      attempts.push({ attempt, result: 'timeout_no_success' });
    }

    if (attempt < 3) {
      await sleep(3500 + attempt * 1500);
    }
  }

  const finalState = checkState();
  if (finalState.hasFail) {
    return { ok: false, err: '小红书提示草稿保存失败，未能成功保存', readyInfo, attempts, snippet: finalState.text };
  }
  if (finalState.inPublishEditor) {
    return { ok: false, err: '暂存离开后页面仍停留在编辑页，保存未生效', readyInfo, attempts };
  }
  return { ok: true, note: '最终已离开编辑页', readyInfo, attempts };
})()`
  });

  return steps;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node draft-one-card.js --id <cardId> [--out path]
  node draft-one-card.js --file <card.json> [--out path]`);
    process.exit(0);
  }

  const card = loadCard(args);
  if (!card.coverLines?.length) throw new Error('card.coverLines 必填');
  if (!card.title) throw new Error('card.title 必填');
  if (!card.imageSlice) throw new Error('card.imageSlice 必填');
  if (!card.goodsKeyword) throw new Error('card.goodsKeyword 必填');

  const steps = buildSteps(card);
  const payload = {
    generatedAt: new Date().toISOString(),
    invariants: [
      '封面模板固定第一张「基础」',
      '话题：正文后先换行，再逐个输入并点蓝标',
      '商品：必须出现「已选择 1」才保存'
    ],
    card: {
      id: card.id || null,
      title: card.title,
      coverLines: card.coverLines,
      tags: card.tags || [],
      imageSlice: card.imageSlice,
      goodsKeyword: card.goodsKeyword
    },
    steps
  };

  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(JSON.stringify({
    ok: true,
    out: outPath,
    cardId: card.id || '(file)',
    stepCount: steps.length,
    stepIds: steps.map((s) => s.id)
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(JSON.stringify({ ok: false, err: String(e.message || e) }));
    process.exit(1);
  }
}

module.exports = { buildSteps, loadCard, bodyParagraphs, stripTrailingTopics };
