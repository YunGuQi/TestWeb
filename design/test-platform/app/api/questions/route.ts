import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { destinyLoverQuestions } from '../../../lib/destiny-lover-data';
import { loveSpeciesQuestions } from '../../../lib/love-species-data';
import { familyOriginQuestions } from '../../../lib/family-origin-data';
import { questions as emoQuestions } from '../../../lib/data';
import { verifySignature } from '../../../lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const timestamp = request.headers.get('x-timestamp');
    const signature = request.headers.get('x-sign');
    
    // Validate signature using fixed payload for GET requests
    const isValid = await verifySignature(timestamp, signature, "GET_QUESTIONS", 600);
    
    if (!isValid) {
      console.warn(`[API /questions] Signature validation failed. Timestamp: ${timestamp}, signature: ${signature}`);
      return NextResponse.json({ success: false, error: 'Unauthorized signature' }, { status: 403 });
    }
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

    // 统一数据脱敏函数：剥离商业算分逻辑和内部权重
    const stripScores = (items: any[]) => {
      return items.map((q: any) => ({
        id: (q.id || q.order || '').toString(),
        text: q.text,
        options: (q.options || []).map((opt: any, optIdx: number) => ({
          id: (opt.id !== undefined ? opt.id : optIdx).toString(),
          text: opt.text
        }))
      }));
    };

    // 默认优先从数据库动态获取；当且仅当数据库尚未准备好或本地断网连不通云端服务器时，开启不同测评项目的本地常数兜底
    if (!questions || questions.length === 0) {
      if (testId === 'family-origin') {
        return NextResponse.json({
          success: true,
          questions: stripScores(familyOriginQuestions)
        });
      }

      if (testId === 'destiny-lover') {
        return NextResponse.json({
          success: true,
          questions: stripScores(destinyLoverQuestions)
        });
      }

      if (testId === 'emotional-friction') {
        return NextResponse.json({
          success: true,
          questions: stripScores(emoQuestions)
        });
      }

      if (testId === 'love-species') {
        return NextResponse.json({
          success: true,
          questions: stripScores(loveSpeciesQuestions)
        });
      }
    }

    return NextResponse.json({
      success: true,
      questions: stripScores(questions)
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: '获取题目失败' }, { status: 500 });
  }
}

