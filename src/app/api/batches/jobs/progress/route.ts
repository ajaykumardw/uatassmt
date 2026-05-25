
import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

export async function GET(req: NextRequest) {

  try {

    const session =
      await getServerSession(authOptions);

    const userId =
      Number(session?.user.id);

    const userType =
      session?.user.user_type;

    const searchParams = req.nextUrl.searchParams;

    const batchIds = searchParams.get("batchIds");

    // const batchId = await req.searchParams.get("batchId");

    if (!batchIds) {

      return NextResponse.json(

        {
          message: "Batch ID is required"
        },

        {
          status: 400
        }
       );

     }

    if (userType !== "AG") {

      return NextResponse.json(

        {
          message: "Unauthorized"
        },

        {
          status: 403
        }
      );

    }

    // ONLY USER'S BATCHES

    const jobs =
      await prisma.jobs.findMany({

        where: {

          job_type:
            "generate_question_paper",

          // status: {

          //   in: [

          //     "pending",

          //     "processing"

          //   ]

          // },
          reference_id: {

            in: batchIds.split(",").map(Number)

          },

          reference_type: "batch",
          requested_by: userId
        },

        orderBy: {

          id: "desc"

        },

        select: {

          id: true,

          reference_id: true,

          progress: true,

          status: true

        }

      });

    return NextResponse.json({

      success: true,

      data: jobs

    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(

      {
        success: false,

        message:
          "Something went wrong"
      },

      {
        status: 500
      }
    );

  }

}
