import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: {
        options: true
      },
      orderBy: {
        order: 'asc'
      }
    });

    const formattedQuestions = questions.map(q => ({
      id: q.id.toString(), // or keep it number if frontend handles it
      text: q.text,
      options: q.options.map(opt => ({
        id: opt.id.toString(),
        text: opt.text,
        scores: JSON.parse(opt.scores)
      }))
    }));

    return NextResponse.json({ success: true, questions: formattedQuestions });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: '获取题目失败' }, { status: 500 });
  }
}
