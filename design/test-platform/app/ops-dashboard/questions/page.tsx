import { prisma } from '../../../lib/prisma';
import QuestionsClient from './QuestionsClient';

export const dynamic = 'force-dynamic';

export default async function QuestionsCMS({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  const questions = await prisma.question.findMany({
    where: { testId },
    orderBy: { order: 'asc' },
    include: { options: true }
  });

  return (
    <QuestionsClient key={testId} initialQuestions={questions} />
  );
}
