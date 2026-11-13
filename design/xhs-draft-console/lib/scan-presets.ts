import fs from 'fs';
import path from 'path';

export interface ScannedPresetItem {
  id: string;
  name: string;
  category: string;
  mdPath: string;
  cardsDir: string;
}

/**
 * 动态扫描本地已有的文案与切片目录
 * 根目录：design/product-docs/ 以及本地测试样例
 */
export function scanProductPresets(repoRoot?: string): ScannedPresetItem[] {
  const root =
    repoRoot ||
    path.resolve(process.cwd(), '..', '..'); // 兼容 design/xhs-draft-console 执行路径

  const presets: ScannedPresetItem[] = [];

  // 1. 本地联调固定样例
  const fixtureMd = path.join(
    root,
    '.scratch/xhs-draft-autofill/fixtures/dnvzhu-compliant-3cards.md'
  );
  const fixtureCards = path.join(
    root,
    '.scratch/xhs-draft-autofill/fixtures/cards'
  );
  if (fs.existsSync(fixtureMd)) {
    presets.push({
      id: 'fixture_3cards',
      name: '★ 方案A 3卡可跑样例 (本地联调)',
      category: '联调样例',
      mdPath: fixtureMd.replace(/\\/g, '/'),
      cardsDir: fixtureCards.replace(/\\/g, '/'),
    });
  }

  // 2. 动态扫描 design/product-docs 下所有测试产品
  const productDocsDir = path.join(root, 'design/product-docs');
  if (fs.existsSync(productDocsDir)) {
    const products = fs
      .readdirSync(productDocsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'common')
      .map((d) => d.name);

    for (const prod of products) {
      const prodDir = path.join(productDocsDir, prod);
      const docsDir = path.join(prodDir, 'docs');
      const cardsDir = path.join(prodDir, 'assets/结果测试截图/cards');
      const normCardsDir = fs.existsSync(cardsDir)
        ? cardsDir.replace(/\\/g, '/')
        : '';

      // 扫描 docs 下所有以 *发帖文案.md 结尾的文件
      let foundMds: string[] = [];
      if (fs.existsSync(docsDir)) {
        foundMds = fs
          .readdirSync(docsDir)
          .filter((f) => f.endsWith('.md') && f.includes('发帖文案'))
          .sort()
          .reverse(); // 最新的日期排在前面
      }

      if (foundMds.length > 0) {
        for (const mdName of foundMds) {
          const fullMd = path.join(docsDir, mdName).replace(/\\/g, '/');
          const dateMatch = mdName.match(/\d{4}-\d{2}-\d{2}/);
          const dateLabel = dateMatch ? ` (${dateMatch[0]})` : ` (${mdName})`;
          presets.push({
            id: `${prod}_${mdName}`,
            name: `${prod} · ${dateLabel}`,
            category: prod,
            mdPath: fullMd,
            cardsDir: normCardsDir,
          });
        }
      } else {
        // 如果该产品暂无文案，但有切片卡片目录，依然允许列出方便选择
        if (normCardsDir) {
          presets.push({
            id: `${prod}_cards_only`,
            name: `${prod} · cards 切片目录`,
            category: prod,
            mdPath: '',
            cardsDir: normCardsDir,
          });
        }
      }
    }
  }

  return presets;
}
