import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to PostgreSQL to export data...');

  // Fetch all data
  const resultConfigs = await prisma.resultConfig.findMany();
  const globalConfigs = await prisma.globalConfig.findMany();
  const questions = await prisma.question.findMany({
    include: { options: true }
  });
  const activationCodes = await prisma.activationCode.findMany();
  const testRecords = await prisma.testRecord.findMany();

  const dumpData = {
    resultConfigs,
    globalConfigs,
    questions,
    activationCodes,
    testRecords
  };

  const dumpPath = path.join(process.cwd(), 'vercel_dump.json');
  fs.writeFileSync(dumpPath, JSON.stringify(dumpData, null, 2), 'utf-8');
  console.log(`Exported all data to ${dumpPath}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
