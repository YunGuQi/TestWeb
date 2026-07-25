import { prisma } from '../../../lib/prisma';
import QuestionsClient from './QuestionsClient';

export const dynamic = 'force-dynamic';

export default async function QuestionsCMS() {
  const questions = await prisma.question.findMany({
    orderBy: { order: 'asc' },
    include: { options: true }
  });

  return (
    <QuestionsClient initialQuestions={questions} />
  );
}
