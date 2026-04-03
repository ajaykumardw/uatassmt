import fs from 'fs';

import { randomUUID } from "crypto";

import { pipeline } from 'stream/promises';

import path from "path";

import { type NextRequest, NextResponse } from "next/server";

import { verify, type JwtPayload } from 'jsonwebtoken';

import prisma from '@/libs/prisma';

import { storageFolders } from "@/configs/customDataConfig";

// Allowed MIME types for images
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/gif"
];

// Helper function for error responses
function errorResponse(message: string, statusCode: number) {
  return NextResponse.json(
    {
      status: "Error",
      statusCode,
      message,
    },
    { status: statusCode }
  );
}

// Helper function to create a directory if it doesn't exist
const createDirectoryIfNotExist = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper function to validate file types and size
const validateFile = (file: Blob, allowedTypes: string[], maxSize: number) => {
  const ext = file.type.split("/")[1];
  const fileSize = file.size;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`);
  }

  if (fileSize > maxSize) {
    throw new Error(`File size exceeds the maximum allowed size of ${maxSize / 1024 / 1024} MB`);
  }

  return ext;
};

// export async function GET(request: NextRequest) {

//     // const authHeader = request.headers.get("authorization");

//     // if (!authHeader) {
//     //     return NextResponse.json({
//     //         status: 'Error',
//     //         statusCode: 401,
//     //         message: "Missing token"
//     //     }, { status: 401 });
//     // }

//     // const token = authHeader.split(" ")[1];

//     // try {

//     //     const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

//     //     const studentId = Number(decoded.id);

//     //     if (!decoded.candidate_id) {
//     //         return NextResponse.json({
//     //             status: 'Error',
//     //             statusCode: 403,
//     //             message: 'Forbidden: Insufficient permissions'
//     //         }, { status: 403 });
//     //     }

//     //     const student = await prisma.students.findUnique({
//     //         where: {
//     //             id: studentId,
//     //         },
//     //         select: {
//     //             id: true,
//     //             batch_id: true,
//     //             candidate_id: true,
//     //             user_name: true,
//     //             candidate_name: true,
//     //             image: true,
//     //             id_front_image: true,
//     //             id_back_image: true,
//     //             gender: true,
//     //             category: true,
//     //             date_of_birth: true,
//     //             mobile_no: true,
//     //             attendance: true,
//     //         }
//     //     });

//     //     if (!student) {

//     //         return NextResponse.json({
//     //             status: 'Error',
//     //             statusCode: 404,
//     //             message: 'Student not found'
//     //         }, { status: 404 });
//     //     }

//     //     const relativePath = path.posix.join(
//     //         storageFolders.storage,
//     //         storageFolders.uploads,
//     //         storageFolders.agency,
//     //         storageFolders.batches,
//     //         student.batch_id.toString(),
//     //         storageFolders.student,
//     //         studentId.toString(),
//     //         storageFolders.images
//     //     );

//     //     const mappedStudent = {
//     //         ...student,
//     //         image: student.image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.image}` : null,
//     //         id_front_image: student.id_front_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.id_front_image}` : null,
//     //         id_back_image: student.id_back_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.id_back_image}` : null,
//     //     }

//     //     return NextResponse.json({
//     //         status: "Success",
//     //         statusCode: 200,
//     //         message: "Attendance data retrieved successfully.",
//     //         data: mappedStudent,
//     //     });

//     // } catch (error: any) {

//     //     if (error.name === 'TokenExpiredError') {
//     //         return NextResponse.json({
//     //             status: 'Error',
//     //             statusCode: 401,
//     //             message: 'Token expired',
//     //             error: error
//     //         }, { status: 401 });
//     //     }

//     //     if (error.name === 'JsonWebTokenError') {
//     //         return NextResponse.json({
//     //             status: 'Error',
//     //             statusCode: 401,
//     //             message: 'Invalid token',
//     //             error: error
//     //         }, { status: 401 });
//     //     }

//     //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//     //         return NextResponse.json({
//     //             status: 'Error',
//     //             statusCode: 400,
//     //             message: error.message,
//     //             error: error
//     //         }, { status: 400 });
//     //     }

//     //     // Fallback for any other server-side errors

//     //     console.error('Server Error:', error);

//     //     return NextResponse.json({
//     //         status: 'Error',
//     //         statusCode: 500,
//     //         message: 'Internal server error',
//     //         error: error
//     //     }, { status: 500 });
//     // }
// }


export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    if (!decoded.candidate_id) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const formData = await req.formData();

    const batchId = decoded.batch_id;
    const studentId = Number(decoded.id);
    const batch = await prisma.students.findUnique({
      where: {
        id: studentId
      },
      select: {
        batch_id: true
      }
    });

    const timestamp = getTime(new Date());
    const imageName = `${timestamp}.jpg`;

    const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches, batchId.toString(), storageFolders.student, studentId.toString(), storageFolders.captured);

    const imageBuffer = Buffer.from(captured_image.split(',')[1], 'base64');

    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error creating upload directory:', err);
        throw new Error('Failed to create upload directory');
      }
    }

    fs.writeFileSync(
      path.resolve(uploadDir, imageName),
      imageBuffer
    );

    const studentExamSetResult = await prisma.student_exam_set_results.findFirst({
      where: {
        student_id: studentId
      },
      select: {
        id: true
      }
    });

    const result = await prisma.student_captured_images.create({
      data: {
        student_id: studentId,
        student_exam_set_result_id: studentExamSetResult ? studentExamSetResult.id : 0,
        captured_image: imageName,
        captured_time: new Date()
      }
    })

    if (result) {

      return NextResponse.json({ message: 'Student Captured Image added successfully!' })

    }
    else {

      return NextResponse.json({ message: 'Student Captured Image not stored' }, { status: 500 })

    }
  } catch (error: any) {

    if(error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error.message
      }, { status: 401 });
    }

    if(error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error.message
      }, { status: 401 });
    }

    console.error('Error capturing student image:', error);
    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });

  }

}
