import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

function generateRandomCode(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const { count, maxUses, testId } = await request.json();
    const codesToCreate = [];

    for (let i = 0; i < count; i++) {
      const currentTestId = testId || 'emotional-friction';
      const prefix = currentTestId === 'emotional-friction' ? 'EMO' : currentTestId === 'city-personality' ? 'CITY' : currentTestId === 'destiny-lover' ? 'LOVE' : 'CODE';
      
      codesToCreate.push({
        testId: currentTestId,
        code: `${prefix}-${generateRandomCode(8)}`,
        maxUses: maxUses || 3,
        devices: '[]',
        isDisabled: false
      });
    }

    const created = await prisma.$transaction(
      codesToCreate.map(codeData => prisma.activationCode.create({ data: codeData }))
    );

    return NextResponse.json({ success: true, count: created.length, codes: created });
  } catch (error: any) {
    console.error('Generate codes error:', error);
    return NextResponse.json({ success: false, error: '生成失败' }, { status: 500 });
  }
}
