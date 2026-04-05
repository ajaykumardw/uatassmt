import { NextResponse, type NextRequest } from "next/server";

import prisma from "@/libs/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, jobId: string } }
) {
  const jobId = parseInt(params.jobId);
  
  if (isNaN(jobId)) {
    return NextResponse.json({ message: "Invalid job ID" }, { status: 400 });
  }

  const job = await prisma.jobs.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    return NextResponse.json({ message: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
