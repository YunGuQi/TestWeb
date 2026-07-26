import { prisma } from '../../../lib/prisma';
import QuestionsClient from './QuestionsClient';
import { destinyLoverQuestions } from '../../../lib/destiny-lover-data';

export const dynamic = 'force-dynamic';

export default async function QuestionsCMS({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  let questions: any[] = [];
  try {
    questions = await prisma.question.findMany({
      where: { testId },
      orderBy: { order: 'asc' },
      include: { options: true }
    });
  } catch (e) {
    console.warn('DB read failed in QuestionsCMS');
  }

  if (questions.length === 0 && testId === 'destiny-lover') {
    questions = destinyLoverQuestions.map((q, idx) => ({
      id: idx + 100,
      testId: 'destiny-lover',
      order: idx + 1,
      text: q.text,
      options: q.options.map((o, oidx) => ({
        id: idx * 10 + oidx + 1000,
        text: o.text,
        scores: JSON.stringify(o.scores),
        questionId: idx + 100
      }))
    }));
  }

  return (
    <QuestionsClient key={testId} initialQuestions={questions} />
  );
}
