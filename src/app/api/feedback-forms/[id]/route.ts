import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/libs/prisma';

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

  const updatedForm = await prisma.feedback_forms.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updatedForm);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  await prisma.feedback_forms.delete({ where: { id } });

  return NextResponse.json({ message: 'Deleted successfully' });
}
