import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { text } = await request.json();
    const id = parseInt(params.id);

    const updated = await prisma.question.update({
      where: { id },
      data: { text }
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    console.error('Update question error:', error);
    return NextResponse.json({ success: false, error: '修改题目失败' }, { status: 500 });
  }
}
