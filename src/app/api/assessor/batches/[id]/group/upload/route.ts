// import fs from "fs";
// import path from "path";
// import { randomUUID } from "crypto";
// import { pipeline } from "stream/promises";
// import { NextRequest, NextResponse } from "next/server";
// import { verify } from "jsonwebtoken";
// import prisma from "@/libs/prisma";

// const allowedPhotoTypes = ["image/jpeg", "image/png", "image/jpg"];
// const allowedVideoTypes = [
//   "video/mp4",
//   "video/mpeg",
//   "video/quicktime",
//   "video/x-ms-wmv",
//   "video/x-msvideo",
//   "video/3gpp",
// ];

// export async function POST(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     // 🔐 Auth
//     const authHeader = req.headers.get("authorization");
//     if (!authHeader) return errorResponse("Missing token", 401);
//     const token = authHeader.split(" ")[1];
//     const decoded: any = verify(token, process.env.NEXTAUTH_SECRET as string);

//     if (decoded.user_type !== "U" || decoded.role_id !== 1) {
//       return errorResponse("Forbidden", 403);
//     }

//     const batchId = Number(params.id);

//     // ✅ Check batch ownership
//     const batch = await prisma.batches.findFirst({
//       where: { id: batchId, assessor: { id: Number(decoded.id) } },
//     });
//     if (!batch) return errorResponse("Batch not found", 404);

//     const formData = await req.formData();
//     const files = formData.getAll("media") as File[];
//     const groupId = formData.get("group_id") as string | null;
//     const candidateId = formData.get("candidate_id") as string | null;
//     // const mediaType = formData.get("media_type") as string; // "photo" | "video"
//     const examType = formData.get("exam_type") as string; // "theory" | "practical" | "viva"

//     if (groupId) {
//         const group = await prisma.student_groups.findFirst({
//             where: {
//             id: Number(groupId),
//             batch_id: batchId,
//             },
//         });
//         if (!group) return errorResponse("Group not found in this batch", 404);
//     }

//     if (candidateId) {
//         const candidate = await prisma.students.findFirst({
//             where: {
//             id: Number(candidateId),
//             batch_id: batchId,
//             },
//         });
//         if (!candidate) return errorResponse("Candidate not found in this batch", 404);
//     }

//     if (!examType) return errorResponse("exam_type is required", 400);
//     if (!files || files.length === 0) return errorResponse("No media files provided", 400);
//     // if (!["photo", "video"].includes(mediaType)) return errorResponse("Invalid media_type", 400);

//     const uploadPromises = files.map(async (file) => {
//       if (!(file instanceof File)) throw new Error("Invalid file");

//       // Validate MIME
//         //   const mimeList = mediaType === "photo" ? allowedPhotoTypes : allowedVideoTypes;
//         //   if (!mimeList.includes(file.type)) throw new Error(`Invalid ${mediaType} type: ${file.type}`);

//         // Detect media type from MIME
//         let mediaType: "photo" | "video";
//         if (allowedPhotoTypes.includes(file.type)) {
//             mediaType = "photo";
//         } else if (allowedVideoTypes.includes(file.type)) {
//             mediaType = "video";
//         } else {
//             throw new Error(`Invalid file type: ${file.type}`);
//         }

//       // Size limit
//       const maxSize = mediaType === "photo" ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
//       if (file.size > maxSize) throw new Error(`${mediaType} exceeds max size`);

//       // Folder structure
//       let uploadDir = path.join(
//         process.cwd(),
//         "storage",
//         "uploads",
//         "agency",
//         "batches",
//         `${batchId}`,
//         `${examType}`
//       );

//       if (groupId) {
//         uploadDir = path.join(uploadDir, "groups", groupId, mediaType + "s");
//       } else if (candidateId) {
//         uploadDir = path.join(uploadDir, "individual", candidateId, mediaType + "s");
//       } else {
//         throw new Error("Either group_id or candidate_id must be provided");
//       }

//       if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

//       const ext = file.name.split(".").pop();
//       const filename = `${randomUUID()}.${ext}`;
//       const filePath = path.join(uploadDir, filename);

//       await pipeline(file.stream() as any, fs.createWriteStream(filePath));

//       // Save in DB
//       return prisma.media_files.create({
//         data: {
//           batch_id: batchId,
//           group_id: groupId ? Number(groupId) : null,
//           candidate_id: candidateId ? Number(candidateId) : null,
//           type: mediaType,
//           filename,
//         },
//       });
//     });

//     const savedMedia = await Promise.all(uploadPromises);

//     return NextResponse.json({
//       status: "Success",
//       message: `${savedMedia.length} files uploaded successfully`,
//       data: savedMedia.map((m) => ({
//         id: m.id,
//         url: `${process.env.NEXT_PUBLIC_APP_URL}/storage/uploads/agency/batches/${batchId}/${examType}/` +
//              (m.group_id ? `groups/${m.group_id}/${m.type}s/${m.filename}` : `individual/${m.candidate_id}/${m.type}s/${m.filename}`),
//       })),
//     });

//   } catch (error: any) {
//     if (error.name === "TokenExpiredError") return errorResponse("Token expired", 401);
//     if (error.name === "JsonWebTokenError") return errorResponse("Invalid token", 401);
//     console.error(error);
//     return errorResponse(error.message || "Internal server error", 500);
//   }
// }

// function errorResponse(message: string, statusCode: number) {
//   return NextResponse.json({ status: "Error", message }, { status: statusCode });
// }

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

import { type NextRequest, NextResponse } from "next/server";

