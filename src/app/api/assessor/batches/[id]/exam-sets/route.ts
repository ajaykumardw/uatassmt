import { type NextRequest, NextResponse } from "next/server";

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/auth";

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { Prisma } from "@prisma/client";

import prisma from "@/libs/prisma";

export async function GET(req: NextRequest, context: { params: { id: number } }) {

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({
            status: 'Error',
            statusCode: 401,
            message: "Missing token"
        }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const id = Number(context.params.id);

    try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

        if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 403,
                message: 'Forbidden: Insufficient permissions'
            }, { status: 403 });
        }

        const examSets = await prisma.batches.findUnique({
            where: {
                id: id
            },
            select: {
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
                        exam_sets_questions: {
                            select: {
                                questions: {
                                    select: {
                                        id: true,
                                        language_id: true,
                                        question_level: true,
                                        question_type: true,
                                        question: true,
                                        marks: true,
                                        status: true,
                                    }
                                },
                            }
                        },
                    }
                },
                viva_exam_set: {
                    select: {
                        id: true,
                        set_name: true,
                        set_type: true,
                        exam_sets_questions: {
                            select: {
                                questions: {
                                    select: {
                                        id: true,
                                        language_id: true,
                                        question_level: true,
                                        question_type: true,
                                        question: true,
                                        marks: true,
                                        status: true,
                                    }
                                },
                            }
                        },
                    }
                },
            }
        });

        const mappedExamSets = {
            ...examSets,
            practical_exam_set: {
                ...examSets?.practical_exam_set,
                exam_sets_questions: examSets?.practical_exam_set?.exam_sets_questions.map(q => q.questions)
            },
            viva_exam_set: {
                ...examSets?.viva_exam_set,
                exam_sets_questions: examSets?.viva_exam_set?.exam_sets_questions.map(q => q.questions)
            }
        }

        return NextResponse.json({
            status: 'Success',
            statusCode: 200,
            message: 'Students fetched successfully',
            data: mappedExamSets
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

    }
}
