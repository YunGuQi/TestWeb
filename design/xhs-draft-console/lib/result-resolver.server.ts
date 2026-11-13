import fs from 'fs';
import path from 'path';
import { CITY_PROFILES, GLOBAL_FALLBACK_PROFILES } from './result-resolver';

/**
 * 扫描 cardsDir 提取母本长图映射表
 */
export function scanResultMapFromCardsDir(cardsDir?: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (typeof window !== 'undefined') return map;
  if (!cardsDir || typeof fs?.existsSync !== 'function' || !fs.existsSync(cardsDir)) return map;

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(cardsDir, { withFileTypes: true });
  } catch {
    return map;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    // 排除切片小图与全景长图
    if (name.includes('_slice.') || name.includes('_full.')) continue;
    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;

    const baseName = name.replace(/\.(png|jpe?g|webp)$/i, '');

    // 格式 1: 01_r1_内核超稳的满级大女主 或 01_tired_深海重压鲸
    const match3 = baseName.match(/^(\d+)_([a-zA-Z0-9_\-]+)_(.+)$/);
    if (match3) {
      const [, idx, code, label] = match3;
      const cleanLabel = label.replace(/[【】]/g, '').trim();
      map[code.toLowerCase()] = cleanLabel;
      map[code] = cleanLabel;
      map[`r${parseInt(idx, 10)}`] = cleanLabel;
      map[idx] = cleanLabel;
      map[String(parseInt(idx, 10))] = cleanLabel;
      continue;
    }

    // 格式 2: 01_深圳 或 01_阿勒泰 (城市类)
    const matchCity = baseName.match(/^(\d+)_([\u4e00-\u9fa5]+)$/);
    if (matchCity) {
      const [, idx, cityName] = matchCity;
      const fullName = CITY_PROFILES[cityName] || cityName;
      map[cityName] = fullName;
      map[`r${parseInt(idx, 10)}`] = fullName;
      map[idx] = fullName;
      map[String(parseInt(idx, 10))] = fullName;
      continue;
    }

    // 格式 3: 01_r1 或 r1_xxx
    const matchSimple = baseName.match(/^(\d+)_([a-zA-Z0-9_\-]+)$/);
    if (matchSimple) {
      const [, idx, code] = matchSimple;
      const clean = GLOBAL_FALLBACK_PROFILES[code.toLowerCase()] || GLOBAL_FALLBACK_PROFILES[code];
      if (clean) {
        map[code.toLowerCase()] = clean;
        map[code] = clean;
        map[`r${parseInt(idx, 10)}`] = clean;
        map[idx] = clean;
      }
      continue;
    }

    // 格式 4: 无数字前缀如 r1_内核超稳的满级大女主
    const matchNoIdx = baseName.match(/^([a-zA-Z0-9_\-]+)_(.+)$/);
    if (matchNoIdx) {
      const [, code, label] = matchNoIdx;
      if (/[\u4e00-\u9fa5]/.test(label)) {
        const cleanLabel = label.replace(/[【】]/g, '').trim();
        map[code.toLowerCase()] = cleanLabel;
        map[code] = cleanLabel;
      }
    }
  }

  return map;
}