import { verify } from "jsonwebtoken";

import prisma from "@/libs/prisma";

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/jpg"]);

const allowedVideoTypes = new Set([
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/x-msvideo",
  "video/3gpp",
]);

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: number } }
// ) {
//   try {
//     // 🔐 Auth
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader) return errorResponse("Missing token", 401);

//     const token = authHeader.split(" ")[1];
//     const decoded: any = verify(token, process.env.NEXTAUTH_SECRET as string);

//     if (decoded.user_type !== "U" || decoded.role_id !== 1) {
//       return errorResponse("Forbidden", 403);
//     }

//     const batchId = params.id;

//     // ✅ Check batch ownership
//     const batch = await prisma.batches.findFirst({
//       where: { id: batchId, assessor: { id: Number(decoded.id) } },
//     });

//     if (!batch) return errorResponse("Batch not found", 404);

//     const searchParams = new URL(req.url).searchParams;

//     const individual = searchParams.get("individual") === "true";

//     const candidateId = searchParams.get("candidate_id");
//     const examType = searchParams.get("exam_type");

//     if (!examType) return errorResponse("exam_type is required", 400);

//     const isIndividual = !!candidateId;

//     const mediaFiles = await prisma.media_files.findMany({
//       where: {
//         batch_id: batchId,
//         candidate_id: isIndividual ? Number(candidateId) : null,
//         type: individual ? "photo" : undefined,
//       }
//   }
// }

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 Auth
    const authHeader = req.headers.get("authorization");

    if (!authHeader) return errorResponse("Missing token", 401);

    const token = authHeader.split(" ")[1];
    const decoded: any = verify(token, process.env.NEXTAUTH_SECRET as string);

    if (decoded.user_type !== "U" || decoded.role_id !== 1) {
      return errorResponse("Forbidden", 403);
    }

    const batchId = Number(params.id);

    // ✅ Check batch ownership
    const batch = await prisma.batches.findFirst({
      where: { id: batchId, assessor: { id: Number(decoded.id) } },
    });

    if (!batch) return errorResponse("Batch not found", 404);

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const groupId = formData.get("group_id") as string | null;
    const candidateId = formData.get("candidate_id") as string | null;
    const examType = formData.get("exam_type") as string;

    if (!examType) return errorResponse("exam_type is required", 400);
    if (!files || files.length === 0) return errorResponse("No files provided", 400);

    // Parallel validation of group/candidate
    const validations = [];

    if (groupId) {
      validations.push(
        prisma.student_groups.findFirst({
          where: { id: Number(groupId), batch_id: batchId },
        }).then((g) => {
          if (!g) throw new Error("Group not found in this batch");
        })
      );
    }

    if (candidateId) {
      validations.push(
        prisma.students.findFirst({
          where: { id: Number(candidateId), batch_id: batchId },
        }).then((c) => {
          if (!c) throw new Error("Candidate not found in this batch");
        })
      );
    }

    await Promise.all(validations);

    // Base upload directory
    const baseDir = path.join(
      process.cwd(),
      "storage",
      "uploads",
      "agency",
      "batches",
      `${batchId}`,
      `${examType}`
    );

    // Upload all files in parallel
    const uploadPromises = files.map(async (file) => {
      if (!(file instanceof File)) throw new Error("Invalid file");

      // Determine media type
      let mediaType: "photo" | "video";

      if (allowedPhotoTypes.has(file.type)) mediaType = "photo";
      else if (allowedVideoTypes.has(file.type)) mediaType = "video";
      else throw new Error(`Invalid file type: ${file.type}`);

      // Size limit
      const maxSize = mediaType === "photo" ? 5 * 1024 * 1024 : 20 * 1024 * 1024;

      if (file.size > maxSize) throw new Error(`${mediaType} exceeds max size`);

      // Folder path
      const uploadDir = groupId
        ? path.join(baseDir, "groups", groupId, mediaType + "s")
        : path.join(baseDir, "individual", candidateId!, mediaType + "s");

      await fsp.mkdir(uploadDir, { recursive: true });

      // Save file
      const ext = file.name.split(".").pop();
      const filename = `${randomUUID()}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      await pipeline(file.stream() as any, fs.createWriteStream(filePath));

      // Save in DB
      const media = await prisma.media_files.create({
        data: {
          batch_id: batchId,
          group_id: groupId ? Number(groupId) : null,
          candidate_id: candidateId ? Number(candidateId) : null,
          type: mediaType,
          filename,
          created_by: Number(decoded.id),
        },
      });

      return {
        id: media.id,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/storage/uploads/agency/batches/${batchId}/${examType}/` +
             (groupId
               ? `groups/${groupId}/${mediaType}s/${filename}`
               : `individual/${candidateId}/${mediaType}s/${filename}`),
      };
    });

    const results = await Promise.allSettled(uploadPromises);

    const success = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

      const failed = results
      .filter((r) => r.status === "rejected")
      .map((r: any) => r.reason.message);

    return NextResponse.json({
      status: "Success",
      message: `${success.length} files uploaded successfully`,
      uploaded: success,
      failed,
    });

  } catch (error: any) {
    if (error.name === "TokenExpiredError") return errorResponse("Token expired", 401);
    if (error.name === "JsonWebTokenError") return errorResponse("Invalid token", 401);
    console.error(error);

    return errorResponse(error.message || "Internal server error", 500);
  }
}

function errorResponse(message: string, statusCode: number) {
  return NextResponse.json({ status: "Error", message }, { status: statusCode });
}
