import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';
import { TEST_PROJECTS } from '@/config/projects';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testId, deviceId } = body;

    if (!testId || !deviceId) {
      return NextResponse.json({ error: '缺少必需的参数' }, { status: 400, headers: corsHeaders });
    }

    const configProject = TEST_PROJECTS.find(p => p.testId === testId);
    if (!configProject) {
      return NextResponse.json({ error: '无效的项目：配置中未找到该 testId' }, { status: 400, headers: corsHeaders });
    }

    const _ = db.command;

    // Atomic increment
    const updateRes = await db.collection('TestProject').where({ testId }).update({
      realCount: _.inc(1)
    });

    let currentRealCount = 1;

    if (updateRes.updated === 0) {
      // document doesn't exist, insert it!
      await db.collection('TestProject').add({
        id: testId + '-test',
        testId: testId,
        name: configProject.name,
        baseCount: configProject.baseCount,
        realCount: 1
      });
    } else {
       // get the new realCount
       const getRes = await db.collection('TestProject').where({ testId }).get();
       if (getRes.data && getRes.data.length > 0) {
         currentRealCount = getRes.data[0].realCount;
       }
    }

    return NextResponse.json({ 
      success: true,
      current_rank: configProject.baseCount + currentRealCount
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500, headers: corsHeaders });
  }
}
