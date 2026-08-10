import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const isUnlocked = cookieStore.get('admin_unlocked')?.value === 'true';

    if (!isUnlocked) {
      return NextResponse.json({ success: false, error: '未解锁高级权限' }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: '未提供卡密ID' }, { status: 400 });
    }

    // 批量更新 isExported 为 true
    const result = await prisma.activationCode.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        isExported: true
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error('Export mark error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
