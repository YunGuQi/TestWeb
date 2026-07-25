import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      where: { testId: 'city-personality' },
      orderBy: { order: 'asc' },
      include: { options: true }
    });

    const safeQuestions = questions.map((q: any) => ({
      text: q.text,
      opts: q.options.map((opt: any) => ({
        t: opt.text
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: 'city-personality',
        title: '性格城市匹配测试',
        description: '寻找你的灵魂归属地',
        dimensions: ['rhythm', 'env', 'temp', 'social', 'taste'],
        questions: safeQuestions
      }
    });
  } catch (error) {
    console.error('Error reading questions config:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
