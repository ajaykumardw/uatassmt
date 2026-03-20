
// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import { verify, type JwtPayload } from 'jsonwebtoken';

// Data Imports
// import { getServerSession } from 'next-auth';


import prisma from '@/libs/prisma';


export async function POST(
    request: NextRequest,
    { params }: { params: { id: string, studentId: string } }
) {
    const id = Number(params.id);
    const studentId = Number(params.studentId);

    const { searchParams } = new URL(request.url);

    // const examType = searchParams.get("examType");
    // const capturedImages = searchParams.getAll("capturedImages");
    // const capturedVideo = searchParams.get("capturedVideo");

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({
            status: "Error",
            statusCode: 401,
            message: "Missing token"
        }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

        if (decoded.user_type !== "U" || decoded.role_id !== 1) {
            return NextResponse.json({
                status: "Error",
                statusCode: 403,
                message: "Forbidden: Insufficient permissions"
            }, { status: 403 });
        }

        // Check if the batch exists and is assigned to the assessor
        const batch = await prisma.batches.findFirst({
            where: {
                id: id,
                assessor_id: Number(decoded.id),
                assessment_start_datetime: new Date()
            }
        });

        if (!batch) {
            return NextResponse.json({
                status: "Error",
                statusCode: 404,
                message: "Batch not found"
            }, { status: 404 });
        }

        // Check if the student exists and is part of the batch
        const student = await prisma.students.findFirst({
            where: {
                id: studentId,
                batch_id: id
            }
        });

        if (!student) {
            return NextResponse.json({
                status: "Error",
                statusCode: 404,
                message: "Student not found in this batch"
            }, { status: 404 });
        }

        // Here you can implement the logic to capture the student's assessment data
        // For example, you might want to create a new record in an "assessments" table with the captured data

        return NextResponse.json({
            status: "Success",
            statusCode: 200,
            message: "Student assessment data captured successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error capturing student assessment data:", error);
        return NextResponse.json({
            status: "Error",
            statusCode: 500,
            message: "Internal server error"
        }, { status: 500 });
    }
}
