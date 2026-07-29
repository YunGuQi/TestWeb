import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function PUT(req: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { testId } = await params;
    const body = await req.json();
    const baseCount = parseInt(body.baseCount);
    
    if (isNaN(baseCount) || baseCount < 0) {
      return NextResponse.json({ error: '无效的基数值' }, { status: 400 });
    }

    const exist = await db.collection('TestProject').where({ testId }).get();
    if (!exist.data || exist.data.length === 0) {
      await db.collection('TestProject').add({ testId, baseCount, realCount: 0 });
    } else {
      const docId = exist.data[0]._id;
      await db.collection('TestProject').doc(docId).update({ baseCount });
    }

    return NextResponse.json({ success: true, baseCount });
  } catch (error) {
    console.error('Update baseCount error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
