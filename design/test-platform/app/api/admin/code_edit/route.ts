import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { id, code, maxUses } = await request.json();

    if (!id || !code) {
       return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    // Fetch the current record to get its testId
    const currentRecord = await prisma.activationCode.findUnique({ where: { id } });
    if (!currentRecord) {
      return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
    }

    // Bypass uniqueness check for the master code if specified by requirement
    if (code !== 'CODE-JIE') {
      const existing = await prisma.activationCode.findFirst({
        where: {
          code,
          testId: currentRecord.testId,
          id: { not: id }
        }
      });

      if (existing) {
         return NextResponse.json({ success: false, error: '该卡密已存在，请更换其他内容' }, { status: 400 });
      }
    }

    const updated = await prisma.activationCode.update({
      where: { id },
      data: {
        code,
        maxUses: parseInt(maxUses) || 1
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update code error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}
