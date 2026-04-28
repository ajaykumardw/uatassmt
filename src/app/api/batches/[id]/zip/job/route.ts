import { type NextRequest, NextResponse } from "next/server";

import prisma from "@/libs/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const batchId = parseInt(params.id);
  const type = request.nextUrl.searchParams.get("type") || "generate_zip";

  if (isNaN(batchId)) {
    return NextResponse.json({ message: "Invalid batch ID" }, { status: 400 });
  }

  const latestJob = await prisma.jobs.findFirst({
    where: {
      reference_id: batchId,
      reference_type: "batch",
      job_type: type
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
