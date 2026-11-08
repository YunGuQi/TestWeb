// batch-plan.js · 多测试全量/分批自动化编排工具
//
// 适用测试：
//   - 命定恋人 (16 结果)
//   - 深度情绪内耗 (10 结果)
//   - 恋爱物种领养中心 (16 结果)
//   - 大女主觉醒测试 (6 结果)
//   - 性格城市匹配 (16 结果)
//
// 用法:
//   node ".agent/skills/xhs-note-operator/scripts/batch-plan.js" --test "命定恋人" --all --seed 20260925
//   node ".agent/skills/xhs-note-operator/scripts/batch-plan.js" --test "深度情绪内耗" --all --seed 20260925
//   node ".agent/skills/xhs-note-operator/scripts/batch-plan.js" --test "大女主觉醒测试" --all --seed 20260925

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const SD = require(path.join(__dirname, 'skill-data.js'));

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);

const TEST = arg('--test');
const ALL = has('--all');
const PICK = Number(arg('--pick', '0')) || 0;
const SEED_ARG = arg('--seed');
const SEED = SD.resolveSeed(SEED_ARG);

if (!TEST) {
  console.error('用法: node "…/batch-plan.js" --test <测试名> [--all | --pick N] [--seed S/auto]');
  process.exit(1);
}

const root = SD.findRoot(__dirname);
const profile = SD.parseProfile(SD.profilePath(root, TEST));
const allResults = SD.loadResults(root, profile.dataSource);

const totalAvailable = allResults.length;
const targetCount = ALL ? totalAvailable : (PICK || totalAvailable);

console.log(`\n🚀 [batch-plan] 开始编排【${TEST}】| 可用结果: ${totalAvailable} | 计划排布: ${targetCount} 个结果 (${targetCount * 4} 卡)`);

// 1. 抽取结果列表
const picked = SD.pickResults(allResults, { spec: [], pick: targetCount, seed: SEED });
const scratchDir = path.join(root, '.scratch', TEST);
if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

// 2. 生成工作包 (workpack.md)
console.log(`📦 正在生成工作包...`);
const maxChars = targetCount > 10 ? 35000 : 20000;
const workpackCmd = `node "${path.join(__dirname, 'make-workpack.js')}" --test "${TEST}" --results ${picked.map(r => `r${r.idx}`).join(',')} --max-chars ${maxChars}`;
try {
  execSync(workpackCmd, { cwd: root, stdio: 'inherit' });
} catch (e) {
  console.error('❌ 工作包生成失败');
  process.exit(1);
}

// 3. 规划分批 (make-plan.js 单批最多支持 12 结果，通常建议每批 4~6 结果)
const batches = [];
if (targetCount <= 12) {
  batches.push(picked);
} else {
  // 超过 12 结果自动切批：6 + 6 + 4...
  let cursor = 0;
  while (cursor < picked.length) {
    let chunkSize = 6;
    if (picked.length - cursor === 7) chunkSize = 4; // 避免最后剩 1 个
    if (picked.length - cursor <= 6) chunkSize = picked.length - cursor;
    batches.push(picked.slice(cursor, cursor + chunkSize));
    cursor += chunkSize;
  }
}

console.log(`\n📋 分配表编排方案: 共 ${batches.length} 批`);
batches.forEach((b, i) => {
  const batchSlug = batches.length === 1 ? TEST : `${TEST}/p${i + 1}`;
  const rList = b.map(r => `r${r.idx}`).join(',');
  console.log(`  - 批次 ${i + 1}: ${b.length} 个结果 (${b.map(r => r.name.slice(0, 8)).join(' / ')})`);
  const planCmd = `node "${path.join(__dirname, 'make-plan.js')}" --test "${TEST}" --results ${rList} --slug "${batchSlug}" --seed ${SEED}`;
  try {
    execSync(planCmd, { cwd: root, stdio: 'pipe' });
  } catch (err) {
    console.error(`❌ 批次 ${i + 1} plan 生成失败:`, err.message);
  }
});

console.log(`\n✅ 全套工作包与分配表生成完毕！工作目录: .scratch/${TEST}/\n`);
