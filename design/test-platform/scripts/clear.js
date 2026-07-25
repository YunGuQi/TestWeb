const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearRecords() {
  await prisma.testRecord.deleteMany();
  console.log('Test records cleared!');
}

clearRecords()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
