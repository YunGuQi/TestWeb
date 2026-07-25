import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let config = await prisma.globalConfig.findFirst();
    if (!config) {
      config = await prisma.globalConfig.create({ data: {} });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        danmakuSpeed: config.danmakuSpeed,
        danmakuOpacity: config.danmakuOpacity,
        danmakuContent: JSON.parse(config.danmakuContent || '{}')
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '获取配置失败' }, { status: 500 });
  }
}
