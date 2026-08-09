import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dumpPath = path.join(process.cwd(), 'vercel_dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Dump file not found: ${dumpPath}`);
  }

  const dumpData = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
  console.log('Read data from vercel_dump.json');

  console.log('Clearing existing data in SQLite...');
  // Clear tables in reverse dependency order
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.testRecord.deleteMany();
  await prisma.activationCode.deleteMany();
  await prisma.resultConfig.deleteMany();
  await prisma.globalConfig.deleteMany();

  console.log('Importing GlobalConfigs...');
  await prisma.globalConfig.createMany({
    data: dumpData.globalConfigs
  });

  console.log('Importing ResultConfigs...');
  await prisma.resultConfig.createMany({
    data: dumpData.resultConfigs
  });

  console.log('Importing Questions and Options...');
  for (const q of dumpData.questions) {
    const { options, ...questionData } = q;
    
    // create the question first
    const createdQuestion = await prisma.question.create({
      data: questionData
    });

    // create options linked to the question
    if (options && options.length > 0) {
      const optionData = options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        scores: opt.scores,
        questionId: createdQuestion.id
      }));
      await prisma.option.createMany({
        data: optionData
      });
    }
  }

  console.log('Importing ActivationCodes...');
  // Chunking to avoid "too many variables" in SQLite
  const chunkSize = 100;
  for (let i = 0; i < dumpData.activationCodes.length; i += chunkSize) {
    await prisma.activationCode.createMany({
      data: dumpData.activationCodes.slice(i, i + chunkSize)
    });
  }

  console.log('Importing TestRecords...');
  for (let i = 0; i < dumpData.testRecords.length; i += chunkSize) {
    await prisma.testRecord.createMany({
      data: dumpData.testRecords.slice(i, i + chunkSize)
    });
  }

  console.log('Import finished successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
