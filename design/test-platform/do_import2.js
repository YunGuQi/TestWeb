const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dumpPath = path.join(process.cwd(), 'vercel_dump.json');
  const dumpData = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
  console.log('Read data from vercel_dump.json');

  console.log('Truncating existing data in MySQL...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `Option`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `Question`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `TestRecord`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `ActivationCode`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `ResultConfig`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `GlobalConfig`;');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  console.log('Importing GlobalConfigs...');
  await prisma.globalConfig.createMany({ data: dumpData.globalConfigs });

  console.log('Importing ResultConfigs...');
  await prisma.resultConfig.createMany({ data: dumpData.resultConfigs });

  console.log('Importing Questions and Options...');
  for (const q of dumpData.questions) {
    const { options, ...questionData } = q;
    const createdQuestion = await prisma.question.create({ data: questionData });
    if (options && options.length > 0) {
      const optionData = options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        scores: opt.scores,
        questionId: createdQuestion.id
      }));
      await prisma.option.createMany({ data: optionData });
    }
  }

  console.log('Importing ActivationCodes...');
  const chunkSize = 100;
  for (let i = 0; i < dumpData.activationCodes.length; i += chunkSize) {
    await prisma.activationCode.createMany({ data: dumpData.activationCodes.slice(i, i + chunkSize) });
  }

  console.log('Importing TestRecords...');
  for (let i = 0; i < dumpData.testRecords.length; i += chunkSize) {
    await prisma.testRecord.createMany({ data: dumpData.testRecords.slice(i, i + chunkSize) });
  }

  console.log('Import finished successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
