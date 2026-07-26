import { prisma } from '../../../lib/prisma';
import ResultsClient from './ResultsClient';
import { destinyLoverResults } from '../../../lib/destiny-lover-data';

export const dynamic = 'force-dynamic';

export default async function ResultsCMS({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
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
    <ResultsClient key={testId} initialResults={results} />
  );
}
