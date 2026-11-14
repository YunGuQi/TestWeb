/**
 * 手机复制板 · 数据索引自动更新脚本
 * 扫描 design/mobile-copy-board/data/*.md 并重新生成精确的 index.json
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataDir = path.join(__dirname, 'data');
const parseScriptPath = path.join(__dirname, 'parse-md.js');

if (!fs.existsSync(parseScriptPath)) {
  console.error('未找到 parse-md.js:', parseScriptPath);
  process.exit(1);
}

const parseMdCode = fs.readFileSync(parseScriptPath, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(parseMdCode, sandbox);
const parseCopyMd = sandbox.window.CopyBoardParse.parseCopyMd;

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

files.forEach((file) => {
  const filePath = path.join(dataDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCopyMd(content);
  const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';
  const id = file.replace(/\.md$/i, '');

  indexList.push({
    id: id,
    filename: file,
    date: date,
    title: id,
    totalCards: parsed.cards.length,
  });
});

const indexPath = path.join(dataDir, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(indexList, null, 2), 'utf8');
console.log(`[OK] index.json 已更新，共索引 ${indexList.length} 份文案：`);
indexList.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.date}] ${item.filename} -> ${item.totalCards} 卡`);
});
