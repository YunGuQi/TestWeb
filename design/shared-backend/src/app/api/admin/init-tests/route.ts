import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function GET() {
  try {
    const _ = db.command;
    
    const projects = [
      { testId: 'emotional-friction', name: '情绪摩擦力测试', baseCount: 12000, realCount: 0 },
      { testId: 'destined-lover', name: '命定恋人测试', baseCount: 8000, realCount: 0 }
    ];

    let inserted = 0;
    for (const p of projects) {
      // Check if exists
      const exist = await db.collection('TestProject').where({ testId: p.testId }).get();
      if (!exist.data || exist.data.length === 0) {
        await db.collection('TestProject').add(p);
        inserted++;
      }
    }

    return NextResponse.json({ success: true, message: `成功插入 ${inserted} 个测试项目` });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
