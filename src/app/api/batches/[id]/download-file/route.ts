// // /app/api/batch/[id]/download-stream/route.ts
import { type NextRequest, NextResponse } from "next/server";
// import prisma from "@/libs/prisma";
// import path from "path";
// import fs from "fs";
// import archiver from "archiver";
// import { verify, type JwtPayload } from "jsonwebtoken";

export async function GET(
    request: NextRequest,
) {
    return NextResponse.json({
        status: "Error",
        statusCode: 501,
        message: "Not implemented"
    }, { status: 501 });
}

// export async function GET(

//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const authHeader = request.headers.get("authorization");
//   if (!authHeader) {
//     return NextResponse.json(
//       { status: "Error", statusCode: 401, message: "Missing token" },
//       { status: 401 }
//     );
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

//     if (decoded.user_type !== "U" || decoded.role_id !== 1) {
//       return NextResponse.json(
//         { status: "Error", statusCode: 403, message: "Forbidden" },
//         { status: 403 }
//       );
//     }

//     const batchId = Number(params.id);

//     // Optional query params for conditional download
//     const url = new URL(request.url);
//     const categoriesParam = url.searchParams.get("categories"); // comma-separated
//     const mediaType = url.searchParams.get("mediaType") as "image" | "video"; // "image" | "video"

//     const selectedCategories = categoriesParam ? categoriesParam.split(",") : undefined;

//     const files = await prisma.inspection_media.findMany({
//       where: {
//         batch_id: batchId,
//         ...(selectedCategories && {
//           category: { category_name: { in: selectedCategories } },
//         }),
//         ...(mediaType && { media_type: mediaType }),
//       },
//       include: { category: true },
//       // where: {
//       //   batch_id: batchId,
//       //   ...(selectedCategories && {
//       //     category: { category_name: { in: selectedCategories } },
//       //   }),
//       //   ...(mediaType && { media_type: mediaType }),
//       // },
//       // include: { category: true },
//     });

//     if (!files.length) {
//       return NextResponse.json(
//         { status: "Error", statusCode: 404, message: "No files found for this batch with the given filters" },
//         { status: 404 }
//       );
//     }

//     const zipName = `batch_${batchId}.zip`;

//     const { readable, writable } = new TransformStream();
//     const writer = writable.getWriter();

//     const stream = new Response(readable, {
//       headers: {
//         "Content-Type": "application/zip",
//         "Content-Disposition": `attachment; filename=${zipName}`,
//       },
//     });

//     const archive = archiver("zip", { zlib: { level: 9 } });

//     // Pipe archiver data to writer
//     archive.on("data", async (chunk: Buffer) => writer.write(chunk));
//     archive.on("end", () => writer.close());
//     archive.on("error", (err: Error) => writer.abort(err));

//     // Add files in parallel
//     await Promise.all(
//       files.map(async (file) => {
//         const fullPath = path.join(
//           process.cwd(),
//           "storage",
//           "uploads",
//           "agency",
//           "batches",
//           batchId.toString(),
//           "center-inspection",
//           file.file_name
//         );

//         if (!fs.existsSync(fullPath)) return;

//         // Use stream for each file (memory efficient)
//         archive.append(fs.createReadStream(fullPath), {
//           name: `${file.category.category_name}/${file.file_name}`,
//         });
//       })
//     );

//     archive.finalize();

//     return stream;
//   } catch (error: any) {
//     if (error.name === "TokenExpiredError") {
//       return NextResponse.json({ status: "Error", statusCode: 401, message: "Token expired", error });
//     }
//     if (error.name === "JsonWebTokenError") {
//       return NextResponse.json({ status: "Error", statusCode: 401, message: "Invalid token", error });
//     }
//     console.error("Server Error:", error);
//     return NextResponse.json(
//       { status: "Error", statusCode: 500, message: "Internal server error", error },
//       { status: 500 }
//     );
//   }
// }
