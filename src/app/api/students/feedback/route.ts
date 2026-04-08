import fs from 'fs';

import { randomUUID } from "crypto";

import path from "path";

import { pipeline } from 'stream/promises';

import { type NextRequest, NextResponse } from 'next/server';

import { verify, type JwtPayload } from 'jsonwebtoken';

import prisma from '@/libs/prisma';

import { FeedbackFormTypes, QuestionTypes, storageFolders } from "@/configs/customDataConfig";

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


export async function POST(req: NextRequest) {

  const authHeader = req.headers.get("authorization");

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

    const batchId = Number(decoded.batch_id);
    const formData = await req.formData();

    const feedback_form_id = formData.get("feedback_form_id")?.toString();
    const user_type = 1; // Since this endpoint is specifically for candidate feedback, we can set user_type to 1 (Candidate)
    const answersRaw = formData.get("answers")?.toString();

    if (!feedback_form_id || !user_type || !answersRaw) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // const answers: { question_id: number; answer?: string; isFile?: boolean }[] = JSON.parse(answersRaw);

    let answers: { question_id: number; answer?: string; isFile?: boolean }[];

    try {
      answers = JSON.parse(answersRaw);

      if (!Array.isArray(answers)) {

        return NextResponse.json({
          status: "Error",
          statusCode: 400,
          message: "Answers must be a JSON array"
        }, { status: 400 });
      }
    } catch (parseError: any) {

      return NextResponse.json({
        status: "Error",
        statusCode: 400,
        message: "Invalid JSON format in answers field",
        error: parseError.message
      }, { status: 400 });
    }


    const isExistingFeedback = await prisma.feedback_responses.findFirst({
      where: {
        batch_id: batchId,
        user_type: user_type,
        user_id: Number(decoded.id),
      }
    });

    if (isExistingFeedback) {

      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Feedback form already submitted for this batch'
      }, { status: 400 });
    }

    // 1. Create feedback response first
    const feedbackResponse = await prisma.feedback_responses.create({
      data: {
        feedback_form_id: Number(feedback_form_id),
        batch_id: batchId,
        user_type: Number(user_type),
        user_id: Number(decoded.id),
        submitted_at: new Date(),
      }
    });

    // 2. Prepare all answers
    const answersData = [];

    for (const ans of answers) {
      let answerValue: string | null = null;
      let fileValue: string | null = null;

      if (ans.isFile) {
        const fileKey = `file_${ans.question_id}`;
        const file = formData.get(fileKey) as File;

        if (!file) continue;

        const ext = file.type.split("/")[1].toLowerCase();

        const filename = `${randomUUID()}.${ext}`

        const uploadDir = path.join(
          process.cwd(),
          storageFolders.storage,
          storageFolders.uploads,
          storageFolders.agency,
          storageFolders.batches,
          String(batchId),
          'feedback_response_signature'
        );

        await fs.promises.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);

        await pipeline(
          file.stream() as any,
          fs.createWriteStream(filePath)
        );

        fileValue = filename;
      } else {
        answerValue = ans.answer || null;
      }

      answersData.push({
        feedback_response_id: feedbackResponse.id,
        feedback_question_id: ans.question_id,
        answer_value: answerValue,
        file: fileValue,
        created_by: Number(decoded.id),
      });
    }

    // 3. Batch insert
    if (answersData.length > 0) {
      await prisma.feedback_response_answers.createMany({
        data: answersData
      });
    }

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'Feedback form submitted successfully'
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

    console.error(`[${new Date().toISOString()}] Error submitting candidate feedback form:`, error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}
