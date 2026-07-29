import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { destinyLoverQuestions } from '../../../lib/destiny-lover-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId') || 'emotional-friction';
    
    let questions: any[] = [];
    try {
      questions = await prisma.question.findMany({
        where: { testId },
        include: {
          options: true
        },
        orderBy: {
          order: 'asc'
        }
      });
    } catch (dbError) {
      console.warn('DB connect failed for questions, attempting fallback if available.');
    }

    // 默认优先从数据库动态获取；当且仅当数据库尚未准备好或本地断网连不通云端服务器时，对命定恋人开启本地最新防套路常备常数容灾
    if ((!questions || questions.length === 0) && testId === 'destiny-lover') {
      return NextResponse.json({ success: true, questions: destinyLoverQuestions });
    }

    const formattedQuestions = questions.map(q => ({
      id: q.id.toString(), // 兼容字符串与自增ID
      text: q.text,
      options: q.options.map(opt => ({
        id: opt.id.toString(),
        text: opt.text,
        scores: opt.scores ? (typeof opt.scores === 'string' ? JSON.parse(opt.scores) : opt.scores) : undefined
      }))
    }));

    return NextResponse.json({ success: true, questions: formattedQuestions });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: '获取题目失败' }, { status: 500 });
  }
}
