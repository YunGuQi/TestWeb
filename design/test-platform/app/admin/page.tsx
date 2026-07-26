import { prisma } from '../../lib/prisma';
import CodesTable from './CodesTable';
import PVCard from './PVCard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  
  const codeCount = await prisma.activationCode.count({ where: { testId } });
  const usedCodeCount = await prisma.activationCode.count({
    where: {
      testId,
      devices: {
        not: '[]'
      }
    }
  });
  const testRecordCount = await prisma.testRecord.count({ where: { testId } });
  
  let config = await prisma.globalConfig.findFirst({ where: { testId } });
  let baseCount = config?.baseCount || 12544;
  
  const totalPV = baseCount + testRecordCount * 3; 
  const conversionRate = totalPV > 0 ? ((testRecordCount / totalPV) * 100).toFixed(2) : '0.00';

  // --- Analytics Calculation ---
  const allCodesForStats = await prisma.activationCode.findMany({
    where: { testId },
    select: { devices: true, maxUses: true }
  });
  
  let totalMaxUses = 0;
  let totalBoundDevices = 0;
  let codesWithMultipleDevices = 0;
  let totalUsedCodesStats = 0;

  allCodesForStats.forEach(code => {
    totalMaxUses += code.maxUses;
    try {
      const bound = JSON.parse(code.devices || '[]');
      const uniqueBound = Array.from(new Set(bound));
      const count = uniqueBound.length;
      totalBoundDevices += count;
      if (count > 0) totalUsedCodesStats++;
      if (count > 1) codesWithMultipleDevices++;
    } catch(e) {}
  });

  const shareRate = totalUsedCodesStats > 0 ? ((codesWithMultipleDevices / totalUsedCodesStats) * 100).toFixed(1) : '0.0';
  const saturationRate = totalMaxUses > 0 ? ((totalBoundDevices / totalMaxUses) * 100).toFixed(1) : '0.0';
  const avgDevicesPerCode = totalUsedCodesStats > 0 ? (totalBoundDevices / totalUsedCodesStats).toFixed(1) : '0.0';

  const allRecords = await prisma.testRecord.findMany({
    where: { testId },
    select: { deviceId: true, resultId: true }
  });

  const deviceCounts: Record<string, number> = {};
  const resultCounts: Record<number, number> = {};
  
  allRecords.forEach(r => {
    if (r.deviceId) {
      deviceCounts[r.deviceId] = (deviceCounts[r.deviceId] || 0) + 1;
    }
    if (r.resultId) {
      resultCounts[r.resultId] = (resultCounts[r.resultId] || 0) + 1;
    }
  });

  const uniqueDevices = Object.keys(deviceCounts).length;
  const multiTestDevices = Object.values(deviceCounts).filter(c => c > 1).length;
  const retestRate = uniqueDevices > 0 ? ((multiTestDevices / uniqueDevices) * 100).toFixed(1) : '0.0';

  const resultsConfig = await prisma.resultConfig.findMany({ where: { testId } });
  const resultTitleMap = new Map(resultsConfig.map(r => [r.id, r.title]));
  
  const topResults = Object.entries(resultCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      title: resultTitleMap.get(parseInt(id)) || '未知结果',
      count,
      percentage: allRecords.length > 0 ? ((count / allRecords.length) * 100).toFixed(1) : '0.0'
    }));
  // -----------------------------

  const codes = await prisma.activationCode.findMany({
    where: { testId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const enrichedCodes = codes.map(code => {
    let testCount = 0;
    try {
      const devices = JSON.parse(code.devices || '[]');
      const uniqueDevices = Array.from(new Set(devices));
      uniqueDevices.forEach((d: string) => {
        testCount += (deviceCounts[d as string] || 0);
      });
    } catch(e) {}
    return { ...code, testCount };
  });

  return (
    <>
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-[32px] font-bold text-[#37352F]">大盘概览</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-[#EBEBEB] p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-600 text-lg">🎟️</div>
          <div className="text-[#787774] text-sm font-medium mb-1">当前测试卡密 (总数)</div>
          <div className="text-3xl font-bold text-[#37352F] mb-2">{codeCount}</div>
          <div className="text-xs text-[#9F9E9B] font-medium bg-[#F7F6F3] inline-block px-2 py-1 rounded">已使用: {usedCodeCount}</div>
        </div>
        
        <div className="bg-white border border-[#EBEBEB] p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-4 text-green-600 text-lg">✅</div>
          <div className="text-[#787774] text-sm font-medium mb-1">测算完成总数</div>
          <div className="text-3xl font-bold text-[#37352F]">{testRecordCount}</div>
        </div>

        <PVCard initialBaseCount={baseCount} testRecordCount={testRecordCount} testId={testId} />
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#37352F] mb-4 flex items-center gap-2">
          <span>📈</span> 深度数据分析
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-[#FDFBF7] border border-[#EBEBEB] p-5 rounded-2xl">
            <div className="text-[#9F9E9B] text-xs font-semibold mb-2 uppercase tracking-wider flex items-center justify-between">
              裂变分享率
              <span title="同一卡密激活多台设备的比例" className="cursor-help">ⓘ</span>
            </div>
            <div className="text-2xl font-bold text-[#37352F] mb-1">{shareRate}%</div>
            <div className="text-xs text-[#787774]">平均 <span className="font-mono text-[#37352F] bg-white px-1 py-0.5 rounded border border-[#EBEBEB] mx-0.5">{avgDevicesPerCode}</span> 台设备 / 卡密</div>
          </div>

          <div className="bg-[#FDFBF7] border border-[#EBEBEB] p-5 rounded-2xl">
            <div className="text-[#9F9E9B] text-xs font-semibold mb-2 uppercase tracking-wider flex items-center justify-between">
              卡密饱和度
              <span title="已激活设备数 / (卡密数 × 单卡可用次数)" className="cursor-help">ⓘ</span>
            </div>
            <div className="text-2xl font-bold text-[#37352F] mb-2">{saturationRate}%</div>
            <div className="w-full bg-[#EBEBEB] rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(saturationRate))}%` }}></div>
            </div>
          </div>

          <div className="bg-[#FDFBF7] border border-[#EBEBEB] p-5 rounded-2xl">
            <div className="text-[#9F9E9B] text-xs font-semibold mb-2 uppercase tracking-wider flex items-center justify-between">
              用户复测率
              <span title="测算 > 1 次的用户比例" className="cursor-help">ⓘ</span>
            </div>
            <div className="text-2xl font-bold text-[#37352F] mb-1">{retestRate}%</div>
            <div className="text-xs text-[#787774]">基于 <span className="font-mono text-[#37352F] bg-white px-1 py-0.5 rounded border border-[#EBEBEB] mx-0.5">{uniqueDevices}</span> 个独立设备计算</div>
          </div>

          <div className="bg-[#FDFBF7] border border-[#EBEBEB] p-5 rounded-2xl">
            <div className="text-[#9F9E9B] text-xs font-semibold mb-2 uppercase tracking-wider flex items-center justify-between">
              热门结果 TOP 3
              <span title="出现频次最高的结果分布" className="cursor-help">ⓘ</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {topResults.length > 0 ? topResults.map((tr, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="truncate pr-2 font-medium text-[#37352F]">{idx + 1}. {tr.title}</span>
                  <span className="shrink-0 text-[#9F9E9B] font-mono bg-white px-1 py-0.5 rounded border border-[#EBEBEB]">{tr.percentage}%</span>
                </div>
              )) : (
                <div className="text-xs text-[#9F9E9B] italic mt-2">暂无数据</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#EBEBEB] p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <CodesTable key={testId} initialCodes={enrichedCodes} testId={testId} />
      </div>
    </>
  );
}
