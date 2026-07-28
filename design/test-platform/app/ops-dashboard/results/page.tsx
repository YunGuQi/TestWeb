import { Suspense } from 'react';
import { prisma } from '../../../lib/prisma';
import ResultsClient from './ResultsClient';
import { destinyLoverResults } from '../../../lib/destiny-lover-data';

export const dynamic = 'force-dynamic';

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-48 bg-gray-200 rounded mb-8"/>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0,1,2,3,4,5].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl"/>)}
      </div>
    </div>
  );
}

export default async function ResultsCMS({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  
  return (
    <Suspense key={testId} fallback={<Skeleton />}>
      <ResultsContent testId={testId} />
    </Suspense>
  );
}

async function ResultsContent({ testId }: { testId: string }) {
  let results: any[] = [];
  try {
    results = await prisma.resultConfig.findMany({
      where: { testId },
      orderBy: { id: 'asc' }
    });
  } catch (e) {
    console.warn('DB read failed in ResultsCMS');
  }

  if (results.length === 0 && testId === 'destiny-lover') {
    results = destinyLoverResults.map((r, idx) => ({
      id: idx + 1,
      testId: 'destiny-lover',
      title: r.title,
      desc: r.description,
      quote: r.quote,
      imageUrl: '',
      condition: r.key
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[32px] font-bold text-[#37352F]">结果海报</h1>
      </div>
      <ResultsClient initialResults={results} testId={testId} />
    </div>
  );
}
