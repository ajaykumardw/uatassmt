import { type NextRequest, NextResponse } from 'next/server';

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
  
  return NextResponse.json({feedbackForms: forms});
}

// POST create a form
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { form_name, form_type, questions } = body;

    // Validate input
    if (!form_name || !form_type) {
      return NextResponse.json({ error: "Form name and type are required" }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const created_by = Number(session.user.id);

    // Create the form
    const form = await prisma.feedback_forms.create({
      data: {
        form_name,
        form_type: Number(form_type),
        created_by,
        feedback_questions: {
          create: questions.map((q: any) => ({
            question: q.question,
            question_type: Number(q.question_type),
            option1: q.option1 || null,
            option2: q.option2 || null,
            option3: q.option3 || null,
            option4: q.option4 || null,
            created_by
          })),
        },
      },
      include: {
        feedback_questions: true,
      },
    });

    return NextResponse.json({form});
  } catch (error: any) {
    console.error("Error creating form:", error);
    
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
