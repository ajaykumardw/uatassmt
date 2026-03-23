import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET() {
  const responses = await prisma.feedback_responses.findMany({
    include: { feedback_response_answers: true },
  });

  return NextResponse.json(responses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { feedback_form_id, user_type, answers } = body;

  const session = await getServerSession(authOptions);
  const user_id = Number(session?.user.id);

  const alreadySubmitted = await prisma.feedback_responses.findFirst({
    where: {
      feedback_form_id,
      user_id,
      user_type
    },
  });

  if (alreadySubmitted) {
    return NextResponse.json(
      {
        status: "Error",
        statusCode: "400",
        message: 'You have already submitted feedback for this form.'
      },
      { status: 400 }
    );
  }

  const batchId = await prisma.students.findUnique({
    where: {
      id: user_id,
    },
    select: {
      batch_id: true,
    },
  }).then(student => student?.batch_id);

  if (!batchId) {
    return NextResponse.json(
      {
        status: "Error",
        statusCode: "400",
        message: 'You are not associated with any batch.'
      },
      { status: 400 }
    );
  }

  const response = await prisma.feedback_responses.create({
    data: {
      feedback_form_id,
      batch_id: batchId, // use the actual batch_id from the request body
      user_type,
      user_id,
      submitted_at: new Date(),
      feedback_response_answers: {
        // create: answers, // expects [{feedback_question_id, answer_value, created_by}]
        create: answers.map((ans: any) => ({
          feedback_question_id: ans.question_id,
          answer_value: ans.answer,
          created_by: user_id,
        })),
      },
    },
    include: { feedback_response_answers: true },
  });

  return NextResponse.json(response);
}
