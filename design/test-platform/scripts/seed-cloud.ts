const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  console.log('Reading dump.json...');
  const data = JSON.parse(fs.readFileSync('dump.json', 'utf-8'));

  // --- 第一步：写入 GlobalConfig ---
  {
    const prisma = new PrismaClient();
    try {
      console.log('Seeding GlobalConfig...');
      for (const c of data.configs) {
        const exists = await prisma.globalConfig.findFirst({ where: { testId: c.testId } });
        if (!exists) {
          await prisma.globalConfig.create({
            data: {
              testId: c.testId,
              baseCount: c.baseCount,
              danmakuSpeed: c.danmakuSpeed,
              danmakuOpacity: c.danmakuOpacity,
              danmakuContent: c.danmakuContent,
            }
          });
        }
      }
      console.log('✅ GlobalConfig done');
    } finally {
      await prisma.$disconnect();
    }
  }

  // --- 第二步：写入 ResultConfig ---
  {
    const prisma = new PrismaClient();
    try {
      console.log('Seeding ResultConfig...');
      for (const r of data.results) {
        const exists = await prisma.resultConfig.findFirst({ where: { testId: r.testId, title: r.title } });
        if (!exists) {
          await prisma.resultConfig.create({
            data: {
              testId: r.testId,
              title: r.title,
              desc: r.desc,
              quote: r.quote,
              imageUrl: r.imageUrl,
              condition: r.condition
            }
          });
        }
      }
      console.log('✅ ResultConfig done');
    } finally {
      await prisma.$disconnect();
    }
  }

  // --- 第三步：逐题写入（每题独立新连接） ---
  console.log('Seeding Questions...');
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const prisma = new PrismaClient();
    try {
      const exists = await prisma.question.findFirst({ where: { testId: q.testId, text: q.text } });
      if (!exists) {
        await prisma.question.create({
          data: {
            testId: q.testId,
            order: q.order,
            text: q.text,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                scores: o.scores
              }))
            }
          }
        });
        console.log(`  ✅ Q${i + 1}: ${q.text.slice(0, 20)}...`);
      } else {
        console.log(`  ⏭ Q${i + 1}: already exists`);
      }
    } finally {
      await prisma.$disconnect();
    }
    // 每题之间稍作等待，避免 serverless 连接被踢
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n🎉 All done! 数据已写入云端数据库');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
