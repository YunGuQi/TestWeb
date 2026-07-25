const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin demo data...');

  // 1. Create Activation Codes
  const codes = [
    { code: 'XHS-EMO-2026-VIP1', maxUses: 5, isDisabled: false, devices: '[]' },
    { code: 'XHS-EMO-2026-VIP2', maxUses: 3, isDisabled: false, devices: '[]' },
    { code: 'XHS-EMO-2026-TEST', maxUses: 10, isDisabled: true, devices: '["device-abcd-1234"]' }
  ];

  for (const c of codes) {
    await prisma.activationCode.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log('✅ Activation codes inserted.');

  // 2. Create Test Records (Simulating real user test completion)
  // We'll just generate some random data
  for (let i = 0; i < 15; i++) {
    const randomResultId = Math.floor(Math.random() * 4) + 1; // Assuming 4 results exist
    await prisma.testRecord.create({
      data: {
        deviceId: `device-mock-${Math.random().toString(36).substring(7)}`,
        answers: JSON.stringify({ q1: 'A', q2: 'B', q3: 'C' }),
        resultId: randomResultId,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random past date
      }
    });
  }
  console.log('✅ 15 Mock Test Records inserted.');

  console.log('Seeding finished. You can now view these in the Admin dashboard.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
