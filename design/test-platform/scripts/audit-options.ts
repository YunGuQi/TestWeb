import { familyOriginQuestions } from '../lib/family-origin-data';

console.log('=== 题库 15 道题选项权重逐题审计 ===\n');

familyOriginQuestions.forEach((q, idx) => {
  console.log(`【第 ${idx + 1} 题】${q.id}: ${q.text}`);
  q.options.forEach((opt, oIdx) => {
    console.log(`  选项 ${String.fromCharCode(65 + oIdx)}: "${opt.text}" -> I:${opt.scores.I}, B:${opt.scores.B}, H:${opt.scores.H}`);
  });
  console.log('');
});
