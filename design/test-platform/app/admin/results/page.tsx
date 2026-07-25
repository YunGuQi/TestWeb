import { prisma } from '../../../lib/prisma';
import ResultsClient from './ResultsClient';

export const dynamic = 'force-dynamic';

export default async function ResultsCMS({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  const results = await prisma.resultConfig.findMany({
    where: { testId },
    orderBy: { id: 'asc' }
  });

  return (
    <ResultsClient initialResults={results} />
  );
}
