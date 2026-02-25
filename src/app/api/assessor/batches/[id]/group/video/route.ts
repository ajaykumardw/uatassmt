import fs from "fs";
import path from "path";

import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

import { type NextRequest, NextResponse } from "next/server";

import { verify } from "jsonwebtoken";

import prisma from "@/libs/prisma";

const allowedVideoMimeTypes = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/x-msvideo",
  "video/3gpp",
];

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {

    // 🔐 Auth
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return errorResponse("Missing token", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = verify(
      token,
      process.env.NEXTAUTH_SECRET as string
    );

    if (decoded.user_type !== "U" && decoded.role_id !== 1) {
      return errorResponse("Forbidden", 403);
    }

    const batchId = Number(context.params.id);

    // ✅ Check batch ownership
    const batch = await prisma.batches.findFirst({
      where: {
        id: batchId,
        assessor: { id: Number(decoded.id) },
      },
    });

    if (!batch) {
      return errorResponse("Batch not found", 404);
    }

    const formData = await req.formData();
    const file = formData.get("group_video") as File;
    const group_id = formData.get("group_id");

    if (!file) {
      return errorResponse("Video file is required", 400);
    }

    if (!(file instanceof File)) {
      return errorResponse("Invalid file", 400);
    }

    // 🎯 MIME Validation
    if (!allowedVideoMimeTypes.includes(file.type)) {
      return errorResponse("Only valid video files allowed", 400);
    }

    // 🎯 Size Limit (300MB)
    if (file.size > 300 * 1024 * 1024) {
      return errorResponse("Video must be less than 300MB", 400);
    }

    // 📁 Upload Directory
    const uploadDir = path.join(
      process.cwd(),
      "storage",
      "uploads",
      "agency",
      "batches",
      batchId.toString(),
      "group-video"
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = file.type.split("/")[1];
    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // 🚀 STREAM TO DISK (Memory Safe)
    await pipeline(
      file.stream() as any,
      fs.createWriteStream(filePath)
    );

    // Save in DB
    const group = await prisma.student_groups.update({
      where: {
        id: Number(group_id),
        batch_id: batchId,
      },
      data: {
        group_video: filename,
      },
    });

    const videoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/storage/uploads/agency/batches/${batchId}/group-video/${filename}`;

    return NextResponse.json({
      status: "Success",
      message: "Group video uploaded successfully",
      data: {
        group_id: group.group_id,
        group_video_url: videoUrl,
      },
    });

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse("Token expired", 401);
    }

    if (error.name === 'JsonWebTokenError') {
      return errorResponse("Invalid token", 401);
    }

    console.error('Server Error:', error);

    return errorResponse("Internal server error", 500);
  }
}

function errorResponse(message: string, statusCode: number) {
  return NextResponse.json(
    {
      status: "Error",
      message,
    },
    { status: statusCode }
  );
}
