
import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

import { trainingResourceFilePath } from "@/configs/customDataConfig";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      user_id: userId,
      trainingResource: {
        name: {
          contains: search
        }
      }
    };

    const total = await prisma.user_training_resources.count({
      where
    });

    const rows = await prisma.user_training_resources.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        trainingResource: {
          created_at: "desc"
        }
      },
      select: {
        is_read: true,
        trainingResource: {
          select: {
            id: true,
            name: true,
            file: true,
            description: true,
            created_at: true
          }
        }
      }
    })

    const modifiedRows = rows.map(row => ({
      ...row,
      trainingResource: {
        ...row.trainingResource,
        file: row.trainingResource.file ? trainingResourceFilePath(row.trainingResource.id, row.trainingResource.file) : null
      }
    }));

    return NextResponse.json({
      data: modifiedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server"
// import prisma from "@/libs/prisma"
// import { getServerSession } from "next-auth"
// import { authOptions } from "@/libs/auth"

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.user.id)
  const { trainingResourceId } = await req.json()

  await prisma.user_training_resources.updateMany({
    where: {
      user_id: userId,
      training_resource_id: trainingResourceId
    },
    data: {
      is_read: 1
    }
  })

  return NextResponse.json({ success: true })
}
