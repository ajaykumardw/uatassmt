import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/libs/auth";

// import prisma from "@/libs/prisma";

// import { generateEvidenceZip } from "@/services/generateEvidenceZip";

import { createCertificateJob } from "@/services/job.service";
import prisma from "@/libs/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  const session = await getServerSession(authOptions);
  const userId = Number(session?.user.id);
  const userType = session?.user.user_type;

  if (userType !== "AG") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const batchId = parseInt(params.id);

  if (isNaN(batchId)) {
    return NextResponse.json({ message: "Invalid batch ID" }, { status: 400 });
  }

  const batch = await prisma.batches.findUnique({

    where: { id: batchId, agency_id: userId },
    select: { id: true }

  });

  if (!batch) {
    return NextResponse.json({
      status: "Error",
      statusCode: 404,
      message: "Batch not found"
    }, { status: 404 });
  }

  console.log("Received request to generate certificates for batch ID:", batchId);

  const job = await createCertificateJob(
    batchId,
    userId
  );

  return NextResponse.json({
    job
  });

}
