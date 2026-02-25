import fs from "fs";
import path from "path";

import { type NextRequest, NextResponse } from "next/server";

// import { verify, type JwtPayload } from "jsonwebtoken";


// Basic MIME type mapping for common file types
const mimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const relativePath = params.path.join("/");

    const fullPath = path.join(
      process.cwd(),
      "storage",
      "uploads",
      relativePath
    );

    if (!fs.existsSync(fullPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const isProduction = process.env.NODE_ENV === "production";

    // 🔐 Protect sensitive folders
    // const needsProtection =
    //   relativePath.includes("center-inspection") ||
    //   relativePath.includes("batches");

    // if (isProduction && needsProtection) {
    //   const authHeader = req.headers.get("authorization");

    //   if (!authHeader) {
    //     return new NextResponse("Unauthorized", { status: 401 });
    //   }

    //   const token = authHeader.split(" ")[1];

    //   const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    //   if (!decoded) {
    //     return new NextResponse("Unauthorized", { status: 401 });
    //   }

    //   // if (!["admin", "assessor"].includes(decoded.role)) {
    //   //   return new NextResponse("Forbidden", { status: 403 });
    //   // }
    // }


    // 🚀 PRODUCTION → Use X-Accel-Redirect
    if (isProduction) {
      const response = new NextResponse(null, { status: 200 });

      response.headers.set(
        "X-Accel-Redirect",
        `/protected-uploads/${relativePath}`
      );

      return response;
    }

    // // 🖥 LOCAL → Stream file normally
    // const stat = fs.statSync(fullPath);
    // const stream = fs.createReadStream(fullPath);

    // return new NextResponse(stream as any, {
    //   headers: {
    //     "Content-Length": stat.size.toString(),
    //   },
    // });

    // 🖥 LOCAL → Stream file normally
    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // 🎥 Range support for video/audio
    if (range && (contentType.startsWith("video") || contentType.startsWith("audio"))) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(fullPath, { start, end });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
        },
      });
    }

    // 📁 All other files
    const stream = fs.createReadStream(fullPath);

    return new NextResponse(stream as any, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      },
    });

  } catch (err) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}

// import fs from 'fs';
// import path from 'path';

// import { type NextRequest, NextResponse } from 'next/server';


// const storageFolders = {
//   storage: "storage",
//   uploads: "uploads",
//   ssc: "ssc",
//   agency: "agency",
//   users: "users",
//   student: "student",
//   captured: "captured",
//   batches: "batches",
//   centerPhoto: "center-photo",
//   buildingPhoto: "building-photo",
//   trainingResources: "training-resources",
//   centerInspection: "center-inspection",
//   images: "images",
// }

// // Basic MIME type mapping for common file types
// const mimeTypes: Record<string, string> = {
//   '.png': 'image/png',
//   '.jpg': 'image/jpeg',
//   '.jpeg': 'image/jpeg',
//   '.gif': 'image/gif',
//   '.svg': 'image/svg+xml',
//   '.webp': 'image/webp',
//   '.pdf': 'application/pdf',
//   '.txt': 'text/plain',
//   '.csv': 'text/csv',
//   '.json': 'application/json',
//   '.doc': 'application/msword',
//   '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//   '.xls': 'application/vnd.ms-excel',
//   '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   '.zip': 'application/zip',
//   '.mp4': 'video/mp4',
//   '.mp3': 'audio/mpeg',
// };

// export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
//   const filePath = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, ...params.path);

//   if (!fs.existsSync(filePath)) {
//     return new NextResponse('File not found', { status: 404 });
//   }

//   const fileBuffer = fs.readFileSync(filePath);

//   // Detect MIME type using file extension
//   const ext = path.extname(filePath).toLowerCase();
//   const mimeType = mimeTypes[ext] || 'application/octet-stream';

//   return new NextResponse(fileBuffer, {
//     headers: { 'Content-Type': mimeType },
//   });
// }
