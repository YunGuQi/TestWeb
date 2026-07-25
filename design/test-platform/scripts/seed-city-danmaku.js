const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('lib/city/config/tests/city-personality.json', 'utf8'));
  
  const content = {};
  data.cities.forEach(city => {
    const key = JSON.stringify({ id: city.id, name: city.name, coords: city.coords, tags: city.tags, theme: city.theme });
    content[key] = [
      `太准了，我就是标准的${city.name}性格！`,
      `这气质绝了，完全符合${city.name}的调性`,
      `终于找到属于我的精神故乡了~`,
      `向往${city.name}很久了，没想到测试也是它`,
      `准到起鸡皮疙瘩！`
    ];
  });

  await prisma.globalConfig.updateMany({
    where: { testId: 'city-personality' },
    data: { danmakuContent: JSON.stringify(content) }
  });
  console.log('City Danmaku seeded!');
}

main().finally(() => prisma.$disconnect());
