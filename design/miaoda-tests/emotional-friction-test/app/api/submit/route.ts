import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { deviceId, answers } = await request.json();

    // 简单地存入数据库
    const record = await prisma.testRecord.create({
      data: {
        deviceId: deviceId || 'unknown',
        answers: JSON.stringify(answers),
        // 如果要在此处计算 resultId，可以在此处编写算分逻辑
        // 为极简演示，前端可以直接将算好的 result 传过来，或者我们在前端渲染结果
      }
    });

    return NextResponse.json({ success: true, recordId: record.id });
  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: '提交失败' }, { status: 500 });
  }
}
