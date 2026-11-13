import path from 'node:path';
import { runBaotaSync } from '../worker/sync-pipeline';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: {
    config?: string;
    md?: string;
    cards?: string;
    out?: string;
    single?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--config' && args[i + 1]) opts.config = args[++i];
    else if (a === '--md' && args[i + 1]) opts.md = args[++i];
    else if (a === '--cards' && args[i + 1]) opts.cards = args[++i];
    else if (a === '--out' && args[i + 1]) opts.out = args[++i];
    else if (a === '--single') opts.single = true;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  console.log('🚀 正在启动 Mobile Post Hub 宝塔同步流水线 (多套件聚合)...');

  const result = await runBaotaSync({
    configPath: opts.config,
    mdPath: opts.md,
    cardsDir: opts.cards,
    outDir: opts.out,
    multiSuite: !opts.single,
  });

  const suitesCount = result.totalSuites || 1;
  const cardsCount = result.totalCards || 0;

  if (result.mode === 'ssh') {
    console.log(`🎉 宝塔云端自动同步完成！(已同步 ${suitesCount} 套件 / 共 ${cardsCount} 张卡片)`);
  } else {
    console.log(`📦 100% 自动降级包已就绪 (包含 ${suitesCount} 套件 / 共 ${cardsCount} 张卡片)，请参考指引上传部署。`);
  }
}

main().catch((err) => {
  console.error('❌ 执行异常:', err);
  process.exit(1);
});
