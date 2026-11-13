import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

export interface SliceOptions {
  cardsDir: string;
  cardId: string;
  imageSlice?: string;
  outDir?: string;
  startY?: number;
}

export interface SliceResult {
  tempPath: string;
  startY: number;
  sliceHeight: number;
  width: number;
  height: number;
  cleanup: () => Promise<void>;
}

/**
 * 母本长图智能定位 (findMasterPoster)
 * 1. 优先检查 path.join(cardsDir, imageSlice)，若真实存在直接返回该路径（兼容静态切片）
 * 2. 依据 cardId 或 imageSlice 智能匹配 r(\d+)
 * 3. 扫描 cardsDir 匹配 0${N}_ 或 ${N}_ 或包含 _r${N}_ 或兜底按顺序
 */
export function findMasterPoster(
  cardsDir: string,
  cardId: string,
  imageSlice?: string
): string | null {
  if (!cardsDir || !fs.existsSync(cardsDir)) {
    return null;
  }

  // 1. 若 imageSlice 静态存在，直接短路返回
  if (imageSlice) {
    const directPath = path.join(cardsDir, imageSlice);
    if (fs.existsSync(directPath)) {
      return directPath;
    }
  }

  // 2. 提取画像序号 N
  let n: number | null = null;
  const matchId = cardId.match(/^r(\d+)/i);
  if (matchId) {
    n = parseInt(matchId[1], 10);
  } else if (imageSlice) {
    const matchSlice = imageSlice.match(/^r(\d+)/i);
    if (matchSlice) {
      n = parseInt(matchSlice[1], 10);
    }
  }

  if (n === null || isNaN(n)) {
    return null;
  }

  const padN = String(n).padStart(2, '0');
  const files = fs.readdirSync(cardsDir);
  const pngFiles = files.filter((f) => f.toLowerCase().endsWith('.png'));

  // 3. 优先级匹配
  // 3.1 优先匹配以 0${N}_ 或 ${N}_ 开头的文件
  const prefixMatch = pngFiles.find(
    (f) => f.startsWith(`${padN}_`) || f.startsWith(`${n}_`)
  );
  if (prefixMatch) {
    return path.join(cardsDir, prefixMatch);
  }

  // 3.2 次选匹配文件名包含 r${N} 或 _r${N}_ 的文件（排除切片类命名）
  const rMatch = pngFiles.find(
    (f) =>
      new RegExp(`(?:^|[_-])r${n}(?:[_-]|$)`, 'i').test(f) &&
      !f.toLowerCase().includes('slice')
  );
  if (rMatch) {
    return path.join(cardsDir, rMatch);
  }

  // 3.3 兜底：若无数字前缀但长图文件数为 6 个，按字母排序取第 N - 1 个
  const nonSlicePngs = pngFiles.filter((f) => !f.toLowerCase().includes('slice'));
  if (nonSlicePngs.length === 6 && n >= 1 && n <= 6) {
    nonSlicePngs.sort();
    return path.join(cardsDir, nonSlicePngs[n - 1]);
  }

  return null;
}

/**
 * 1/3 动态随机切片算法 (generateDynamicRandomSlice)
 * - 黄金比例 1/3 高度
 * - 100% 避让底部 15% 二维码红线 (safeMaxY = Math.floor(H * 0.85))
 * - 生成临时切片文件并返回 cleanup 函数供调用方清理
 */
export async function generateDynamicRandomSlice(
  options: SliceOptions
): Promise<SliceResult> {
  const masterPath = findMasterPoster(
    options.cardsDir,
    options.cardId,
    options.imageSlice
  );

  if (!masterPath) {
    throw new Error(
      `未找到母本长图: cardsDir=${options.cardsDir}, cardId=${options.cardId}`
    );
  }

  const meta = await sharp(masterPath).metadata();
  const width = meta.width;
  const height = meta.height;

  if (!width || !height) {
    throw new Error(`无法获取母本长图尺寸信息: ${masterPath}`);
  }

  // 黄金比例 1/3 高度
  const sliceHeight = Math.floor(height / 3);

  // 严密避让二维码红线：排除底部 15%
  const safeMaxY = Math.floor(height * 0.85);

  // 最大起始 Y 坐标
  const maxStartY = Math.max(0, safeMaxY - sliceHeight);

  // 起始 Y 坐标：若指定合法 startY 则在安全范围内裁剪，否则随机
  const startY =
    typeof options.startY === 'number' && !isNaN(options.startY)
      ? Math.min(Math.max(0, Math.floor(options.startY)), maxStartY)
      : Math.floor(Math.random() * (maxStartY + 1));

  // 确保临时输出目录存在
  const tmpDir = options.outDir || path.join(os.tmpdir(), 'xhs-slices');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const tempFileName = `slice_${options.cardId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`;
  const tempPath = path.join(tmpDir, tempFileName);

  await sharp(masterPath)
    .extract({
      left: 0,
      top: startY,
      width,
      height: sliceHeight,
    })
    .toFile(tempPath);

  const cleanup = async () => {
    try {
      if (fs.existsSync(tempPath)) {
        await fs.promises.unlink(tempPath);
      }
    } catch {
      // 容错忽略
    }
  };

  return {
    tempPath,
    startY,
    sliceHeight,
    width,
    height,
    cleanup,
  };
}
