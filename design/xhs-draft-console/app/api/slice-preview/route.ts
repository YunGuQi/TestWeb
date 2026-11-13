import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { findMasterPoster, generateDynamicRandomSlice } from '@/worker/slice-helper';

export const runtime = 'nodejs';

interface PreviewParams {
  cardsDir?: string;
  cardId?: string;
  imageSlice?: string;
  seed?: string | number;
  startY?: number;
  format?: string;
}

async function handlePreview(params: PreviewParams) {
  const { cardsDir, cardId, imageSlice, startY, format } = params;

  if (!cardsDir || !cardId) {
    return NextResponse.json(
      { ok: false, err: 'Missing required parameters: cardsDir, cardId' },
      { status: 400 }
    );
  }

  if (imageSlice && (imageSlice.includes('..') || path.isAbsolute(imageSlice))) {
    return NextResponse.json(
      { ok: false, err: 'Invalid imageSlice parameter' },
      { status: 400 }
    );
  }

  const normalizedCardsDir = path.resolve(cardsDir);
  if (!fs.existsSync(normalizedCardsDir)) {
    return NextResponse.json(
      { ok: false, err: `Cards directory does not exist: ${cardsDir}` },
      { status: 404 }
    );
  }

  // 1. Fast Path: 优先命中静态切片直接读取
  if (imageSlice) {
    const staticPath = path.resolve(normalizedCardsDir, imageSlice);
    if (
      staticPath.startsWith(normalizedCardsDir) &&
      fs.existsSync(staticPath) &&
      fs.statSync(staticPath).isFile()
    ) {
      const buffer = await fs.promises.readFile(staticPath);
      const meta = await sharp(buffer).metadata();

      if (format === 'raw') {
        return new Response(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-store',
          },
        });
      }

      return NextResponse.json({
        ok: true,
        dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
        startY: 0,
        sliceHeight: meta.height || 0,
        isDynamic: false,
        meta: {
          isStatic: true,
          masterPath: staticPath,
          width: meta.width || 0,
          height: meta.height || 0,
          startY: 0,
          sliceHeight: meta.height || 0,
        },
      });
    }
  }

  // 2. Dynamic Path: 未命中静态切片时，定位母本长图并执行 1/3 动态切片
  const masterPath = findMasterPoster(normalizedCardsDir, cardId, imageSlice);
  if (!masterPath) {
    return NextResponse.json(
      {
        ok: false,
        err: `未找到母本长图: cardsDir=${cardsDir}, cardId=${cardId}${
          imageSlice ? `, imageSlice=${imageSlice}` : ''
        }`,
      },
      { status: 404 }
    );
  }

  const sliceResult = await generateDynamicRandomSlice({
    cardsDir: normalizedCardsDir,
    cardId,
    imageSlice,
    startY,
  });

  let sliceBuffer: Buffer;
  try {
    sliceBuffer = await fs.promises.readFile(sliceResult.tempPath);
  } finally {
    // 零磁盘残留：响应前确保物理清理临时文件
    await sliceResult.cleanup();
  }

  if (format === 'raw') {
    return new Response(new Uint8Array(sliceBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    dataUrl: `data:image/png;base64,${sliceBuffer.toString('base64')}`,
    startY: sliceResult.startY,
    sliceHeight: sliceResult.sliceHeight,
    isDynamic: true,
    meta: {
      isStatic: false,
      masterPath,
      width: sliceResult.width,
      height: sliceResult.height,
      startY: sliceResult.startY,
      sliceHeight: sliceResult.sliceHeight,
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const cardsDir = searchParams.get('cardsDir') || undefined;
    const cardId = searchParams.get('cardId') || undefined;
    const imageSlice = searchParams.get('imageSlice') || undefined;
    const seed = searchParams.get('seed') || undefined;
    const format = searchParams.get('format') || undefined;
    const startYRaw = searchParams.get('startY');
    const startY =
      startYRaw !== null && !isNaN(Number(startYRaw))
        ? Number(startYRaw)
        : undefined;

    return await handlePreview({
      cardsDir,
      cardId,
      imageSlice,
      seed,
      startY,
      format,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, err: (error as Error).message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const cardsDir =
      typeof body.cardsDir === 'string' ? body.cardsDir : undefined;
    const cardId = typeof body.cardId === 'string' ? body.cardId : undefined;
    const imageSlice =
      typeof body.imageSlice === 'string' ? body.imageSlice : undefined;
    const seed =
      typeof body.seed === 'string' || typeof body.seed === 'number'
        ? body.seed
        : undefined;
    const format = typeof body.format === 'string' ? body.format : undefined;
    const startY =
      typeof body.startY === 'number' && !isNaN(body.startY)
        ? body.startY
        : undefined;

    return await handlePreview({
      cardsDir,
      cardId,
      imageSlice,
      seed,
      startY,
      format,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, err: (error as Error).message || String(error) },
      { status: 500 }
    );
  }
}
