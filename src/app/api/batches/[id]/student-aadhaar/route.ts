import { NextResponse } from "next/server";

import { generateCandidateAadhaarPdf } from "@/services/generateCandidateAadhaarPdf";

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const batchId = Number(context.params.id);

  const files = await generateCandidateAadhaarPdf(batchId);

  console.log("Generated Aadhaar PDF files:", files);

  if (!files || files.length === 0) {
    return new Response("No Aadhaar images found for students in this batch.", {
      status: 404
    });
  }

  return NextResponse.json({
    success: true,
    data: files
  })
}
