import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/libs/auth";

// import prisma from "@/libs/prisma";

// import { generateEvidenceZip } from "@/services/generateEvidenceZip";

import { createZipJob } from "@/services/job.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  const session = await getServerSession(authOptions);
  const userId = Number(session?.user.id);

  const batchId = parseInt(params.id);
  
  if (isNaN(batchId)) {
    return NextResponse.json({ message: "Invalid batch ID" }, { status: 400 });
  }

  const { folders } = await request.json();

  console.log("Received request to generate zip for batch ID:", batchId);
  console.log("Selected folders:", folders);

  // const data = generateEvidenceZip(batchId, folders).then((data) => {

  //   if (data.length === 0) {
  //     console.log("No evidence found for the selected folders.");
  //     return NextResponse.json({ message: "No evidence found for the selected folders." }, { status: 404 });
  //   }
  //   console.log("Generated evidence data:", data);

  //   // Create a job to generate the zip file for the specified batch and folders
  // }).catch((error) => {
  //   console.error("Error generating evidence zip:", error);
  //   return NextResponse.json({ message: "Error generating evidence zip" }, { status: 500 });
  // });

  // if (data.length === 0) {
  //   console.log("No evidence found for the selected folders.");
  //   return NextResponse.json({ message: "No evidence found for the selected folders." }, { status: 404 });
  // }

  // console.log("Generated evidence data:", data);

  // Create a job to generate the zip file for the specified batch and folders
  // const job = await prisma.jobs.create({
  //   data: {
  //     job_type: "generate_zip",
  //     reference_id: batchId,
  //     reference_type: "batch",
  //     payload: { folders },
  //     status: "pending",
  //     requested_by: userId,
  //   },
  // });

  const job = await createZipJob(
    batchId,
    folders,
    userId
  );

  return Response.json({
    job
  });

}
