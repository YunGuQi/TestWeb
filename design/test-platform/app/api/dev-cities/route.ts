import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const results = await prisma.resultConfig.findMany();
  return NextResponse.json({ success: true, data: results });
}
