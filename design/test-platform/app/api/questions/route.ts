import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId') || 'emotional-friction';
    
    const questions = await prisma.question.findMany({
      where: { testId },
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
        text: opt.text
      }))
    }));

    return NextResponse.json({ success: true, questions: formattedQuestions });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: '获取题目失败' }, { status: 500 });
  }
}
