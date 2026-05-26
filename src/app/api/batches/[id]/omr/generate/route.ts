
import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import prisma from "@/libs/prisma";

import { authOptions } from "@/libs/auth";

import { createOMRSheetJob } from "@/services/job.service";

export async function POST(req: NextRequest, { params }: {
  params: {
    id: string;
  };
}) {

  try {

    const session = await getServerSession(authOptions);
    const agency_id = Number(session?.user.agency_id);
    const batchId = Number(params.id);
    const userType = session?.user.user_type;
    const userId = Number(session?.user.id);

    if (!session || !agency_id || userType !== "AG") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized"
        },
        { status: 401 }
      );
    }

    const batchExists = await prisma.batches.findUnique({
      where: { id: batchId, agency_id: agency_id},
      select: {
        id: true,
        assessment_mode: true,
        question_paper: true
      }
    })

    if (!batchExists) {
      return NextResponse.json({
        message: "Batch not found"
      }, {status: 404})
    }

    if (!batchExists.question_paper) {
      return NextResponse.json(
        {
          success: false,
          message: "Batch does not have a question paper assigned. Please generate question paper before generating OMR sheet."
        },
        { status: 400 }
      );
    }

    const job = await createOMRSheetJob(batchId, userId);

    return NextResponse.json({
      success: true,
      message: "OMR sheet generation job created",
      data: {
        job
      }
    })

  } catch (error) {

    console.error("Error in OMR sheet generation:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create OMR sheet generation job"
      },
      { status: 500 }
    );
  }
}
