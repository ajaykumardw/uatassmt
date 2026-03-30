import { type NextRequest, NextResponse } from 'next/server';


import { verify, type JwtPayload } from 'jsonwebtoken';

import prisma from '@/libs/prisma';

import { FeedbackFormTypes, QuestionTypes } from '@/configs/customDataConfig';

// GET all forms
export async function GET(request: NextRequest) {

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    if (!decoded.candidate_id) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const agencyId = decoded.agency_id;

    const form = await prisma.feedback_forms.findFirst({
      where: {
        form_type: 1,
        created_by: agencyId
      },
      include: {
        feedback_questions: {
          select: {
            id: true,
            question: true,
            question_type: true,
            option1: true,
            option2: true,
            option3: true,
            option4: true,
          },
          orderBy: {
            id: 'asc'
          }
        },

        // feedback_responses: true,
      },
    });

    if (!form) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Feedback form not found'
      }, { status: 404 });
    }

    const optimizedForm =  {
      id: form?.id,
      form_type_id: form?.form_type,
      form_type: FeedbackFormTypes[form?.form_type as number] || "Unknown",
      created_by: form?.created_by,
      feedback_questions: form?.feedback_questions.map((question) => ({
          ...question,
          question_type_id: question.question_type,
          question_type: QuestionTypes[question.question_type as number] || "Unknown",
      }))
  };

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'Feedback form retrieved successfully',
      data: optimizedForm
    }, { status: 200 });

  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error
      }, { status: 401 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error
      }, { status: 401 });
    }

    console.error('Error processing request in feedback route:', error);

    return NextResponse.json({
      status: "Error",
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    }, { status: error.statusCode || 500 });
  }
}
