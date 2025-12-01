import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  const form = await prisma.feedback_forms.findUnique({
    where: { id },
    include: { feedback_questions: true, feedback_responses: true },
  });

  return NextResponse.json(form);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const { form_name, form_type, questions } = body;
  const session = await getServerSession(authOptions);
  const created_by = Number(session?.user.id);

  const updatedForm = await prisma.feedback_forms.update({
    where: { id },
    data: {
      form_name,
      form_type: Number(form_type),
      feedback_questions: {
        deleteMany: {}, // Remove existing questions
        create: questions.map((q: any) => ({
          question: q.question,
          question_type: Number(q.question_type),
          option1: q.option1 || null,
          option2: q.option2 || null,
          option3: q.option3 || null,
          option4: q.option4 || null,
          created_by: created_by
        })),
      },
    },
  });

  return NextResponse.json(updatedForm);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  await prisma.feedback_forms.delete({ where: { id } });

  return NextResponse.json({ message: 'Deleted successfully' });
}
