// 本地 SQLite 数据核查脚本
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany();
  const byTest = {};
  questions.forEach(q => { byTest[q.testId] = (byTest[q.testId]||0)+1; });

  const resultConfigs = await prisma.resultConfig.findMany();
  const rc = {};
  resultConfigs.forEach(r => { rc[r.testId] = (rc[r.testId]||0)+1; });

  const globalConfigs = await prisma.globalConfig.findMany();
  const gc = {};
  globalConfigs.forEach(g => { gc[g.testId] = (gc[g.testId]||0)+1; });

  const activationCodes = await prisma.activationCode.findMany();
  const ac = {};
  activationCodes.forEach(a => { ac[a.testId] = (ac[a.testId]||0)+1; });

  const testRecords = await prisma.testRecord.findMany();
  const tr = {};
  testRecords.forEach(t => { tr[t.testId] = (tr[t.testId]||0)+1; });

  console.log('=== 本地 SQLite 数据汇总 ===');
  console.log('Questions 总数:', questions.length, JSON.stringify(byTest));
  console.log('ResultConfigs 总数:', resultConfigs.length, JSON.stringify(rc));
  console.log('GlobalConfigs 总数:', globalConfigs.length, JSON.stringify(gc));
  console.log('ActivationCodes 总数:', activationCodes.length, JSON.stringify(ac));
  console.log('TestRecords 总数:', testRecords.length, JSON.stringify(tr));

  await prisma.$disconnect();
}
main().catch(console.error);
