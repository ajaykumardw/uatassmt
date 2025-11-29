import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';
import prisma from '@/libs/prisma';

// GET all forms
export async function GET() {
  const forms = await prisma.feedback_forms.findMany({
    include: {
      feedback_questions: true,
      feedback_responses: true,
    },
  });
  return NextResponse.json(forms);
}

// POST create a form
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { form_name, form_type } = body;
  const session = await getServerSession(authOptions);
  const created_by = Number(session?.user.id);

  const form = await prisma.feedback_forms.create({
    data: { form_name, form_type, created_by },
  });

  return NextResponse.json(form);
}
