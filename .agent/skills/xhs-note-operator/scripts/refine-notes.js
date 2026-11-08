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
  if (bodyLines.length > 0 && oralHits.length < 1) {
    issues.push(
      `[网感提示] 正文缺少口语虚词扰动，偏向公文化/AI化，建议注入：${oralWords.slice(0, 4).join('/')} 等`
    );
  }

  const shortLines = bodyLines.filter(l => l.length <= 6 && !l.startsWith('#') && !l.startsWith('['));
  if (bodyLines.length >= 4 && shortLines.length === 0) {
    issues.push(`[节奏提示] 正文行长过于匀称（缺少 ≤6 字短行节奏停顿），读感像一堵墙`);
  }
  return {
    oralHits,
    shortLines,
    issues,
    pass: issues.length === 0,
  };
}

function checkCard({ bodyLines = [], coverLines = [], title = '', tags = [], meta = '' }) {
  const issues = [];
  const rp = checkCardRhythmAndPerturbation(bodyLines);
  issues.push(...rp.issues);

  if (title && title.length > 20) {
    issues.push(`标题超长 (${title.length} 字): ${title}`);
  }

  const cLengths = coverLines.map(l => l.length);
  const minLen = Math.min(...cLengths);
  const maxLen = Math.max(...cLengths);
  const totalCover = cLengths.reduce((a, b) => a + b, 0);
  if (coverLines.length < 2 || coverLines.length > 4) {
    issues.push(`封面行数须为 2~4 行 (现 ${coverLines.length} 行): [${coverLines.join(' / ')}]`);
  }
  if (totalCover > 16) {
    issues.push(`封面总字数超16字 (${totalCover} 字): [${coverLines.join(' / ')}]`);
  }
  if (!(minLen <= 4 && maxLen >= 6)) {
    issues.push(`封面未满足短板<=4且长板>=6 (短:${minLen}, 长:${maxLen}): [${coverLines.join(' / ')}]`);
  } else if (maxLen - minLen < 3) {
    issues.push(`封面行长差 <3 字 (差:${maxLen - minLen}): [${coverLines.join(' / ')}]`);
  }
  const rhythm = detectCoverRhythm(cLengths);
  if (!rhythm) {
    issues.push(`封面节奏不合格，现 [${cLengths.join('/')}] → [${coverLines.join(' / ')}]`);
  }
  if (tags && tags.length > 0 && tags.length !== 5) {
    issues.push(`标签数不等于5 (${tags.length} 个)`);
  }
  return {
    issues,
    pass: issues.length === 0,
    oralHits: rp.oralHits,
    shortLines: rp.shortLines,
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
        let fixedTitle = titleStr;
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
          } else {
            formatIssues.push(`卡 ${cardCount} 标题超长 (${titleStr.length} 字): ${titleStr}`);
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
        if (line.length <= 15) {
          newLines.push(line);
          bodyLines.push(line);
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
            const pieces = splitLine(line);
            pieces.forEach(p => { if (p) { newLines.push(p); bodyLines.push(p); } });
          } else {
            formatIssues.push(`卡 ${cardCount} 正文单行超15字 (${line.length} 字): ${line}`);
            newLines.push(line);
            bodyLines.push(line);
          }
        }
      }
    }

    // 校验封面长短板 + 节奏形状
    const cLengths = coverLines.map(l => l.length);
    const minLen = Math.min(...cLengths);
    const maxLen = Math.max(...cLengths);
    const totalCover = cLengths.reduce((a, b) => a + b, 0);
    if (coverLines.length < 2 || coverLines.length > 4) {
      formatIssues.push(`卡 ${cardCount} 封面行数须为 2~4 行 (现 ${coverLines.length} 行): [${coverLines.join(' / ')}]`);
    }
    if (totalCover > 16) {
      formatIssues.push(`卡 ${cardCount} 封面总字数超16字 (${totalCover} 字): [${coverLines.join(' / ')}]`);
    }
    if (!(minLen <= 4 && maxLen >= 6)) {
      formatIssues.push(`卡 ${cardCount} 封面未满足短板<=4且长板>=6 (短:${minLen}, 长:${maxLen}): [${coverLines.join(' / ')}]`);
    } else if (maxLen - minLen < 3) {
      formatIssues.push(`卡 ${cardCount} 封面行长差 <3 字 (差:${maxLen - minLen}): [${coverLines.join(' / ')}]`);
    }
    const rhythm = detectCoverRhythm(cLengths);
    if (!rhythm) {
      if (coverLines.length === 3) {
        formatIssues.push(
          `卡 ${cardCount} 封面 3 行须为「长短长」或「短长短」(短≤4/长≥6)，现 [${cLengths.join('/')}] → [${coverLines.join(' / ')}]`
        );
      } else if (coverLines.length === 2) {
        formatIssues.push(
          `卡 ${cardCount} 封面 2 行须为「长短」或「短长」，现 [${cLengths.join('/')}] → [${coverLines.join(' / ')}]`
        );
      } else if (coverLines.length === 4) {
        formatIssues.push(
          `卡 ${cardCount} 封面 4 行节奏不合格（需长短错落），现 [${cLengths.join('/')}] → [${coverLines.join(' / ')}]`
        );
      }
    }

    // 校验模式一数字量纲
    if (meta.includes('模式=模式一')) {
      const hasNum = coverLines.some(l => /\d/.test(l) || /%|％/.test(l));
      if (!hasNum) {
        formatIssues.push(`卡 ${cardCount} 模式一封面缺少阿拉伯数字/百分比量纲: [${coverLines.join(' / ')}]`);
      }
    }

    // 校验标签数
    if (tagLine) {
      const tags = tagLine.split(/\s+/).filter(Boolean);
      if (tags.length !== 5) {
        formatIssues.push(`卡 ${cardCount} 标签数不等于5 (${tags.length} 个)`);
      }
    }

    // 校验口语虚词扰动与短行节奏
    const rp = checkCardRhythmAndPerturbation(bodyLines);
    rp.issues.forEach(issue => {
      formatIssues.push(`卡 ${cardCount} ${issue}`);
    });

    return '```text\n' + newLines.join('\n') + '\n```';
  });

  if (AUTO_FIX) {
    fs.writeFileSync(filePath, refinedParts.join(''), 'utf8');
    console.log(`💾 自动修复已写回原文件。`);
  }

  // 汇总输出
  console.log(`\n📊 审查结论 (扫描卡片: ${cardCount} 张):`);
  if (redlineHits.length) {
    console.log(`❌ 发现红线/0词表违规 ${redlineHits.length} 处:`);
    redlineHits.forEach(h => console.log(`   第 ${h.line} 行 [${h.word}]: ${h.text}`));
  } else {
    console.log(`✅ 红线/0词表：0 违规`);
  }

  if (formatIssues.length) {
    console.log(`⚠️ 格式硬伤问题 ${formatIssues.length} 处:`);
    formatIssues.slice(0, 10).forEach(i => console.log(`   ${i}`));
    if (formatIssues.length > 10) console.log(`   ... 剩余 ${formatIssues.length - 10} 处已省略`);
  } else {
    console.log(`✅ 物理格式（单行<=15字/标题<=20字/封面长短长·短长短/5标签）：全部合格`);
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
