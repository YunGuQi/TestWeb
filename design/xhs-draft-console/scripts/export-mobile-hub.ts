import path from 'node:path';
import fs from 'node:fs';
import { exportMobileHubData } from '../lib/export/mobile-hub-exporter';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: {
    mdPath?: string;
    cardsDir?: string;
    outDir?: string;
    password?: string;
    noZip?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--md' && args[i + 1]) {
      opts.mdPath = args[++i];
    } else if (arg === '--cards' && args[i + 1]) {
      opts.cardsDir = args[++i];
    } else if (arg === '--out' && args[i + 1]) {
      opts.outDir = args[++i];
    } else if (arg === '--pwd' && args[i + 1]) {
      opts.password = args[++i];
    } else if (arg === '--no-zip') {
      opts.noZip = true;
    }
  }

  return opts;
}

function findDefaultMd(): string {
  const candidates = [
    'design/product-docs/大女主觉醒测试/docs/2026-10-28_发帖文案.md',
    'design/product-docs/大女主觉醒测试/docs/2026-10-10_发帖文案.md',
    'design/xhs-draft-console/tests/fixtures/sample-copy.md',
  ];

  for (const c of candidates) {
    const full = path.resolve(process.cwd(), c);
    if (fs.existsSync(full)) return full;
    const fromConsole = path.resolve(process.cwd(), '../../', c);
    if (fs.existsSync(fromConsole)) return fromConsole;
  }

  return path.resolve(__dirname, '../tests/fixtures/sample-copy.md');
}

function findDefaultCardsDir(): string | undefined {
  const candidates = [
    'design/product-docs/大女主觉醒测试/assets',
    'design/product-docs/大女主觉醒测试',
  ];
  for (const c of candidates) {
    const full = path.resolve(process.cwd(), c);
    if (fs.existsSync(full)) return full;
    const fromConsole = path.resolve(process.cwd(), '../../', c);
    if (fs.existsSync(fromConsole)) return fromConsole;
  }
  return undefined;
}

async function main() {
  const opts = parseArgs();
  const mdPath = opts.mdPath ? path.resolve(opts.mdPath) : findDefaultMd();
  const cardsDir = opts.cardsDir ? path.resolve(opts.cardsDir) : findDefaultCardsDir();

  console.log('🚀 开始导出 Mobile Post Hub 静态数据包...');
  console.log(`📄 文案路径: ${mdPath}`);
  if (cardsDir) console.log(`🖼️ 切片目录: ${cardsDir}`);

  const startTime = Date.now();
  const result = await exportMobileHubData({
    mdPath,
    cardsDir,
    outDir: opts.outDir,
    accessPassword: opts.password,
    generateZip: !opts.noZip,
  });

  const duration = Date.now() - startTime;
  console.log('✅ 导出完成！');
  console.log(`📦 卡片总数: ${result.totalCards} 张`);
  console.log(`📂 输出目录: ${result.outDir}`);
  if (result.zipPath) {
    const stat = fs.statSync(result.zipPath);
    console.log(`🗜️ 压缩包: ${result.zipPath} (${(stat.size / 1024).toFixed(1)} KB)`);
  }
  console.log(`⏱️ 耗时: ${duration} ms`);
}

main().catch((err) => {
  console.error('❌ 导出异常:', err);
  process.exit(1);
});
