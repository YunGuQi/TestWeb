import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId') || 'emotional-friction';
    
    let config = await prisma.globalConfig.findFirst({ where: { testId } });
    if (!config) {
      config = await prisma.globalConfig.create({ data: { testId, danmakuContent: '[]' } });
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
    const { danmakuSpeed, danmakuOpacity, danmakuContent, baseCount, completedBaseCount, testId = 'emotional-friction' } = body;
    
    let config = await prisma.globalConfig.findFirst({ where: { testId } });
    let existingDanmaku = {};
    try {
      if (config?.danmakuContent) existingDanmaku = JSON.parse(config.danmakuContent);
    } catch(e) {}

    const newDanmakuContent = {
      ...existingDanmaku,
      ...(typeof danmakuContent === 'object' ? danmakuContent : {}),
    };
    if (completedBaseCount !== undefined) {
      newDanmakuContent.completedBaseCount = parseInt(completedBaseCount) || 0;
    }
    if (config) {
      config = await prisma.globalConfig.update({
        where: { id: config.id },
        data: {
          danmakuSpeed: danmakuSpeed ?? config.danmakuSpeed,
          danmakuOpacity: danmakuOpacity ?? config.danmakuOpacity,
          baseCount: baseCount ?? config.baseCount,
          danmakuContent: JSON.stringify(newDanmakuContent)
        }
      });
    } else {
      config = await prisma.globalConfig.create({
        data: {
          testId,
          danmakuSpeed: danmakuSpeed ?? 50,
          danmakuOpacity: danmakuOpacity ?? 70,
          baseCount: baseCount ?? 0,
          danmakuContent: JSON.stringify(newDanmakuContent)
        }
      });
    }
    
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '保存配置失败' }, { status: 500 });
  }
}
