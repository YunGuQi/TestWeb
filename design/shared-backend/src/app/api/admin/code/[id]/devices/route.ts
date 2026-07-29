import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const res = await db.collection('ActivationCode').doc(id).get();
    if (!res.data || res.data.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const code = res.data[0];

    const devices = code.devices || [];

    return NextResponse.json({ success: true, devices });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
