import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { text, scores } = await request.json();
    const id = parseInt(params.id);

    const updated = await prisma.option.update({
      where: { id },
      data: { 
        text,
        scores: JSON.stringify(scores)
      }
    });

    return NextResponse.json({ success: true, option: updated });
  } catch (error: any) {
    console.error('Update option error:', error);
    return NextResponse.json({ success: false, error: '修改选项失败' }, { status: 500 });
  }
}
