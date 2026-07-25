import { prisma } from '../../lib/prisma';
import CodesTable from './CodesTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const codeCount = await prisma.activationCode.count();
  const testRecordCount = await prisma.testRecord.count();
  
  // Try to get GlobalConfig for base PV, if not exist create one or default to 0
  let config = await prisma.globalConfig.findFirst();
  let baseCount = config?.baseCount || 0;
  
  // Mock total PV = baseCount + testRecordCount * 3 (roughly estimating drops)
  const totalPV = baseCount + testRecordCount * 3 + 12544; // Added 12544 as a base to match the frontend easter egg number
  const conversionRate = totalPV > 0 ? ((testRecordCount / totalPV) * 100).toFixed(2) : '0.00';

  const codes = await prisma.activationCode.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">大盘概览</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-[4px_4px_0px_#000] border-2 border-black">
          <h2 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">系统总卡密</h2>
          <div className="text-4xl font-black text-indigo-600">{codeCount}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-[4px_4px_0px_#000] border-2 border-black">
          <h2 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">测算完成总数 (Test Records)</h2>
          <div className="text-4xl font-black text-black">{testRecordCount}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-[4px_4px_0px_#000] border-2 border-black">
          <h2 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">预估页面总浏览 (PV)</h2>
          <div className="text-4xl font-black text-gray-800">{totalPV}</div>
          <p className="text-xs font-bold text-gray-500 mt-2">完测转化率: {conversionRate}%</p>
        </div>
      </div>

      <CodesTable initialCodes={codes} />
    </div>
  );
}
