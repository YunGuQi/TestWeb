import { PrismaClient } from '@prisma/client';
import { results } from '../lib/data';

const prisma = new PrismaClient();

async function main() {
  const content: Record<string, string[]> = {};
  results.forEach(r => {
    if (r.danmaku) {
      content[r.key] = r.danmaku;
    }
  });

  await prisma.globalConfig.updateMany({
    where: { testId: 'emotional-friction' },
    data: {
      danmakuContent: JSON.stringify(content)
    }
  });
  console.log('Successfully seeded danmaku for emotional-friction');
}

main().finally(() => prisma.$disconnect());
