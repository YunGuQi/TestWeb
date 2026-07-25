import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const { title, desc, quote, imageUrl } = await request.json();
    const id = parseInt(rawId);

    const updated = await prisma.resultConfig.update({
      where: { id },
      data: { title, desc, quote, imageUrl }
    });

    return NextResponse.json({ success: true, result: updated });
  } catch (error: any) {
    console.error('Update result error:', error);
    return NextResponse.json({ success: false, error: '修改结果配置失败' }, { status: 500 });
  }
}
