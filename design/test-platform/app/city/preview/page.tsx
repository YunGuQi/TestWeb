import ResultView from '../components/ResultView';
import { prisma } from '../../../lib/prisma';
import { CITY_RESULTS_FALLBACK } from '../../../lib/city-fallback';
import { notFound } from 'next/navigation';
import { resolveCityFromSlug } from '../../../lib/preview-slugs';

export const dynamic = 'force-dynamic';

import DynamicBackground from '../components/DynamicBackground';

export default async function CityPreview({ searchParams }: { searchParams: Promise<{ id?: string; name?: string; slug?: string; secret?: string }> }) {
  const resolvedParams = await searchParams;

  // 1. 服务端秘钥强制鉴权：未携带或秘钥错误一律隐身 404
  const secret = resolvedParams?.secret?.trim();
  const validSecret = process.env.ADMIN_PREVIEW_SECRET || 'mutong-preview-secret-2026';
  if (!secret || secret !== validSecret) {
    notFound();
  }

  // 2. 混淆短 Slug 校验：禁止明文 name/id 遍历反查，必须携带已注册合法的 slug
  const slug = resolvedParams?.slug?.trim().toLowerCase();
  if (!slug) {
    notFound();
  }
  const targetKey = resolveCityFromSlug(slug);
  if (!targetKey) {
    notFound();
  }
  
  let allCities: any[] = [];
  try {
    allCities = await prisma.resultConfig.findMany({ where: { testId: 'city-personality' } });
  } catch(e) {}
  
  if (!allCities || allCities.length === 0) {
    allCities = CITY_RESULTS_FALLBACK;
  }
  
  const matchedCity = allCities.find(c => {
    try {
      const extraData = typeof c.condition === 'string' ? JSON.parse(c.condition) : c.condition;
      return (
        extraData.name === targetKey ||
        extraData.id === targetKey ||
        String(c.id) === targetKey ||
        c.title?.includes(targetKey)
      );
    } catch(e) { return false; }
  });

  if (!matchedCity) {
    console.warn(`⚠️ [CityPreview] 未找到与 "${targetKey}" 匹配的城市配置，降级回退到默认城市！`);
  }
  const cityObj = matchedCity || allCities[0];
  
  if (!cityObj) {
    return <div>City not found</div>;
  }
  
  let extraData: any = {};
  try {
    extraData = typeof cityObj.condition === 'string' ? JSON.parse(cityObj.condition) : (cityObj.condition || {});
  } catch(e) {}
  
  // 匹配本地深度资产库补齐三大深度生活切片（确保即便线上数据库未同步新字段也能完整呈现）
  const fallbackMatch = CITY_RESULTS_FALLBACK.find(fb => {
    try {
      const fbCond = typeof fb.condition === 'string' ? JSON.parse(fb.condition) : fb.condition;
      return fbCond.name === targetKey || fbCond.name === extraData.name || fb.id === cityObj.id || fb.title?.includes(targetKey);
    } catch(e) { return false; }
  });
  let fbExtra: any = {};
  if (fallbackMatch) {
    try {
      fbExtra = typeof fallbackMatch.condition === 'string' ? JSON.parse(fallbackMatch.condition) : (fallbackMatch.condition || {});
    } catch(e) {}
  }

  const resultData = {
    city: {
      id: extraData.id || cityObj.id,
      name: extraData.name || targetKey,
      title: cityObj.title || fallbackMatch?.title, 
      desc: cityObj.desc || fallbackMatch?.desc,
      quote: cityObj.quote || fallbackMatch?.quote,
      theme: extraData.theme || fbExtra.theme || 'industrial',
      tags: (extraData.tags && extraData.tags.length > 0) ? extraData.tags : (fbExtra.tags || []),
      coords: extraData.coords || fbExtra.coords || [0, 0, 0, 0, 0],
      residentId: extraData.residentId || fbExtra.residentId,
      schedule: extraData.schedule || fbExtra.schedule,
      curePrescription: extraData.curePrescription || fbExtra.curePrescription,
      toxicCity: extraData.toxicCity || fbExtra.toxicCity
    },
    rank: 1263,
    userCoords: extraData.coords || fbExtra.coords || [0, 0, 0, 0, 0]
  };

  return (
    <>
      <DynamicBackground />
      <div className="relative z-10 min-h-screen">
        <ResultView forcedResultData={resultData} forcedUnlock={true} />
      </div>
    </>
  );
}
