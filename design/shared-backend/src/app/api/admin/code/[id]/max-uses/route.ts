import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const maxUses = parseInt(body.maxUses);
    
    if (isNaN(maxUses) || maxUses < 1) {
      return NextResponse.json({ error: '无效的上限数值' }, { status: 400 });
    }

    await db.collection('ActivationCode').doc(id).update({ maxUses });

    return NextResponse.json({ success: true, maxUses });
  } catch (error) {
    console.error('Update maxUses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
