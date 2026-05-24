
import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

export async function GET() {

  try {

    const session =
      await getServerSession(authOptions);

    const userId =
      Number(session?.user.id);

    const userType =
      session?.user.user_type;

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

          type:
            "generate_question_paper",

          status: {

            in: [

              "pending",

              "processing"

            ]

          },

          batch: {

            agency_id: userId

          }

        },

        orderBy: {

          id: "desc"

        },

        select: {

          batch_id: true,

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
