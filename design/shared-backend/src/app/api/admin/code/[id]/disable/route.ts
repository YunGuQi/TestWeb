import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const res = await db.collection('ActivationCode').doc(id).get();
    if (!res.data || res.data.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const code = res.data[0];

    const newIsDisabled = !code.isDisabled;
    await db.collection('ActivationCode').doc(id).update({
      isDisabled: newIsDisabled
    });

    return NextResponse.json({ success: true, isDisabled: newIsDisabled });
  } catch (error) {
    console.error('Disable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
