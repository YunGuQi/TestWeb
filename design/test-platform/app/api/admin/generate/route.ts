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
    const { count, maxUses, testId, vendor } = await request.json();
    const codesToCreate = [];

    for (let i = 0; i < count; i++) {
      const currentTestId = testId || 'emotional-friction';
      const prefixMap: Record<string, string> = {
        'emotional-friction': 'EMO',
        'city-personality': 'CITY',
        'destiny-lover': 'DESTINY',
        'love-species': 'LOVE',
        'family-origin': 'FAM'
      };
      const prefix = prefixMap[currentTestId] || 'CODE';
      
      codesToCreate.push({
        testId: currentTestId,
        code: `${prefix}-${generateRandomCode(8)}`,
        maxUses: maxUses || 3,
        devices: '[]',
        isDisabled: false,
        vendor: vendor || 'main'
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
