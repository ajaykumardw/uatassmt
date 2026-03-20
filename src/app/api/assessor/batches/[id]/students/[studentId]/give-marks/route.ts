// import fs from 'fs';

// import { randomUUID } from 'crypto';

// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import { verify, type JwtPayload } from 'jsonwebtoken';

// Data Imports
// import { getServerSession } from 'next-auth';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

// import { authOptions } from '@/libs/auth';


class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

// export async function GET(req: NextRequest, context: { params: { id: number } }) {

//   try {
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader) {
//       return errorResponse("Missing token", 401);
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

//     if (decoded.user_type !== "U" || decoded.role_id !== 1) {
//       return errorResponse("Forbidden: Insufficient permissions", 403);
//     }

//     const type = req.nextUrl.searchParams.get("type") || "practical";
//     const id = Number(context.params.id);

//     const batch = await prisma.batches.findUnique({
//       where: {
//         id: id,
//         assessor: {
//           id: Number(decoded.id),
//         },
//       },
//     });

//     if (!batch) {
//       return errorResponse("Batch not found", 404);
//     }

//     const selectField = type === "viva" ? {
//       "viva_students": {
//         select: {
//           id: true,
//           batch_id: true,
//           candidate_id: true,
//           candidate_name: true,
//         }
//       }
//     } : {
//       "practical_students": {
//         select: {
//           id: true,
//           batch_id: true,
//           candidate_id: true,
//           candidate_name: true,
//         }
//       }
//     };

//     const groups = await prisma.student_groups.findMany({
//       where: {
//         batch_id: id,
//         group_type: String(type),
//       },
//       select: {
//         id: true,
//         group_id: true,
//         group_photo: true,
//         group_video: true,
//         ...selectField
//       }
//     });

//     const mappedGroups = groups.map(group => {
//       const mappedGroup: any = {
//         id: group.id,
//         group_id: group.group_id,
//       };

//       if (group.group_photo) {
//         const relativePhotoPath = path.posix.join(
//           storageFolders.storage,
//           storageFolders.uploads,
//           storageFolders.agency,
//           storageFolders.batches,
//           id.toString(),
//           'group-photo',
//           group.group_photo
//         );

//         mappedGroup.group_photo_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativePhotoPath}`;
//       }

//       if (group.group_video) {
//         const relativeVideoPath = path.posix.join(
//           storageFolders.storage,
//           storageFolders.uploads,
//           storageFolders.agency,
//           storageFolders.batches,
//           id.toString(),
//           'group-video',
//           group.group_video
//         );

//         mappedGroup.group_video_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativeVideoPath}`;
//       }

//       if (type === "viva") {
//         mappedGroup.students = group.viva_students;
//       } else {
//         mappedGroup.students = group.practical_students;
//       }

//       return mappedGroup;
//     });

//     return NextResponse.json({
//       status: "Success",
//       statusCode: 200,
//       message: "Groups fetched successfully.",
//       data: mappedGroups,
//     });

//   } catch (error: any) {
//     if (error.name === 'TokenExpiredError') {
//       return errorResponse("Token expired", 401);
//     }

//     if (error.name === 'JsonWebTokenError') {
//       return errorResponse("Invalid token", 401);
//     }

//     console.error('Server Error:', error);

//     return errorResponse("Internal server error", 500);
//   }
// }

// export async function POST(
//   req: NextRequest,
//   { params }: { params: { id: string; studentId: string } }
// ) {
//   try {
//     /* ---------------- AUTH ---------------- */
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader) return errorResponse("Missing token", 401);

//     const token = authHeader.split(" ")[1];

//     const decoded: any = verify(
//       token,
//       process.env.NEXTAUTH_SECRET as string
//     );

//     if (decoded.user_type !== "U" || decoded.role_id !== 1) {
//       return errorResponse("Forbidden: Insufficient permissions", 403);
//     }

//     /* ---------------- INPUT ---------------- */
//     const { type, totalMarks, remarks } = await req.json();

//     if (type !== "practical" && type !== "viva") {
//       return errorResponse("Only 'practical' and 'viva' types are supported", 400);
//     }

//     if (
//       totalMarks === undefined ||
//       isNaN(Number(totalMarks)) ||
//       Number(totalMarks) < 0
//     ) {
//       return errorResponse("Invalid totalMarks", 400);
//     }

//     const studentId = Number(params.studentId);
//     const batchId = Number(params.id);

//     if (!batchId || !studentId) {
//       return errorResponse("Invalid batch or student ID", 400);
//     }

