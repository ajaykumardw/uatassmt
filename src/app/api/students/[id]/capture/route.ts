import fs from 'fs';

import { randomUUID } from "crypto";

import { pipeline } from 'stream/promises';

import { Readable } from "stream";

import path from "path";

import { type NextRequest, NextResponse } from "next/server";

import { verify, type JwtPayload } from 'jsonwebtoken';

import prisma from '@/libs/prisma';

import { storageFolders } from "@/configs/customDataConfig";

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime"
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 10;

function errorResponse(message:string,status:number){
  return NextResponse.json(
    {
      status:"Error",
      statusCode: status,
      message
    },
    {status}
  );
}

const createDirectoryIfNotExist = (dir:string)=>{
  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir,{recursive:true});
  }
};

export async function POST(req:NextRequest){

  const authHeader =
    req.headers.get("authorization");

  if(!authHeader){
    return errorResponse(
      "Missing token",
      401
    );
  }

  const token =
    authHeader.split(" ")[1];

  try{

    const decoded =
      verify(
        token,
        process.env.NEXTAUTH_SECRET as string
      ) as JwtPayload;

    if(!decoded.candidate_id){
      return errorResponse(
        "Forbidden",
        403
      );
    }

    const formData =
      await req.formData();

    const files =
      formData.getAll("files") as File[];

    if(!files.length){
      return errorResponse(
        "Files required",
        400
      );
    }

    if(files.length > MAX_FILES){
      return errorResponse(
        "Too many files",
        400
      );
    }

    const studentId =
      Number(decoded.id);

    const batchId =
      decoded.batch_id;

    const uploadDir = path.join(
      process.cwd(),
      storageFolders.storage,
      storageFolders.uploads,
      storageFolders.agency,
      storageFolders.batches,
      batchId.toString(),
      storageFolders.student,
      studentId.toString(),
      storageFolders.captured
    );

    createDirectoryIfNotExist(uploadDir);

    const examResult =
      await prisma.student_exam_set_results.findFirst({
        where:{
          student_id:studentId
        },
        select:{
          id:true
        }
      });

    if(!examResult){
      return errorResponse(
        "Exam result not found",
        404
      );
    }

    const records:any = [];

    await Promise.all(

      files.map(async(file)=>{

        if(!allowedTypes.includes(file.type)){
          return;
        }

        const isImage =
          file.type.startsWith("image");

        const maxSize =
          isImage
            ? MAX_IMAGE_SIZE
            : MAX_VIDEO_SIZE;

        if(file.size > maxSize){
          return;
        }

        const ext =
          file.type.split("/")[1];

        const fileName =
          `${Date.now()}-${randomUUID()}.${ext}`;

        const filePath =
          path.join(uploadDir,fileName);

        const fileType =
          isImage
            ? "image"
            : "video";

        // STREAM WRITE
        const stream =
          Readable.fromWeb(
            file.stream() as any
          );

        await pipeline(
          stream,
          fs.createWriteStream(filePath)
        );

        records.push({

          student_id:studentId,

          student_exam_set_result_id:
            examResult.id,

          captured_image:fileName,

          file_type:fileType,

          mime_type:file.type,

          file_size:file.size,

          captured_time:new Date()

        });

      })

    );

    if(!records.length){
      return errorResponse(
        "No valid files",
        400
      );
    }

    // BULK INSERT (much faster)
    await prisma.student_captured_images.createMany({

      data:records

    });

    return NextResponse.json({

      status:"Success",
      statusCode:200,
      message:"Files uploaded",

    });

  }
  catch(error:any){

    if(error.name === "TokenExpiredError"){
      return errorResponse(
        "Token expired",
        401
      );
    }

    if(error.name === "JsonWebTokenError"){
      return errorResponse(
        "Invalid token",
        401
      );
    }

    console.error(error);

    return errorResponse(
      "Internal server error",
      500
    );

  }

}
