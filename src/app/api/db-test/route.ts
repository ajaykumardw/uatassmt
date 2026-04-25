export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import prisma from "@/libs/prisma";

export async function GET() {
  
    try {

    const result =
      await prisma.$queryRaw<Array<{ server_time: Date }>>`
        SELECT NOW() AS server_time
      `;

    return NextResponse.json({
      success: true,
      message: "✅ Database connected successfully",
      data: result
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        message: "❌ Database connection failed",
        errorCode: error?.code || "N/A",
        errorMessage: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
