import fs from 'fs';

import { randomUUID } from "crypto";

import path from "path";

import { pipeline } from 'stream/promises';

import { type NextRequest, NextResponse } from "next/server";

import { verify, type JwtPayload } from 'jsonwebtoken';

import { Prisma } from "@prisma/client";

import { format } from "date-fns";

import prisma from '@/libs/prisma';

import { FeedbackFormTypes, QuestionTypes, storageFolders } from "@/configs/customDataConfig";
import { updateCandidateResultJob } from '@/services/job.service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {

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

        if (decoded.user_type !== 'U' || decoded.role_id !== 1) {

            return NextResponse.json({
                status: 'Error',
                statusCode: 403,
                message: 'Forbidden: Insufficient permissions'
            }, { status: 403 });
        }

        const batchId = Number(params.id);

        const batch = await prisma.batches.findFirst({
          where: {
            id: batchId,
            assessor_id: Number(decoded.id),
          },
          select: {
            id: true,
            batch_name: true,
            batch_size: true,
            center_spoc_person_name: true,
            assessment_start_datetime: true,

            qualification_pack: {
              select: {
                qualification_pack_name: true,
              }
            },

            training_partner: {
              select: {
                company_name: true,
              }
            },

            training_center: {
              select: {
                user_name: true,
                company_name: true,
                first_name: true,
                last_name: true,
                address: true,
                state: { select: { state_name: true } },
                city: { select: { city_name: true } }
              }
            },

            assessor: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                user_name: true,
                created_by: true,
                created_by_user: {
                  select: {
                    id: true,
                    company_name: true,
                  }
                }
              }
            }
          }
        });

        if (!batch) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'Batch not found'
            }, { status: 404 });
        }

        const feedbackForm = await prisma.feedback_forms.findFirst({
            where: {
              form_type: 2,
              created_by: batch.assessor?.created_by ? Number(batch.assessor.created_by) : undefined,
            },
            select: {
              id: true,
              form_type: true,
              created_by: true,
              feedback_questions: {
                select: {
                  id: true,
                  feedback_form_id: true,
                  question: true,
                  question_type: true,
                  option1: true,
                  option2: true,
                  option3: true,
                  option4: true,
                },
                orderBy: {
                  id: 'asc',
                }
              }
            }
        });

        if (!feedbackForm) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'Feedback form not found for this batch'
            }, { status: 404 });
        }

        const optimizedFeedbackForm = {
            id: feedbackForm?.id,
            form_type_id: feedbackForm?.form_type,
            form_type: FeedbackFormTypes[feedbackForm?.form_type as number] || "Unknown",
            created_by: feedbackForm?.created_by,
            feedback_questions: feedbackForm?.feedback_questions.map((question) => ({
                ...question,
                question_type_id: question.question_type,
                question_type: QuestionTypes[question.question_type as number] || "Unknown",
            }))
        };

        return NextResponse.json({
            status: 'Success',
            statusCode: 200,
            data: {
                // batch: batch,
                batch_id: batch.batch_name,
                batch_size: batch.batch_size,
                assessor_identity_number: decoded.user_name,
                assessor_name: `${batch.assessor?.first_name} ${batch.assessor?.last_name}`.trim(),
                agency_id: batch.assessor?.created_by,
                agency_name: batch.assessor?.created_by_user?.company_name,
                center_id: batch.training_center?.user_name,
                training_partner_name: batch.training_partner?.company_name,
                training_center_name: batch.training_center?.company_name,
                training_center: batch.training_center,
                city: batch.training_center.city?.city_name,
                state: batch.training_center.state?.state_name,
                address: batch.training_center?.address,
                job_role: batch.qualification_pack?.qualification_pack_name,
                center_spoc_person_name: batch.center_spoc_person_name || (`${batch.training_center.first_name} ${batch.training_center.last_name}`).trim(),
                assessment_date: batch.assessment_start_datetime ? format(batch.assessment_start_datetime, 'dd-MMM-yyyy hh:mm a') : null,
                assessment_actucal_datetime: batch.assessment_start_datetime,
                feedback_form: optimizedFeedbackForm,
            }
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

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return NextResponse.json({
            status: 'Error',
            statusCode: 400,
            message: error.message,
            error: error
          }, { status: 400 });
        }

        console.error('Error fetching feedback form:', error);

        return NextResponse.json({
            status: 'Error',
            statusCode: 500,
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {

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

    if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const batchId = Number(params.id);
    const formData = await req.formData();

    const feedback_form_id_raw = formData.get("feedback_form_id")?.toString();
    const user_type = 2; // Since this endpoint is specifically for assessor feedback, we can set user_type to 2 (Assessor)
    const answersRaw = formData.get("answers")?.toString();

    if (!feedback_form_id_raw || !user_type || !answersRaw) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    const feedback_form_id = Number(feedback_form_id_raw);

    if (isNaN(feedback_form_id)) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Invalid feedback_form_id'
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

    // 4. Update batch as completed (if needed) and trigger result update job
    await prisma.batches.update({
      where: { id: batchId },
      data: { batch_completed: 1 }
    });

    await updateCandidateResultJob(batchId, Number(decoded.id));

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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: error.message,
        error: error
      }, { status: 400 });
    }

    console.error('Error submitting feedback form:', error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}

// export async function POST(req: NextRequest, { params }: { params: { id: string } }) {

//   const authHeader = req.headers.get("authorization");

//   if (!authHeader) {

//       return NextResponse.json({
//           status: 'Error',
//           statusCode: 401,
//           message: "Missing token"
//       }, { status: 401 });
//   }

//   const token = authHeader.split(" ")[1];

//   try {

//       const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

//       if (decoded.user_type !== 'U' || decoded.role_id !== 1) {

//           return NextResponse.json({
//               status: 'Error',
//               statusCode: 403,
//               message: 'Forbidden: Insufficient permissions'
//           }, { status: 403 });
//       }

//       const batchId = Number(params.id);

//       const formData = await req.formData();

//       const feedback_form_id = formData.get("feedback_form_id");
//       const user_type = formData.get("user_type");
//       const answers = formData.get("answers") as { question_id: number, answer: string, isFile?: boolean }[];

//       if (!feedback_form_id || !user_type || !answers) {
//           return NextResponse.json({
//               status: 'Error',
//               statusCode: 400,
//               message: 'Missing required fields'
//           }, { status: 400 });
//       }


//       return NextResponse.json({
//           status: 'Success',
//           statusCode: 200,
//           message: 'Feedback form submitted successfully'
//       }, { status: 200 });

//   } catch (error) {

//       console.error('Error submitting feedback form:', error);

//       return NextResponse.json({
//           status: 'Error',
//           statusCode: 500,
//           message: 'Internal Server Error'
//       }, { status: 500 });
//   }
// }
