import { Suspense } from 'react';
import { prisma } from '../../../lib/prisma';
import QuestionsClient from './QuestionsClient';
import { destinyLoverQuestions } from '../../../lib/destiny-lover-data';

export const dynamic = 'force-dynamic';

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-48 bg-gray-200 rounded mb-8"/>
      <div className="space-y-4">
        {[0,1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}
      </div>
    </div>
  );
}

export default async function QuestionsCMS({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const testId = resolvedSearchParams.testId || 'emotional-friction';
  
  return (
    <Suspense key={testId} fallback={<Skeleton />}>
      <QuestionsContent testId={testId} />
    </Suspense>
  );
}

async function QuestionsContent({ testId }: { testId: string }) {
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
    questions = destinyLoverQuestions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options.map(o => ({
        id: o.id,
        text: o.text,
        weight: o.weight
      }))
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[32px] font-bold text-[#37352F]">题库编辑</h1>
      </div>
      <QuestionsClient initialQuestions={questions} testId={testId} />
    </div>
  );
}
