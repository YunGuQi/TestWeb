/**
 * 手机复制板 · 多测试数据索引与切片图自动同步脚本
 * 
 * 规范：按测试分目录管理
 * 目录：design/mobile-copy-board/data/<testId>/
 *   - index.json   文案索引
 *   - *.md         发帖文案 markdown
 *   - slices/      对应切片图
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDataDir = path.join(__dirname, 'data');
const parseScriptPath = path.join(__dirname, 'parse-md.js');

if (!fs.existsSync(parseScriptPath)) {
  console.error('未找到 parse-md.js:', parseScriptPath);
  process.exit(1);
}

const parseMdCode = fs.readFileSync(parseScriptPath, 'utf8');
const sandbox = { window: {}, globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(parseMdCode, sandbox);
const parseCopyMd = sandbox.window.CopyBoardParse.parseCopyMd;

// 5 大测试定义
const TESTS = [
  {
    id: 'family-origin',
    name: '大女主觉醒测试',
    productDocName: '大女主觉醒测试',
    sliceSources: [
      path.resolve(__dirname, '../xhs-draft-console/dist/mobile-hub/slices/dnvzhu_real'),
      path.resolve(__dirname, '../xhs-draft-console/dist/mobile-hub/slices'),
      path.resolve(__dirname, '../product-docs/大女主觉醒测试/assets/结果测试截图/cards'),
      path.resolve(__dirname, 'data/slices'),
      path.resolve(__dirname, 'data/family-origin/slices'),
    ],
  },
  {
    id: 'emo',
    name: '深度情绪内耗测试',
    productDocName: '深度情绪内耗',
    sliceSources: [
      path.resolve(__dirname, '../product-docs/深度情绪内耗/assets/结果测试截图/cards'),
      path.resolve(__dirname, 'data/emo/slices'),
    ],
  },
  {
    id: 'destiny-lover',
    name: '命定恋人测试',
    productDocName: '命定恋人',
    sliceSources: [
      path.resolve(__dirname, '../product-docs/命定恋人/assets/结果测试截图/cards'),
      path.resolve(__dirname, 'data/destiny-lover/slices'),
    ],
  },
  {
    id: 'city',
    name: '性格城市匹配测试',
    productDocName: '性格城市匹配',
    sliceSources: [
      path.resolve(__dirname, '../product-docs/性格城市匹配/assets/结果测试截图/cards'),
      path.resolve(__dirname, 'data/city/slices'),
    ],
  },
  {
    id: 'love-species',
    name: '恋爱物种分析',
    productDocName: '恋爱物种领养中心',
    sliceSources: [
      path.resolve(__dirname, '../product-docs/恋爱物种领养中心/assets/结果测试截图/cards'),
      path.resolve(__dirname, 'data/love-species/slices'),
    ],
  },
];

// 步骤 0: 若旧版根目录下有 大女主 的 md 或 slices，将其搬移至 data/family-origin/
const familyOriginDir = path.join(baseDataDir, 'family-origin');
const familyOriginSlicesDir = path.join(familyOriginDir, 'slices');
if (!fs.existsSync(familyOriginSlicesDir)) {
  fs.mkdirSync(familyOriginSlicesDir, { recursive: true });
}

// 迁移根目录下的 .md
const rootMdFiles = fs.readdirSync(baseDataDir).filter((f) => f.endsWith('.md'));
rootMdFiles.forEach((file) => {
  const src = path.join(baseDataDir, file);
  const dest = path.join(familyOriginDir, file);
  fs.renameSync(src, dest);
  console.log(`[迁移] ${file} -> data/family-origin/${file}`);
});

// 迁移根目录下的 slices/
const rootSlicesDir = path.join(baseDataDir, 'slices');
if (fs.existsSync(rootSlicesDir)) {
  const rootSlices = fs.readdirSync(rootSlicesDir);
  rootSlices.forEach((file) => {
    const src = path.join(rootSlicesDir, file);
    const dest = path.join(familyOriginSlicesDir, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
    fs.unlinkSync(src);
  });
  try {
    fs.rmdirSync(rootSlicesDir);
    console.log('[迁移] data/slices/ 目录已合并并移除');
  } catch (_) {}
}

// 写入统一 tests.json
const testsJsonList = TESTS.map((t) => ({ id: t.id, name: t.name }));
fs.writeFileSync(path.join(baseDataDir, 'tests.json'), JSON.stringify(testsJsonList, null, 2), 'utf8');

console.log('==============================================');
console.log('手机复制板 · 5 大测试数据与切片同步状态');
console.log('==============================================');

const summaryReport = [];

TESTS.forEach((test) => {
  const testDir = path.join(baseDataDir, test.id);
  const slicesDir = path.join(testDir, 'slices');
  if (!fs.existsSync(slicesDir)) {
    fs.mkdirSync(slicesDir, { recursive: true });
  }

  // 1. 先扫描本测试下的 md 文件
  const mdFiles = fs.existsSync(testDir)
    ? fs.readdirSync(testDir)
        .filter((f) => f.endsWith('.md'))
        .sort((a, b) => {
          const da = (a.match(/^(\d{4}-\d{2}-\d{2})/) || ['', ''])[1];
          const db = (b.match(/^(\d{4}-\d{2}-\d{2})/) || ['', ''])[1];
          if (da !== db) return db.localeCompare(da);
          if (a.includes('批量') && !b.includes('批量')) return -1;
          if (!a.includes('批量') && b.includes('批量')) return 1;
          return b.localeCompare(a, 'zh-CN');
        })
    : [];

  // 计算候选素材池中的切片图总数
  let candidateSlicesCount = 0;
  test.sliceSources.forEach((srcDir) => {
    if (fs.existsSync(srcDir) && srcDir !== slicesDir) {
      const files = fs.readdirSync(srcDir).filter((f) => /\.(png|jpg|webp)$/i.test(f));
      candidateSlicesCount = Math.max(candidateSlicesCount, files.length);
    }
  });

  let copiedSlicesCount = 0;
  const indexList = [];
  const missingCardSlices = [];

  if (mdFiles.length === 0) {
    // 暂无文案的测试：不向复制板提交冗余原图，创建 .gitkeep 保持目录结构
    const gitkeepPath = path.join(slicesDir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '', 'utf8');
    }
    const indexPath = path.join(testDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify([], null, 2), 'utf8');

    summaryReport.push({
      id: test.id,
      name: test.name,
      mdCount: 0,
      sliceCount: 0,
      candidateSlicesCount: candidateSlicesCount,
      newCopied: 0,
      missingSlices: [],
      files: [],
    });
    return;
  }

  // 有文案的测试：解析所有卡片需要的切片，并从候选池按需精准同步
  const neededSlices = new Set();
  const cardList = [];

  mdFiles.forEach((file) => {
    const filePath = path.join(testDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseCopyMd(content, { testId: test.id });
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';
    const id = file.replace(/\.md$/i, '');

    parsed.cards.forEach((card) => {
      const rule1 = card.slice ? card.slice.trim() : '';
      const rule2 = card.id ? card.id.trim() + '_slice.png' : '';
      if (rule1) neededSlices.add(rule1);
      if (rule2) neededSlices.add(rule2);
      cardList.push({ file, card, rule1, rule2 });
    });

    indexList.push({
      id: id,
      filename: file,
      date: date,
      title: id,
      totalCards: parsed.cards.length,
      productName: test.name,
    });
  });

  // 从候选池补齐所需切片
  test.sliceSources.forEach((srcDir) => {
    if (fs.existsSync(srcDir) && srcDir !== slicesDir) {
      const files = fs.readdirSync(srcDir);
      files.forEach((file) => {
        if (neededSlices.has(file)) {
          const target = path.join(slicesDir, file);
          if (!fs.existsSync(target)) {
            fs.copyFileSync(path.join(srcDir, file), target);
            copiedSlicesCount++;
          }
        }
      });
    }
  });

  const existingSlices = new Set(
    fs.readdirSync(slicesDir).filter((f) => !fs.statSync(path.join(slicesDir, f)).isDirectory() && f !== '.gitkeep')
  );

  cardList.forEach(({ file, card, rule1, rule2 }) => {
    const hasRule1 = rule1 && existingSlices.has(rule1);
    const hasRule2 = rule2 && existingSlices.has(rule2);
    if (!hasRule1 && !hasRule2) {
      missingCardSlices.push({
        file: file,
        cardId: card.id,
        requestedSlice: rule1 || rule2,
        rule1: rule1,
        rule2: rule2,
      });
    }
  });

  // 写入本测试 index.json
  const indexPath = path.join(testDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexList, null, 2), 'utf8');

  summaryReport.push({
    id: test.id,
    name: test.name,
    mdCount: mdFiles.length,
    sliceCount: existingSlices.size,
    newCopied: copiedSlicesCount,
    missingSlices: missingCardSlices,
    files: mdFiles,
  });
});

// 输出汇报
summaryReport.forEach((item) => {
  console.log(`\n【测试: ${item.name} (${item.id})】`);
  console.log(`  - 发帖文案 md: ${item.mdCount} 份 ${item.mdCount === 0 ? '(暂无文案)' : ''}`);
  if (item.mdCount > 0) {
    item.files.forEach((f, idx) => console.log(`      ${idx + 1}. ${f}`));
    console.log(`  - 切片图数量: ${item.sliceCount} 张 ${item.newCopied > 0 ? `(本次新同步 ${item.newCopied} 张)` : ''}`);
  } else {
    console.log(`  - 切片图候选池: ${item.candidateSlicesCount} 张 (真实存在于 product-docs assets 中，暂无发帖文案 md)`);
  }
  if (item.missingSlices.length > 0) {
    console.warn(`  - ⚠️ 缺失切片图 (${item.missingSlices.length} 张):`);
    item.missingSlices.forEach((m) => {
      console.warn(`      文件: ${m.file} | 卡片: ${m.cardId} | 需找: ${m.requestedSlice} (规则1: ${m.rule1 || '空'}, 规则2: ${m.rule2})`);
    });
  } else if (item.mdCount > 0) {
    console.log(`  -  所有卡片切片图匹配完整（按规则1/规则2校验全部就绪）`);
  }
});
console.log('\n==============================================\n');
