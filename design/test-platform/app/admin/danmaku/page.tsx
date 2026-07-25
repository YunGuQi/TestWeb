import DanmakuManager from '../DanmakuManager';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DanmakuPage({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  const results = await prisma.resultConfig.findMany({ where: { testId } });

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-[32px] font-bold text-[#37352F]">弹幕管理</h1>
      </div>
      <DanmakuManager testId={testId} initialResults={results} />
    </div>
  );
}
