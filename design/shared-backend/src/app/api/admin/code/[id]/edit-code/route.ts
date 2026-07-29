import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { newCode } = body;

    if (!newCode || typeof newCode !== 'string' || newCode.trim() === '') {
      return NextResponse.json({ success: false, error: '无效的激活码文本' }, { status: 400 });
    }

    const trimmedCode = newCode.trim();

    // Check if the new code already exists
    const existing = await db.collection('ActivationCode').where({ code: trimmedCode }).get();
    if (existing.data && existing.data.length > 0) {
      return NextResponse.json({ success: false, error: '该激活码已被使用，请换一个' }, { status: 400 });
    }

    const res = await db.collection('ActivationCode').doc(id).update({
      code: trimmedCode
    });

    return NextResponse.json({ success: true, code: trimmedCode });
  } catch (error: any) {
    console.error('Edit Code Text error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