//     /* ---------------- FETCH QUESTIONS ---------------- */

//     let questions = [];

//     if (type === "practical") {

//       const practicalBatch = await prisma.batches.findUnique({
//         where: { id: batchId },
//         select: {
//           practical_exam_set: {
//             select: {
//               exam_sets_questions: {
//                 select: {
//                   questions: {
//                     select: {
//                       id: true,
//                       marks: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         }
//       });

//       questions =
//         practicalBatch?.practical_exam_set?.exam_sets_questions.map(
//           esq => esq.questions
//         ) ?? [];

//     } else {

//       const vivaBatch = await prisma.batches.findUnique({
//         where: { id: batchId },
//         select: {
//           viva_exam_set: {
//             select: {
//               exam_sets_questions: {
//                 select: {
//                   questions: {
//                     select: {
//                       id: true,
//                       marks: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         }
//       });

//       questions =
//         vivaBatch?.viva_exam_set?.exam_sets_questions.map(
//           esq => esq.questions
//         ) ?? [];
//     }

//     if (questions.length === 0) {
//       return errorResponse(`No ${type} questions found`, 404);
//     }

//     /* ---------------- DISTRIBUTION LOGIC ---------------- */
//     // const distributedMarks =
//     //   Number(totalMarks) / questions.length;

//     /* ---------------- TRANSACTION ---------------- */
//     // await prisma.$transaction(async (tx) => {
//     //   for (const question of questions) {
//     //     const obtainedValue = Math.min(
//     //       distributedMarks,
//     //       Number(question.marks)
//     //     );

//     //     await tx.student_question_attempts.upsert({
//     //       where: {
//     //         student_id_question_id_attempt_no: {
//     //           student_id: studentId,
//     //           question_id: question.id,
//     //           attempt_no: 1,
//     //         },
//     //       },
//     //       update: {
//     //         obtained_marks: new Prisma.Decimal(obtainedValue),
//     //         remarks: remarks || null,
//     //         evaluated_at: new Date(),
//     //       },
//     //       create: {
//     //         student_id: studentId,
//     //         question_id: question.id,
//     //         assessor_id: Number(decoded.id),
//     //         attempt_no: 1,
//     //         max_marks: new Prisma.Decimal(question.marks),
//     //         obtained_marks: new Prisma.Decimal(obtainedValue),
//     //         remarks: remarks || null,
//     //         evaluated_at: new Date(),
//     //       },
//     //     });
//     //   }
//     // });


//     let remaining = new Prisma.Decimal(totalMarks);
//     const count = questions.length;

//     const allocations = questions.map(q => ({
//       id: q.id,
//       max: new Prisma.Decimal(q.marks),
//       obtained: new Prisma.Decimal(0),
//     }));

//     // First pass: equal distribution
//     const base = remaining.div(count);

//     for (const q of allocations) {
//       const give = Prisma.Decimal.min(base, q.max);

//       q.obtained = give;
//       remaining = remaining.minus(give);
//     }

//     // Second pass: redistribute leftover
//     for (const q of allocations) {
//       if (remaining.lte(0)) break;

//       const capacity = q.max.minus(q.obtained);

//       if (capacity.gt(0)) {
//         const extra = Prisma.Decimal.min(capacity, remaining);

//         q.obtained = q.obtained.plus(extra);
//         remaining = remaining.minus(extra);
//       }
//     }

//     await prisma.$transaction(async (tx) => {
//       for (const q of allocations) {
//         await tx.student_question_attempts.upsert({
//           where: {
//             student_id_question_id_attempt_no: {
//               student_id: studentId,
//               question_id: q.id,
//               attempt_no: 1,
//             },
//           },
//           update: {
//             obtained_marks: q.obtained.toDecimalPlaces(2),
//             remarks: remarks ?? null,
//             evaluated_at: new Date(),
//           },
//           create: {
//             student_id: studentId,
//             question_id: q.id,
//             assessor_id: Number(decoded.id),
//             attempt_no: 1,
//             max_marks: q.max,
//             obtained_marks: q.obtained.toDecimalPlaces(2),
//             remarks: remarks ?? null,
//             evaluated_at: new Date(),
//           },
//         });
//       }
//     });

//     const distributedMarks = allocations.map(a => ({
//       question_id: a.id,
//       obtained_marks: a.obtained.toNumber(),
//     }));


