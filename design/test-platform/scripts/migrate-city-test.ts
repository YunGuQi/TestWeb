import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const TEST_ID = 'city-personality';

async function main() {
  console.log('Migrating City Personality Test to DB...');

  const configPath = path.join(process.cwd(), 'lib/city/config/tests/city-personality.json');
  const fileContent = fs.readFileSync(configPath, 'utf-8');
  const data = JSON.parse(fileContent);

  // 1. Clear existing city-personality data
  await prisma.testRecord.deleteMany({ where: { testId: TEST_ID } });
  await prisma.globalConfig.deleteMany({ where: { testId: TEST_ID } });
  await prisma.resultConfig.deleteMany({ where: { testId: TEST_ID } });
  
  // Options are cascaded deleted? Actually we might need to delete options first
  const existingQuestions = await prisma.question.findMany({ where: { testId: TEST_ID } });
  for (const q of existingQuestions) {
    await prisma.option.deleteMany({ where: { questionId: q.id } });
  }
  await prisma.question.deleteMany({ where: { testId: TEST_ID } });

  console.log('Cleared old city-personality data.');

  // 2. Insert ResultConfigs (Cities)
  for (const city of data.cities) {
    await prisma.resultConfig.create({
      data: {
        testId: TEST_ID,
        title: city.title,
        desc: city.desc,
        quote: city.quote,
        imageUrl: `/images/city/${city.id}.png`, 
        condition: JSON.stringify({ id: city.id, name: city.name, coords: city.coords, tags: city.tags, theme: city.theme }), // Store extra city data in condition
      }
    });
  }
  console.log(`Inserted ${data.cities.length} ResultConfigs (cities).`);

  // 3. Insert Questions and Options
  let order = 1;
  for (const q of data.questions) {
    const createdQuestion = await prisma.question.create({
      data: {
        testId: TEST_ID,
        order: order++,
        text: q.text
      }
    });

    for (const opt of q.opts) {
      // opt.e is an array of 5 scores corresponding to rhythm, env, temp, social, taste
      const scoresObj = {
        rhythm: opt.e[0],
        env: opt.e[1],
        temp: opt.e[2],
        social: opt.e[3],
        taste: opt.e[4],
        billName: opt.t.substring(0, 5) // Mock bill name
      };

      await prisma.option.create({
        data: {
          questionId: createdQuestion.id,
          text: opt.t,
          scores: JSON.stringify(scoresObj)
        }
      });
    }
  }
  console.log(`Inserted ${data.questions.length} Questions with Options.`);

  // 4. Create GlobalConfig for city test
  await prisma.globalConfig.create({
    data: {
      testId: TEST_ID,
      baseCount: 0,
      danmakuSpeed: 50,
      danmakuOpacity: 70,
      danmakuContent: "{}"
    }
  });
  console.log('Created GlobalConfig.');

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
