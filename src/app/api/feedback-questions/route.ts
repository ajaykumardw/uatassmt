import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/libs/prisma';

export async function GET() {
  const questions = await prisma.feedback_questions.findMany({
    include: { feedback_form: true },
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const question = await prisma.feedback_questions.create({ data: body });
  return NextResponse.json(question);
}
