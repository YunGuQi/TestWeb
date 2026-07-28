import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { ids, maxUses } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0 || maxUses === undefined) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    const updated = await prisma.activationCode.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        maxUses: parseInt(maxUses) || 1
      }
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    console.error('Batch update code error:', error);
    return NextResponse.json({ success: false, error: '批量修改失败' }, { status: 500 });
  }
}
