import { type NextRequest, NextResponse } from "next/server";

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/auth";

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { Prisma } from "@prisma/client";

import prisma from "@/libs/prisma";

import { ModeOfAssessment } from "@/configs/customDataConfig";

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

        if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 403,
                message: 'Forbidden: Insufficient permissions'
            }, { status: 403 });
        }

        const now = new Date();

        const lastThirtyDays = new Date();

        lastThirtyDays.setDate(now.getDate() - 30);
        const fromDate = from ? new Date(from).setHours(0, 0, 0, 0) : null;
        const toDate = to ? new Date(to).setHours(23, 59, 59, 999) : null;

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
                assessment_mode: true,
                assessment_start_datetime: true,
                assessment_end_datetime: true,
                assessor_id: true,
                qualification_pack:{
                  select: {
                    qualification_pack_id: true,
                    qualification_pack_name: true,
                  }
                },
                training_partner: {
                    select: {
                        company_name: true,
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
                scheme: {
                    select: {
                        id: true,
                        scheme_name: true,
                        scheme_code: true
                    }
                },
                sub_scheme: {
                    select: {
                        id: true,
                        scheme_name: true,
                        scheme_code: true
                    }
                },
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

        const mappedBatches = batches.map((batch) => ({
            ...batch,
            theory_completed: "40",
            practical_completed: "30",
            viva_completed: "20",
            total_completed: "90",
            assessment_mode: ModeOfAssessment.find(m => m.id === String(batch.assessment_mode))?.label || null,
            training_center: batch.training_center
                ? {
                    ...batch.training_center,
                    spoc_person_name: `${batch.training_center.first_name ?? ""} ${batch.training_center.last_name ?? ""}`.trim(),
                }
                : null,
            video_limits: {
                center_video: {
                    min: 1,
                    max: 1
                }
            },
            photo_limits: {
                selfie_with_center_board: {
                    min: 1,
                    max: 1
                },
                equipment_photos: {
                    min: 5,
                    max: 10,
                },
                group_photo_before_batch_start: {
                    min: 1,
                    max: 20
                },
                group_photo_student: {
                    min: 2,
                    max: 20
                },
                group_photo_student_assessor: {
                    min: 2,
                    max: 20
                },
                group_photo_student_assessor_trainer: {
                    min: 2,
                    max: 20
                },
                center_facility: {
                    min: 3,
                    max: 10
                },
                class_room: {
                    min: 3,
                    max: 8
                },
                it_lab: {
                    min: 3,
                    max: 8
                },
                induction_kit: {
                    min: 1,
                    max: 1
                },
                biometric_device: {
                    min: 1,
                    max: 1
                },
                trainer_aadhaar: {
                    min: 2,
                    max: 2
                },
                trainer_tot_certificate: {
                    min: 1,
                    max: 1
                }
            }
        }));

        return NextResponse.json({
            status: 'Success',
            statusCode: 200,
            message: 'Batches fetched successfully',
            data: mappedBatches
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
