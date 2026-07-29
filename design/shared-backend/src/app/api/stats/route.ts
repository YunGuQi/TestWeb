import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId' }, { status: 400, headers: corsHeaders });
    }

    const res = await db.collection('TestProject').where({ testId }).get();

    if (!res.data || res.data.length === 0) {
      // 兜底返回一个基础人数
      return NextResponse.json({ total: 100 }, { status: 200, headers: corsHeaders });
    }

    const project = res.data[0];

    return NextResponse.json({ 
      total: (project.baseCount || 0) + (project.realCount || 0) 
    }, { status: 200, headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500, headers: corsHeaders });
  }
}
