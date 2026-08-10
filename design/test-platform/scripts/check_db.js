const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const city = await prisma.resultConfig.findMany({where: {testId: 'city-personality'}});
  const dl = await prisma.resultConfig.findMany({where: {testId: 'destiny-lover'}});
  
  console.log("City records:", city.length);
  console.log("DL records:", dl.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
