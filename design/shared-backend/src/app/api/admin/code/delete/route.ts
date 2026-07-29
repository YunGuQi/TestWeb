import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing or invalid ids' }, { status: 400 });
    }

    const _ = db.command;
    const res = await db.collection('ActivationCode').where({
      _id: _.in(ids)
    }).remove();

    return NextResponse.json({ 
      success: true, 
      message: `已成功删除 ${res.deleted} 个卡密`,
      deletedCount: res.deleted
    });
  } catch (error: any) {
    console.error('Delete Code error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
