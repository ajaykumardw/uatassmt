import prisma from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const batchId = parseInt(params.id);
  if (isNaN(batchId)) {
    return NextResponse.json({ message: "Invalid batch ID" }, { status: 400 });
  }

  const latestJob = await prisma.jobs.findFirst({
    where: {
      reference_id: batchId,
      reference_type: "batch",
      job_type: "generate_zip"
    },
    orderBy: {
      created_at: "desc"
    }
  });

  if (!latestJob) {
    return NextResponse.json({ message: "No zip generation job found for this batch" }, { status: 404 });
  }

  return NextResponse.json({ job: latestJob });

}
