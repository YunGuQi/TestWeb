import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const keepCount = body.keepCount || 3;
    
    const res = await db.collection('ActivationCode').doc(id).get();
    if (!res.data || res.data.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const code = res.data[0];

    const devices = code.devices || [];

    if (devices.length <= keepCount) {
      return NextResponse.json({ success: true, message: `No excess devices to clear. Kept ${devices.length}.`, cleared: 0 });
    }

    const devicesToKeep = devices.slice(0, keepCount);
    const clearedCount = devices.length - devicesToKeep.length;

    await db.collection('ActivationCode').doc(id).update({
      devices: devicesToKeep
    });

    return NextResponse.json({ success: true, message: `Cleared ${clearedCount} excess devices. Kept first ${keepCount}.`, cleared: clearedCount });
  } catch (error) {
    console.error('Clear devices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
