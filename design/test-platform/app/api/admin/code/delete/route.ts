import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    const deleted = await prisma.activationCode.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true, deletedCount: deleted.count });
  } catch (error: any) {
    console.error('Delete codes error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
