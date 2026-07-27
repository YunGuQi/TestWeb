import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    const numericIds = Array.isArray(ids) ? ids.map(id => Number(id)).filter(id => !isNaN(id)) : [];
    if (numericIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择有效卡密 ID' }, { status: 400 });
    }

    const deleted = await prisma.activationCode.deleteMany({
      where: {
        id: { in: numericIds }
      }
    });

    revalidatePath('/ops-dashboard');
    revalidatePath('/admin');

    return NextResponse.json({ success: true, deletedCount: deleted.count });
  } catch (error: any) {
    console.error('Delete codes error:', error);
    return NextResponse.json({ success: false, error: '删除卡密失败: ' + (error.message || '') }, { status: 500 });
  }
}
