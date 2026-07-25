import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let config = await prisma.globalConfig.findFirst();
    if (!config) {
      config = await prisma.globalConfig.create({ data: {} });
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
    const { danmakuSpeed, danmakuOpacity, danmakuContent } = body;
    
    let config = await prisma.globalConfig.findFirst();
    if (config) {
      config = await prisma.globalConfig.update({
        where: { id: config.id },
        data: {
          danmakuSpeed: danmakuSpeed ?? config.danmakuSpeed,
          danmakuOpacity: danmakuOpacity ?? config.danmakuOpacity,
          danmakuContent: typeof danmakuContent === 'string' ? danmakuContent : JSON.stringify(danmakuContent)
        }
      });
    } else {
      config = await prisma.globalConfig.create({
        data: {
          danmakuSpeed: danmakuSpeed ?? 50,
          danmakuOpacity: danmakuOpacity ?? 70,
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
