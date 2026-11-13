import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * 将 Date 对象转换为 MS-DOS 日期和时间格式 (PKZIP 规范)
 */
export function toDosDateTime(d: Date): { time: number; date: number } {
  const time =
    (d.getHours() << 11) |
    (d.getMinutes() << 5) |
    Math.floor(d.getSeconds() / 2);
  const date =
    ((d.getFullYear() - 1980) << 9) |
    ((d.getMonth() + 1) << 5) |
    d.getDate();
  return { time, date };
}

export interface ZipFileInput {
  name: string;
  content: Buffer | string;
  mtime?: Date;
}

/**
 * 将指定文件列表打包为标准 PKZIP 格式二进制 Buffer
 */
export function createZipBuffer(files: ZipFileInput[]): Buffer {
  const localChunks: Buffer[] = [];
  const cdChunks: Buffer[] = [];
  let offset = 0;
  const now = new Date();

  for (const f of files) {
    const normName = f.name.replace(/\\/g, '/').replace(/^\/+/, '');
    const nameBuf = Buffer.from(normName, 'utf8');
    const dataBuf = Buffer.isBuffer(f.content)
      ? f.content
      : Buffer.from(f.content, 'utf8');

    const uncompressedSize = dataBuf.length;
    const crc = zlib.crc32(dataBuf);
    const isImage = normName.match(/\.(png|jpg|jpeg|gif|webp)$/i);
    const compressedBuf =
      uncompressedSize > 0
        ? zlib.deflateRawSync(dataBuf, { level: isImage ? 1 : 6 })
        : Buffer.alloc(0);
    const compressedSize = compressedBuf.length;
    const { time, date } = toDosDateTime(f.mtime || now);

    // 1. Local File Header (30 字节 + 文件名长度 + 压缩后数据)
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0); // LFH 标识
    lfh.writeUInt16LE(20, 4); // 解压所需最低版本 (2.0)
    lfh.writeUInt16LE(0x0800, 6); // 通用标志位：Bit 11 置位表示 UTF-8 文件名
    lfh.writeUInt16LE(8, 8); // 压缩算法：8 = Deflate
    lfh.writeUInt16LE(time, 10); // 最后修改时间
    lfh.writeUInt16LE(date, 12); // 最后修改日期
    lfh.writeUInt32LE(crc, 14); // CRC-32
    lfh.writeUInt32LE(compressedSize, 18); // 压缩后大小
    lfh.writeUInt32LE(uncompressedSize, 22); // 未压缩大小
    lfh.writeUInt16LE(nameBuf.length, 26); // 文件名长度
    lfh.writeUInt16LE(0, 28); // 额外字段长度

    localChunks.push(lfh, nameBuf, compressedBuf);

    // 2. Central Directory Header (46 字节 + 文件名长度)
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0); // CDH 标识
    cdh.writeUInt16LE(20, 4); // 制作系统的版本
    cdh.writeUInt16LE(20, 6); // 解压所需版本
    cdh.writeUInt16LE(0x0800, 8); // UTF-8 标志位
    cdh.writeUInt16LE(8, 10); // 压缩算法
    cdh.writeUInt16LE(time, 12); // 最后修改时间
    cdh.writeUInt16LE(date, 14); // 最后修改日期
    cdh.writeUInt32LE(crc, 16); // CRC-32
    cdh.writeUInt32LE(compressedSize, 20); // 压缩后大小
    cdh.writeUInt32LE(uncompressedSize, 24); // 未压缩大小
    cdh.writeUInt16LE(nameBuf.length, 28); // 文件名长度
    cdh.writeUInt16LE(0, 30); // 额外字段长度
    cdh.writeUInt16LE(0, 32); // 文件注释长度
    cdh.writeUInt16LE(0, 34); // 磁盘开始编号
    cdh.writeUInt16LE(0, 36); // 内部文件属性
    cdh.writeUInt16LE(0, 38); // 外部文件属性 (低 16 位)
    cdh.writeUInt16LE(0, 40); // 外部文件属性 (高 16 位)
    cdh.writeUInt32LE(offset, 42); // 相对 Local Header 偏移量

    cdChunks.push(cdh, nameBuf);
    offset += 30 + nameBuf.length + compressedSize;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const c of cdChunks) {
    cdSize += c.length;
  }

  // 3. End of Central Directory Record (22 字节)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD 标识
  eocd.writeUInt16LE(0, 4); // 本磁盘编号
  eocd.writeUInt16LE(0, 6); // 核心目录开始磁盘编号
  eocd.writeUInt16LE(files.length, 8); // 本磁盘核心目录记录总数
  eocd.writeUInt16LE(files.length, 10); // 核心目录记录总数
  eocd.writeUInt32LE(cdSize, 12); // 核心目录大小
  eocd.writeUInt32LE(cdOffset, 16); // 核心目录相对于压缩包起始的偏移
  eocd.writeUInt16LE(0, 20); // ZIP 注释长度

  return Buffer.concat([...localChunks, ...cdChunks, eocd]);
}

/**
 * 递归扫描目录下的所有普通文件
 */
export function collectDirectoryFiles(dir: string, baseDir = dir): ZipFileInput[] {
  const result: ZipFileInput[] = [];
  if (!fs.existsSync(dir)) return result;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // 忽略特定目录与隐藏文件
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'cache') {
      continue;
    }

    if (entry.isDirectory()) {
      result.push(...collectDirectoryFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath);
      const stat = fs.statSync(fullPath);
      result.push({
        name: relPath,
        content,
        mtime: stat.mtime,
      });
    }
  }

  return result;
}

/**
 * 纯 Node.js 原生特权脱壳压缩打包函数 (规避 PowerShell Compress-Archive)
 * 将 sourceDir 目录中的所有文件无损压缩为 targetZipPath
 */
export async function packZipDirectory(
  sourceDir: string,
  targetZipPath: string
): Promise<string> {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`打包源目录不存在: ${sourceDir}`);
  }

  const files = collectDirectoryFiles(sourceDir);
  const zipBuf = createZipBuffer(files);

  const parentDir = path.dirname(targetZipPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(targetZipPath, zipBuf);
  return targetZipPath;
}

/**
 * 快速读取 ZIP 文件条目列表 (供测试断言与自检使用)
 */
export function readZipEntries(zipPath: string): string[] {
  if (!fs.existsSync(zipPath)) return [];
  const buf = fs.readFileSync(zipPath);

  // 寻找 EOCD 标识 0x06054b50 (从后向前找)
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return [];

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdSize = buf.readUInt32LE(eocdOffset + 12);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  const entries: string[] = [];
  let curr = cdOffset;
  for (let i = 0; i < totalEntries && curr < cdOffset + cdSize; i++) {
    if (buf.readUInt32LE(curr) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(curr + 28);
    const extraLen = buf.readUInt16LE(curr + 30);
    const commentLen = buf.readUInt16LE(curr + 32);
    const name = buf.toString('utf8', curr + 46, curr + 46 + nameLen);
    entries.push(name);
    curr += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}
