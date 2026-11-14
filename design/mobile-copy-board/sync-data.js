/**
 * 手机复制板 · 数据索引与切片图自动同步脚本
 * 1. 扫描 design/mobile-copy-board/data/*.md
 * 2. 自动补充缺失的切片图到 design/mobile-copy-board/data/slices/
 * 3. 重新生成精确的 index.json
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataDir = path.join(__dirname, 'data');
const slicesDir = path.join(dataDir, 'slices');
const parseScriptPath = path.join(__dirname, 'parse-md.js');

if (!fs.existsSync(slicesDir)) {
  fs.mkdirSync(slicesDir, { recursive: true });
}

if (!fs.existsSync(parseScriptPath)) {
  console.error('未找到 parse-md.js:', parseScriptPath);
  process.exit(1);
}

const parseMdCode = fs.readFileSync(parseScriptPath, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(parseMdCode, sandbox);
const parseCopyMd = sandbox.window.CopyBoardParse.parseCopyMd;

// 常见源切片目录候选池
const candidateSourceDirs = [
  path.resolve(__dirname, '../xhs-draft-console/dist/mobile-hub/slices/dnvzhu_real'),
  path.resolve(__dirname, '../xhs-draft-console/dist/mobile-hub/slices'),
  path.resolve(__dirname, '../product-docs/大女主觉醒测试/assets/结果测试截图/cards'),
  path.resolve(__dirname, '../product-docs/深度情绪内耗/assets/结果测试截图/cards'),
  path.resolve(__dirname, '../product-docs/命定恋人/assets/结果测试截图/cards'),
  path.resolve(__dirname, '../product-docs/性格城市匹配/assets/结果测试截图/cards'),
  path.resolve(__dirname, '../product-docs/恋爱物种领养中心/assets/结果测试截图/cards'),
];

const files = fs.readdirSync(dataDir)
  .filter((f) => f.endsWith('.md'))
  .sort((a, b) => {
    // 优先按日期倒序；若同日期，“批量”优先于试扩/试点，再次按文件名倒序
    const da = (a.match(/^(\d{4}-\d{2}-\d{2})/) || ['', ''])[1];
    const db = (b.match(/^(\d{4}-\d{2}-\d{2})/) || ['', ''])[1];
    if (da !== db) return db.localeCompare(da);
    if (a.includes('批量') && !b.includes('批量')) return -1;
    if (!a.includes('批量') && b.includes('批量')) return 1;
    return b.localeCompare(a, 'zh-CN');
  });

const indexList = [];
const neededSlices = new Set();

files.forEach((file) => {
  const filePath = path.join(dataDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCopyMd(content);
  const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';
  const id = file.replace(/\.md$/i, '');

  parsed.cards.forEach((card) => {
    const sliceName = card.slice || (card.id ? card.id + '_slice.png' : '');
    if (sliceName) neededSlices.add(sliceName);
  });

  indexList.push({
    id: id,
    filename: file,
    date: date,
    title: id,
    totalCards: parsed.cards.length,
  });
});

// 切片图同步
let autoCopiedCount = 0;
neededSlices.forEach((sliceName) => {
  const destPath = path.join(slicesDir, sliceName);
  if (!fs.existsSync(destPath)) {
    for (const srcDir of candidateSourceDirs) {
      if (fs.existsSync(srcDir)) {
        const candidateFile = path.join(srcDir, sliceName);
        if (fs.existsSync(candidateFile)) {
          fs.copyFileSync(candidateFile, destPath);
          autoCopiedCount++;
          break;
        }
      }
    }
  }
});

const existingSlices = fs.readdirSync(slicesDir).filter((f) => !fs.statSync(path.join(slicesDir, f)).isDirectory());
const missingSlices = Array.from(neededSlices).filter((s) => !fs.existsSync(path.join(slicesDir, s)));

const indexPath = path.join(dataDir, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(indexList, null, 2), 'utf8');

console.log(`[OK] index.json 已更新，共索引 ${indexList.length} 份文案：`);
indexList.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.date}] ${item.filename} -> ${item.totalCards} 卡`);
});

console.log(`\n[切片图状态]`);
console.log(`  - 目标目录: ${slicesDir}`);
console.log(`  - 当前包含切片图总数: ${existingSlices.length} 张`);
if (autoCopiedCount > 0) {
  console.log(`  - 本次从源目录自动同步补齐: ${autoCopiedCount} 张`);
}
if (missingSlices.length > 0) {
  console.warn(`  - 仍缺失切片图 (${missingSlices.length} 张):`, missingSlices);
} else {
  console.log(`  - 文案所需 ${neededSlices.size} 种切片图全部就绪，无缺失！`);
}
