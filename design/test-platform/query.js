const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
async function run() {
  const results = await prisma.resultConfig.findMany();
  fs.writeFileSync('cities.json', JSON.stringify(results.map(r => ({
    id: r.id, 
    condition: r.condition, 
    title: r.title, 
    theme: r.theme, 
    desc: r.desc, 
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
    imageUrl: r.imageUrl
  })), null, 2));
  console.log('Saved to cities.json. count:', results.length);
}
run().finally(() => prisma.$disconnect());
