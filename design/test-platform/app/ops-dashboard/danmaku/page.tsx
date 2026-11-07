import { Suspense } from 'react';
import DanmakuManager from '../DanmakuManager';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded"/>
      </div>
      <div className="bg-gray-100 rounded-xl h-[600px] w-full"/>
    </div>
  );
}

export default async function DanmakuPage({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  
  return (
    <Suspense key={testId} fallback={<Skeleton />}>
      <DanmakuContent testId={testId} />
    </Suspense>
  );
}

async function DanmakuContent({ testId }: { testId: string }) {
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
