import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const questions = await prisma.question.findMany();
    return NextResponse.json({ success: true, count: questions.length });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
      name: error.name,
      stack: error.stack
    }, { status: 500 });
  }
}
