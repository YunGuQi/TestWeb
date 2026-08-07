import { Suspense } from 'react';
import { prisma } from '../../lib/prisma';
import CodesTable from './CodesTable';
import PVCard from './PVCard';

// 强制动态渲染（searchParams 依赖使然），但使用并发查询大幅提速
export const dynamic = 'force-dynamic';

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 标题骨架 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-3 w-32 bg-gray-200 rounded mb-2"/>
          <div className="h-8 w-48 bg-gray-200 rounded"/>
        </div>
        <div className="hidden sm:block h-7 w-40 bg-gray-200 rounded-lg"/>
      </div>
      {/* 卡片组骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[0,1,2].map(i => (
          <div key={i} className="bg-gray-100/60 p-6 rounded-2xl h-36"/>
        ))}
      </div>
      {/* 分析区骨架 */}
      <div className="mb-12">
        <div className="h-6 w-56 bg-gray-200 rounded mb-5"/>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-gray-100/60 p-5 rounded-2xl h-24"/>
          ))}
        </div>
      </div>
      {/* 表格骨架 */}
      <div className="bg-gray-100/60 rounded-2xl h-80"/>
    </div>
  );
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  
  return (
    <Suspense key={testId} fallback={<DashboardSkeleton />}>
      <DashboardContent testId={testId} />
    </Suspense>
  );
}

async function DashboardContent({ testId }: { testId: string }) {
  // ✅ 性能优化：将所有独立 DB 查询并发执行，从串行改为并行
  // 原来：每个 await 依次排队，总耗时 = 所有查询之和
  // 现在：同时发起所有查询，总耗时 = 最慢单个查询的时间（快 3-5x）
  const [
    codeCount,
    usedCodeCount,
    config,
    allCodesForStats,
    allRecords,
    resultsConfig,
    codes,
  ] = await Promise.all([
    prisma.activationCode.count({ where: { testId } }),
    prisma.activationCode.count({
      where: { testId, devices: { not: '[]' } }
    }),
    prisma.globalConfig.findFirst({ where: { testId } }),
    prisma.activationCode.findMany({
      where: { testId },
      select: { devices: true, maxUses: true }
    }),
    prisma.testRecord.findMany({
      where: { testId },
      select: { deviceId: true, resultId: true }
    }),
    prisma.resultConfig.findMany({ where: { testId } }),
    prisma.activationCode.findMany({
      where: { testId },
      orderBy: { createdAt: 'desc' },
      take: 2000
    }),
  ]);

  let baseCount = config?.baseCount || 12544;

  // --- Analytics Calculation ---
  
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

  // deviceCounts 和 resultCounts 从并发查询结果中计算
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

  let testRecordCount = 0;
  allCodesForStats.forEach(code => {
    try {
      const devices = JSON.parse(code.devices || '[]');
      const uniqueCodeDevices = Array.from(new Set(devices));
      uniqueCodeDevices.forEach((d: any) => {
        testRecordCount += (deviceCounts[d] || 0);
      });
    } catch(e) {}
  });

  // resultsConfig 已在并发查询中获取
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

  // codes 已在并发查询中获取，直接计算 enrichedCodes
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">// TELEMETRY METRICS</div>
          <h1 className="text-3xl font-black tracking-tight text-black">全景运营监控大盘</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 border border-black/10 shadow-sm rounded-lg font-mono text-xs font-bold text-gray-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>LIVE STREAM: {testId.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* 卡密统计监控卡 - 翡翠绿 /impeccable colorize */}
        <div className="bg-gradient-to-br from-white via-white/90 to-emerald-50/50 border-2 border-emerald-500/30 p-6 rounded-2xl shadow-[0_6px_30px_rgba(16,185,129,0.08)] hover:shadow-[0_10px_36px_rgba(16,185,129,0.12)] hover:-translate-y-0.5 transition-all relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-700 text-lg font-black shadow-sm border border-emerald-200">🎟️</div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500 text-white px-2 py-0.5 uppercase tracking-widest">ACTIVE CODES</span>
          </div>
          <div className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider font-mono">// TOTAL ACTIVATION CODES</div>
          <div className="text-4xl font-black text-black tracking-tight mb-3">{codeCount}</div>
          <div className="text-xs text-emerald-950 font-bold bg-emerald-100/70 inline-block px-2.5 py-1 rounded-md border border-emerald-300">
            已分配完成激活: <span className="font-mono font-black">{usedCodeCount}</span> 组
          </div>
        </div>
        
        {/* 测算总数监控卡 - 紫罗兰 /impeccable colorize */}
        <div className="bg-gradient-to-br from-white via-white/90 to-violet-50/50 border-2 border-violet-500/30 p-6 rounded-2xl shadow-[0_6px_30px_rgba(139,92,246,0.08)] hover:shadow-[0_10px_36px_rgba(139,92,246,0.12)] hover:-translate-y-0.5 transition-all relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100/80 flex items-center justify-center text-violet-700 text-lg font-black shadow-sm border border-violet-200">⚡</div>
            <span className="text-[10px] font-mono font-bold bg-violet-600 text-white px-2 py-0.5 uppercase tracking-widest">COMPLETED</span>
          </div>
          <div className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider font-mono">// TOTAL COMPLETED TESTS</div>
          <div className="text-4xl font-black text-black tracking-tight mb-3">{testRecordCount}</div>
          <div className="text-xs text-violet-950 font-bold bg-violet-100/70 inline-block px-2.5 py-1 rounded-md border border-violet-300">
            所有终端累记提交的完测答卷
          </div>
        </div>

        {/* 流量监控卡 - 琥珀黄 PVCard */}
        <PVCard initialBaseCount={baseCount} testRecordCount={testRecordCount} testId={testId} />
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-black text-black mb-5 flex items-center gap-2.5">
          <span className="w-2.5 h-6 bg-emerald-600 rounded-sm inline-block"></span>
          <span>📈 深度流量与转化健康度分析</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white/85 backdrop-blur-md border border-black/15 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-black/30 transition-all">
            <div className="text-gray-400 text-[11px] font-mono font-bold mb-2 uppercase tracking-widest flex items-center justify-between">
              // 裂变分享率
              <span title="同一卡密激活多台设备的比例" className="cursor-help text-gray-500">ⓘ</span>
            </div>
            <div className="text-3xl font-black text-black tracking-tight mb-2">{shareRate}%</div>
            <div className="text-xs text-gray-600 font-bold">平均 <span className="font-mono text-black bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 mx-0.5 font-black">{avgDevicesPerCode}</span> 台设备 / 卡密</div>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-black/15 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-black/30 transition-all">
            <div className="text-gray-400 text-[11px] font-mono font-bold mb-2 uppercase tracking-widest flex items-center justify-between">
              // 卡密饱和度
              <span title="已激活设备数 / (卡密数 × 单卡可用次数)" className="cursor-help text-gray-500">ⓘ</span>
            </div>
            <div className="text-3xl font-black text-black tracking-tight mb-3">{saturationRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden p-0.5 border border-black/10">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, parseFloat(saturationRate))}%` }}></div>
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