//     /* ---------------- RESPONSE ---------------- */
//     return NextResponse.json({
//       status: "Success",
//       message: `${type.charAt(0).toUpperCase() + type.slice(1)} marks distributed successfully`,
//       totalMarks: Number(totalMarks),
//       perQuestionDistributed: distributedMarks,
//       questions: questions,
//       questionLength: questions.length,
//     });

//   } catch (error: any) {
//     if (error.name === "TokenExpiredError") {
//       return errorResponse("Token expired", 401);
//     }

//     if (error.name === "JsonWebTokenError") {
//       return errorResponse("Invalid token", 401);
//     }

//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       return errorResponse(error.message, 400);
//     }

//     if (error instanceof ApiError) {
//       return errorResponse(error.message, error.statusCode);
//     }

//     console.error("Server Error:", error);

//     return errorResponse("Internal server error", 500);
//   }
// }

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; studentId: string } }
) {
    try {

        /* ---------------- AUTH ---------------- */
        const authHeader = req.headers.get("authorization");

        if (!authHeader) return errorResponse("Missing token", 401);

        const token = authHeader.split(" ")[1];

        const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

        if (decoded.user_type !== "U" || decoded.role_id !== 1) {
            return errorResponse("Forbidden: Insufficient permissions", 403);
        }

        const examType = req.nextUrl.searchParams.get("type") || "practical";

        const batchId = Number(params.id);
        const studentId = Number(params.studentId);

        if (!batchId || !studentId) {
            return errorResponse("Invalid batch or student ID", 400);
        }

        if (examType !== "practical" && examType !== "viva") {
            return errorResponse("Invalid exam type. Use 'practical' or 'viva'", 400);
        }

        /* ---------------- CHECK STUDENT ---------------- */

        const student = await prisma.students.findFirst({
            where: {
                id: studentId,
                batch_id: batchId,
            },
            select: { id: true },
        });

        if (!student) {
            return errorResponse("Student not found in this batch", 404);
        }

        /* ---------------- FETCH EXAM SET QUESTIONS ---------------- */

        const batch = await prisma.batches.findUnique({
            where: { id: batchId },
            select: {
                practical_exam_set: {
                    select: {
                        exam_sets_questions: {
                            select: {
                                question_id: true,
                                marks: true,
                            },
                        },
                    },
                },
                viva_exam_set: {
                    select: {
                        exam_sets_questions: {
                            select: {
                                question_id: true,
                                marks: true,
                            },
                        },
                    },
                },
            },
        });

        if (!batch) {
            return errorResponse("Batch not found", 404);
        }

        const examQuestions =
            examType === "practical"
                ? batch.practical_exam_set?.exam_sets_questions ?? []
                : batch.viva_exam_set?.exam_sets_questions ?? [];

        if (!examQuestions.length) {
            return errorResponse(
                `No ${examType} exam set configured for this batch`,
                404
            );
        }

        const questionIds = examQuestions.map((q) => q.question_id);

        /* ---------------- FETCH ATTEMPTED QUESTIONS ---------------- */

        const attempts = await prisma.student_question_attempts.findMany({
            where: {
                student_id: studentId,
                question_id: { in: questionIds },
            },
            select: {
                question_id: true,
                max_marks: true,
                obtained_marks: true,
                remarks: true,
                evaluated_at: true,
                assessor_id: true,
            },
        });

        /* ---------------- RESPONSE ---------------- */

        return NextResponse.json({
            status: "success",
            message: `${examType} attempted questions fetched successfully`,
            data: {
                batch_id: batchId,
                student_id: studentId,
                exam_type: examType,
                total_questions: examQuestions.length,
                attempted_count: attempts.length,
                questions: attempts,
            },
        });
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return errorResponse("Token expired", 401);
        }

        if (error.name === "JsonWebTokenError") {
            return errorResponse("Invalid token", 401);
        }

        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }

        console.error("GET STUDENT MARKS ERROR:", error);

        return errorResponse("Internal server error", 500);
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; studentId: string } }
) {
    try {

        /* ---------------- AUTH ---------------- */
        const authHeader = req.headers.get("authorization");

        if (!authHeader) return errorResponse("Missing token", 401);

        const token = authHeader.split(" ")[1];

        const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

        if (decoded.user_type !== "U" || decoded.role_id !== 1) {
            return errorResponse("Forbidden: Insufficient permissions", 403);
        }

        /* ---------------- INPUT ---------------- */
        const body = await req.json();

        if (!Array.isArray(body) || body.length === 0) {
            return errorResponse("Body must be non-empty array", 400);
        }

        const batchId = Number(params.id);
        const studentId = Number(params.studentId);

        if (!batchId || !studentId) {
            return errorResponse("Invalid batch or student ID", 400);
        }

        const batchExit = await prisma.batches.findUnique({
            where: {
                id: batchId,
                assessor_id: Number(decoded.id),
            },
            select: {
                id: true,
                batch_completed: true,
                status: true,
                assessor_id: true,
            },
        });

        if (!batchExit) {
            return errorResponse("Batch not found", 404);
        }

        if (batchExit.batch_completed === 1) {
            return errorResponse("Batch already completed", 400);
        }

        if (batchExit.status !== 1) {
            return errorResponse("Batch is inactive", 400);
        }

        const student = await prisma.students.findFirst({
            where: {
                id: studentId,
                batch_id: batchId,
            },
            select: {
                id: true,
            },
        });

        if (!student) {
            return errorResponse(
                "Student not found in this batch",
                404
            );
        }

        const questionIds = body.map((q) => Number(q.question_id));

        /* ---------------- FETCH QUESTIONS FROM EXAM SET ---------------- */

        const batch = await prisma.batches.findUnique({
            where: { id: batchId },
            select: {
                practical_exam_set: {
                    select: {
                        exam_sets_questions: {
                            where: {
                                question_id: { in: questionIds },
                            },
                            select: {
                                question_id: true,
                                marks: true, // ✅ this is max marks
                            },
                        },
                    },
                },
                viva_exam_set: {
                    select: {
                        exam_sets_questions: {
                            where: {
                                question_id: { in: questionIds },
                            },
                            select: {
                                question_id: true,
                                marks: true,
                            },
                        },
                    },
                },
            },
        });

        if (!batch) {
            return errorResponse("Batch not found", 404);
        }

        const examQuestions = [
            ...(batch.practical_exam_set?.exam_sets_questions ?? []),
            ...(batch.viva_exam_set?.exam_sets_questions ?? []),
        ];

        if (examQuestions.length !== questionIds.length) {
            return errorResponse(
                "Some questions do not belong to this batch exam set",
                400
            );
        }

        const questionMap = new Map(
            examQuestions.map((q) => [q.question_id, q])
        );

        /* ---------------- TRANSACTION ---------------- */

        const result = await prisma.$transaction(async (tx) => {
            const savedRecords = [];

            for (const item of body) {
                const qId = Number(item.question_id);
                const obtained = Number(item.obtained_marks);

                if (isNaN(qId) || isNaN(obtained) || obtained < 0) {
                    throw new ApiError("Invalid question_id or obtained_marks", 400);
                }

                const examQuestion = questionMap.get(qId);

                if (!examQuestion) {
                    throw new ApiError(
                        `Question ${qId} not part of this exam set`,
                        400
                    );
                }

                if (obtained > Number(examQuestion.marks)) {
                    throw new ApiError(
                        `Marks exceed max (${examQuestion.marks}) for question ${qId}`,
                        400
                    );
                }

                const upserted = await tx.student_question_attempts.upsert({
                    where: {
                        student_id_question_id_attempt_no: {
                            student_id: studentId,
                            question_id: qId,
                            attempt_no: 1,
                        },
                    },
                    update: {
                        obtained_marks: new Prisma.Decimal(obtained),
                        remarks: item.remarks ?? null,
                        evaluated_at: new Date(),
                    },
                    create: {
                        student_id: studentId,
                        question_id: qId,
                        assessor_id: Number(decoded.id),
                        attempt_no: 1,
                        max_marks: new Prisma.Decimal(examQuestion.marks),
                        obtained_marks: new Prisma.Decimal(obtained),
                        remarks: item.remarks ?? null,
                        evaluated_at: new Date(),
                    },
                    select: {
                        id: true,
                        student_id: true,
                        question_id: true,
                        max_marks: true,
                        obtained_marks: true,
                        remarks: true,
                        evaluated_at: true,
                    }
                });

                savedRecords.push(upserted);
            }

            return savedRecords; // ✅ IMPORTANT
        });

        return NextResponse.json({
            status: "Success",
            message: "Marks saved successfully",
            data: result,
        });

    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return errorResponse("Token expired", 401);
        }

        if (error.name === "JsonWebTokenError") {
            return errorResponse("Invalid token", 401);
        }

        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }

        console.error("Server Error:", error);

        return errorResponse("Internal server error", 500);
    }
}

function errorResponse(message: string, statusCode: number, error?: any) {
    return NextResponse.json(
        {
            status: "Error",
            statusCode,
            message,
            error,
        },
        { status: statusCode }
    );
}
