import ResultView from '../components/ResultView';
import { prisma } from '../../../lib/prisma';
import { CITY_RESULTS_FALLBACK } from '../../../lib/city-fallback';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

import DynamicBackground from '../components/DynamicBackground';

export default async function CityPreview({ searchParams }: { searchParams: Promise<{ id?: string; name?: string }> }) {
  const resolvedParams = await searchParams;
  const targetKey = (resolvedParams.name || resolvedParams.id || '阿勒泰').trim();
  
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
