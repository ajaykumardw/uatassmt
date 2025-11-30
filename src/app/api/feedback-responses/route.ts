import { type NextRequest, NextResponse } from 'next/server';

import prisma from '@/libs/prisma';

export async function GET() {
  const responses = await prisma.feedback_responses.findMany({
    include: { feedback_response_answers: true },
  });
  
  return NextResponse.json(responses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { feedback_form_id, user_type, user_id, answers } = body;

  const response = await prisma.feedback_responses.create({
    data: {
      feedback_form_id,
      user_type,
      user_id,
      submitted_at: new Date(),
      feedback_response_answers: {
        create: answers, // expects [{feedback_question_id, answer_value, created_by}]
      },
    },
    include: { feedback_response_answers: true },
  });

  return NextResponse.json(response);
}
