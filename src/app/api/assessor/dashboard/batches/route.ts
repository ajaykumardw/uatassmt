import { NextResponse } from "next/server";

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/auth";

import jwt, { type JwtPayload } from 'jsonwebtoken';

import prisma from "@/libs/prisma";

export async function GET(req: Request) {

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
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    // const agency_id = Number(decoded?.id);

    if(decoded.user_type !== 'U' && decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const batches = await prisma.batches.findMany({
      where: {
        assessor_id: Number(decoded.id),
      },
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
            user_name: true
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
          }
        },
        practical_exam_set: {
          select: {
            id: true,
            set_name: true,
            set_type: true,
          }
        },
        viva_exam_set: {
          select: {
            id: true,
            set_name: true,
            set_type: true,
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
        students: true
      },
      orderBy: {
        assessment_start_datetime: "desc"
      }
    });

    const completedBatches = batches.filter(batch => batch.batch_completed === 1);

    const notCompletedBatches = batches.filter(batch => {
      return batch.batch_completed === 0 && batch.assessment_end_datetime && new Date(batch.assessment_end_datetime) < new Date();
    });

    const remainingBatches = batches.filter(batch => {
      if(batch.batch_completed === 1) return false;
      if(!batch.assessment_end_datetime) return true;

      return new Date(batch.assessment_end_datetime) >= new Date();
    });


    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'Batches fetched successfully',
      data: {
        "upcoming": remainingBatches,
        "completed": completedBatches,
        "notCompleted": notCompletedBatches,
      }
    });

  } catch (error: any) {

    const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';

    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: message,
      error: error
    }, { status: 401 });
  }
}
