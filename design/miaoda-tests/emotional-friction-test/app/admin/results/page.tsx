import { prisma } from '../../../lib/prisma';
import ResultsClient from './ResultsClient';

export const dynamic = 'force-dynamic';

export default async function ResultsCMS() {
  const results = await prisma.resultConfig.findMany({
    orderBy: { id: 'asc' }
  });

  return (
    <ResultsClient initialResults={results} />
  );
}
