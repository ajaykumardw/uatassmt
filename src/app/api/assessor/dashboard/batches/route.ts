import { type NextRequest, NextResponse } from "next/server";

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/auth";

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { Prisma } from "@prisma/client";

import prisma from "@/libs/prisma";

export async function GET(req: NextRequest) {

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const status = req.nextUrl.searchParams.get("status");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    // const agency_id = Number(decoded?.id);

    if(decoded.user_type !== 'U' && decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const now = new Date();

    const lastThirtyDays = new Date();

    lastThirtyDays.setDate(now.getDate() - 30);
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    // Base where condition
    const whereClause: any = {
      assessor_id: Number(decoded.id),
    };

    if (status === "completed") {
      whereClause.batch_completed = 1;
      whereClause.assessment_start_datetime = {
        gte: fromDate || lastThirtyDays,
        lte: toDate || now
      };
    } else if (status === "notCompleted") {
      whereClause.batch_completed = 0;
      whereClause.assessment_start_datetime = {
        lt: now, // started before now
        ...(fromDate && { gte: fromDate }), // optional lower limit
        ...(toDate && { lte: toDate }),     // optional upper limit
      };
    } else {
      // ✅ Upcoming batches (not completed and start_date >= now)
      whereClause.batch_completed = 0;
      whereClause.assessment_start_datetime = {
        gte: now,
        ...(toDate && { lte: toDate }),
      };
    }

    const batches = await prisma.batches.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        batch_completed: true,
        batch_name: true,
        batch_size: true,
        assessment_start_datetime: true,
        assessment_end_datetime: true,
        assessor_id: true,
        qualification_pack: {
          select: {
            id: true,
            qualification_pack_id: true,
            qualification_pack_name: true,
            ssc: {
              select: {
                id: true,
                ssc_code: true
              }
            }
          }
        },
        training_partner: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        training_center: {
          select: {
            id: true,
            email: true,
            company_name: true,
            user_name: true,
            user_type: true,
            first_name: true,
            last_name: true,
            mobile_no: true,
          }
        },
        assessor: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        theory_exam_set: {
          select: {
            id: true,
            set_name: true,
            set_type: true,
            exam_sets_questions: {
              select: {
                id: true,
                exam_set_id: true,
                question_id: true,
                marks: true,
                questions: true,
              }
            },
          }
        },
        practical_exam_set: {
          select: {
            id: true,
            set_name: true,
            set_type: true,
            exam_sets_questions: {
              select: {
                id: true,
                exam_set_id: true,
                question_id: true,
                marks: true,
                questions: true,
              }
            },
          }
        },
        viva_exam_set: {
          select: {
            id: true,
            set_name: true,
            set_type: true,
            exam_sets_questions: true,
          }
        },
        scheme: {
          select: {
            id: true,
            scheme_name: true,
            scheme_code: true
          }
        },
        sub_scheme: {
          select:{
            id: true,
            scheme_name: true,
            scheme_code: true
          }
        },
        students: {
          select: {
            id: true,
            batch_id: true,
            candidate_id: true,
            user_name: true,
            candidate_name: true,
            gender: true,
            category: true,
            date_of_birth: true,
            mobile_no: true,
          }
        }
      },
      orderBy: {
        assessment_start_datetime: "desc"
      }
    });

    // const completedBatches = batches.filter(batch => batch.batch_completed === 1);

    // const notCompletedBatches = batches.filter(batch => {
    //   return batch.batch_completed === 0 && batch.assessment_start_datetime && new Date(batch.assessment_start_datetime) < new Date();
    // });

    // const remainingBatches = batches.filter(batch => {
    //   if(batch.batch_completed === 1) return false;
    //   if(!batch.assessment_end_datetime) return true;

    //   return new Date(batch.assessment_end_datetime) >= new Date();
    // });


    // return NextResponse.json({
    //   status: 'Success',
    //   statusCode: 200,
    //   message: 'Batches fetched successfully',
    //   data: {
    //     "upcoming": remainingBatches,
    //     "completed": completedBatches,
    //     "notCompleted": notCompletedBatches,
    //   }
    // });
    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'Batches fetched successfully',
      data: batches
    });

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

    // Fallback for any other server-side errors

    console.error('Server Error:', error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal server error',
      error: error
    }, { status: 500 });

    // const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';

    // return NextResponse.json({
    //   status: 'Error',
    //   statusCode: 401,
    //   message: message,
    //   error: error
    // }, { status: 401 });
  }
}
