import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId') || 'emotional-friction';

    let config = await prisma.globalConfig.findFirst({ where: { testId } });
    if (!config) {
      config = await prisma.globalConfig.create({ data: { testId } });
    }
    
    const testRecordCount = await prisma.testRecord.count({ where: { testId } });
    const baseCount = config.baseCount || 12544; // Default to 12544 if 0 for backward compatibility
    const pv = baseCount + testRecordCount * 3;
    
    return NextResponse.json({
      success: true,
      data: {
        danmakuSpeed: config.danmakuSpeed,
        danmakuOpacity: config.danmakuOpacity,
        danmakuContent: JSON.parse(config.danmakuContent || '{}'),
        pv
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '获取配置失败' }, { status: 500 });
  }
}
