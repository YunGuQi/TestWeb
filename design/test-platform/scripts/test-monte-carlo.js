const fs = require('fs');

const fileContent = fs.readFileSync('./lib/family-origin-data.ts', 'utf-8');
const questions = [];
const qRegex = /id:\s*"q\d+"[\s\S]*?options:\s*\[([\s\S]*?)\]\s*}/g;
let match;
while ((match = qRegex.exec(fileContent)) !== null) {
  const optBlock = match[1];
  const scoreMatches = [...optBlock.matchAll(/score:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  if (scoreMatches.length > 0) questions.push(scoreMatches);
}

function simulate(cutoffs) {
  const N = 50000;
  const counts = { r1: 0, r5: 0, r2: 0, r3: 0, r6: 0, r4: 0 };
  for (let i = 0; i < N; i++) {
    let total = 0;
    for (const q of questions) {
      total += q[Math.floor(Math.random() * q.length)];
    }
    let res = 'r4';
    if (total <= cutoffs[0]) res = 'r1';
    else if (total <= cutoffs[1]) res = 'r5';
    else if (total <= cutoffs[2]) res = 'r2';
    else if (total <= cutoffs[3]) res = 'r3';
    else if (total <= cutoffs[4]) res = 'r6';
    else res = 'r4';
    counts[res]++;
  }

  console.log(`Cutoffs [${cutoffs.join(', ')}] 结果:`);
  let allInRange = true;
  for (const [k, v] of Object.entries(counts)) {
    const pct = (v / N * 100).toFixed(2);
    const inRange = pct >= 14.0 && pct <= 18.5;
    if (!inRange) allInRange = false;
    console.log(`  ${k}: ${v} (${pct}%) ${inRange ? '✅' : '❌'}`);
  }
  return allInRange;
}

// 尝试不同截断点
console.log('--- 方案 1 ---');
simulate([34, 37, 39, 41, 44]);

console.log('\n--- 方案 2 ---');
simulate([34, 37, 40, 42, 45]);

console.log('\n--- 方案 3 (细调) ---');
simulate([34, 37, 39, 42, 45]);
