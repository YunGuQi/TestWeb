const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    where: { testId: 'destiny-lover' },
  });
  console.log('Destiny-lover questions count:', questions.length);
  if (questions.length > 0) {
    console.log(questions[0]);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
