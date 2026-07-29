import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function POST(req: Request) {
  try {
    const { count, maxUses, testId } = await req.json();
    const codes = [];
    
    // 映射前缀
    const prefixMap: Record<string, string> = {
      'emotional-friction': 'EMO-',
      'city-personality': 'CITY-',
      'destined-lover': 'LOVE-',
      'dating-style': 'DATE-'
    };
    
    const actualTestId = testId || '';
    const prefix = actualTestId && prefixMap[actualTestId] ? prefixMap[actualTestId] : 'CODE-';

    for (let i = 0; i < count; i++) {
      codes.push({
        id: crypto.randomUUID(),
        code: `${prefix}${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        maxUses: maxUses || 3,
        devices: [],
        isDisabled: false,
        testId: actualTestId, // 空表示通用
        createdAt: new Date().toISOString(),
      });
    }

    // CloudBase db collection add 传递数组可能会被当作单个对象插入（键为 '0', '1'），
    // 导致数据结构损坏。最安全的做法是使用 Promise.all 并发插入单条记录。
    await Promise.all(codes.map(code => db.collection('ActivationCode').add(code)));

    return NextResponse.json({ success: true, count: codes.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
