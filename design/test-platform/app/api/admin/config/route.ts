import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId') || 'emotional-friction';
    
    let config = await prisma.globalConfig.findFirst({ where: { testId } });
    if (!config) {
      config = await prisma.globalConfig.create({ data: { testId } });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '获取配置失败' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { danmakuSpeed, danmakuOpacity, danmakuContent, baseCount, testId = 'emotional-friction' } = body;
    
    let config = await prisma.globalConfig.findFirst({ where: { testId } });
    if (config) {
      config = await prisma.globalConfig.update({
        where: { id: config.id },
        data: {
          danmakuSpeed: danmakuSpeed ?? config.danmakuSpeed,
          danmakuOpacity: danmakuOpacity ?? config.danmakuOpacity,
          baseCount: baseCount ?? config.baseCount,
          danmakuContent: typeof danmakuContent === 'string' ? danmakuContent : JSON.stringify(danmakuContent || config.danmakuContent || {})
        }
      });
    } else {
      config = await prisma.globalConfig.create({
        data: {
          testId,
          danmakuSpeed: danmakuSpeed ?? 50,
          danmakuOpacity: danmakuOpacity ?? 70,
          baseCount: baseCount ?? 0,
          danmakuContent: typeof danmakuContent === 'string' ? danmakuContent : JSON.stringify(danmakuContent || {})
        }
      });
    }
    
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '保存配置失败' }, { status: 500 });
  }
}
