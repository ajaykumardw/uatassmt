import fs from 'fs';

import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

import path from "path";

import { type NextRequest, NextResponse } from "next/server";

import { verify, type JwtPayload } from 'jsonwebtoken';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

import { storageFolders } from "@/configs/customDataConfig";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  const authHeader = request.headers.get("authorization");

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

    if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const id = Number(params.id);

    const batch = await prisma.batches.findUnique({
      where: {
        id: id,
        assessor: {
          id: Number(decoded.id)
        }
      },
    })

    if (!batch) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Batch not found'
      }, { status: 404 });
    }

    const inspectionData = await prisma.inspection_media.findMany({
      where: {
        batch_id: id
      },
      include: {
        category: true
      }
    });

    if (inspectionData.length === 0) {
      return NextResponse.json({
        status: "Success",
        statusCode: 404,
        message: "No center inspection media found for this batch",
      }, { status: 404 });
    }

    const groupedData: Record<string, { id: number; url: string }[]> = {};

    const relativePath = path.posix.join(
      storageFolders.storage,
      storageFolders.uploads,
      storageFolders.agency,
      storageFolders.batches,
      id.toString(),
      storageFolders.centerInspection
    );

    inspectionData.forEach(item => {
      const categoryName = item.category.category_name;

      if (!groupedData[categoryName]) {
        groupedData[categoryName] = [];
      }

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
        relativePath,
        item.file_name
      )}`;

      groupedData[categoryName].push({
        id: item.id,
        url: url
      });
    });

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Center inspection media fetched successfully",
      data: groupedData
    });

  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error
      }, { status: 401 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error
      }, { status: 401 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: error.message,
        error: error
      }, { status: 400 });
    }

    // Fallback for any other server-side errors

    console.error('Server Error:', error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal server error',
      error: error
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  const authHeader = request.headers.get("authorization");

  const ip = request.headers.get('x-forwarded-for');


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

    // const agency_id = Number(decoded?.id);

    if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const formData = await request.formData();
    const { id } = params;

    // allowed keys
    const allowedKeys = [
      "building_photo_outside",
      "selfie_with_center",
      "selfie_with_center_board_evening",
      "center_video",
      "equipment_photo",
      "group_photo_before_batch_start",
      "center_facility",
      "class_room_photo",
      "it_lab_photo",
      "induction_kit",
      "biometric_device_photo",
      "trainer_aadhaar_photo",
      "trainer_tot_certificate",
      "group_photo_student",
      "group_photo_student_assessor",
      "group_photo_student_assessor_trainer",
      "group_photo_student_assessor_trainer_spoc",
      "manual_attendance_register",
      "tc_declaration_form",
      "joint_undertaking_assessor_spoc",
      "annexure_m1_m2",
      "annexure_n",
      "attendance_sheet",
      "biometric_attendance",
      "other_documents",
      "enrollment_form"
    ];

    const allowedMeta = [
      "latitude",
      "longitude",
      "city",
    ];

    // ----- extract only one key -----
    const keys = new Set<string>();

    // for (const [key] of formData.entries()) keys.add(key);
    for (const [key] of formData.entries()) {

      if (allowedKeys.includes(key)) {
        keys.add(key);
      }

      else if (!allowedMeta.includes(key)) {

        return NextResponse.json(
          {
            status: "Error",
            statusCode: 400,
            message: `Invalid field: ${key}`
          },
          { status: 400 }
        );

      }

    }

    if (keys.size !== 1) {
      return NextResponse.json(
        {
          status: "Error",
          statusCode: 400,
          message: "Only one key is allowed.",
          received: [...keys]
        },
        { status: 400 }
      );
    }

    const key = [...keys][0];

    if (!allowedKeys.includes(key)) {
      return NextResponse.json(
        { status: "Error", statusCode: 400, message: "Invalid key.", key },
        { status: 400 }
      );
    }

    // Define max file sizes
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

    // ----- process files -----
    // const outputs: string[] = [];

    const outputs: { id: number; url: string }[] = [];

    const files = formData.getAll(key);

    const relativePath = path.posix.join(
      storageFolders.storage,
      storageFolders.uploads,
      storageFolders.agency,
      storageFolders.batches,
      id.toString(),
      storageFolders.centerInspection
    );

    for (const file of files) {
      if (!(file instanceof Blob)) continue;

      // const arrayBuffer = await file.arrayBuffer();
      // const buffer = Buffer.from(arrayBuffer);

      // get extension from MIME type
      const ext = file.type.split("/")[1] || "bin";

      // Check file size
      const fileSize = file.size; // In bytes

      let maxSize = MAX_IMAGE_SIZE;  // Default to image size limit

      // validate file type based on the key
      let mediaType: "image" | "video" | "document" = "image";  // Default to image

      if (key === "center_video") {

        const allowedVideoTypes = ["mp4", "mov", "3gp"];

        maxSize = MAX_VIDEO_SIZE;  // Set max size for video files

        // Video files should only be mp4, mov, or other valid video types
        if (!allowedVideoTypes.includes(ext)) {

          return NextResponse.json({
            status: "Error",
            statusCode: 400,
            message: "Invalid video file type for center_video. Only mp4, mov, and 3gp are allowed.",
            received: ext,
          }, { status: 400 });
        }

        mediaType = "video";
      } else {

        // For other keys, only image files are allowed
        const allowedImageTypes = ["jpeg", "jpg", "png", "webp"];

        if (!allowedImageTypes.includes(ext)) {

          return NextResponse.json({
            status: "Error",
            statusCode: 400,
            message: `Invalid image file type for ${key}`,
            received: ext,
          }, { status: 400 });
        }
      }

      // File size check
      if (fileSize > maxSize) {

        return NextResponse.json({
          status: "Error",
          statusCode: 400,
          message: `File size exceeds the maximum allowed size. Max allowed size for ${mediaType} is ${mediaType === "video" ? "100 MB" : "5 MB"
            }.`,
          receivedSize: (fileSize / (1024 * 1024)).toFixed(2) + " MB",
        }, { status: 400 });
      }

      // generate secure unique filename
      const filename = `${randomUUID()}.${ext}`;

      const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches, id.toString(), storageFolders.centerInspection);

      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
        } catch (err) {
          console.error('Error creating upload directory:', err);
          throw new Error('Failed to create upload directory');
        }
      }

      // if (mediaType === "video") {
      //   // For videos, use streaming to avoid memory issues
      //   const filePath = path.join(uploadDir, filename);

      //   // 🚀 STREAM TO DISK (Memory Safe)
      //   await pipeline(
      //     file.stream() as any,
      //     createWriteStream(filePath)
      //   );

      //   // await new Promise((resolve, reject) => {
      //   //   writeStream.on('finish', resolve);
      //   //   writeStream.on('error', reject);
      //   //   writeStream.write(buffer);
      //   //   writeStream.end();
      //   // });
      // } else {
      //   // For images, we can safely write the buffer to disk

      //   fs.writeFileSync(
      //     path.resolve(uploadDir, filename),
      //     buffer
      //   )

      // }

      const filePath = path.join(uploadDir, filename);

      // 🚀 STREAM TO DISK (Memory Safe)
      await pipeline(
        file.stream() as any,
        fs.createWriteStream(filePath)
      );

      // const createdMedia = await prisma.categories.findFirst({
      //   where: {
      //     category_name: key
      //   },
      //   select: {
      //     id: true,
      //     category_name: true,
      //   }
      // }).then(async (category) => {
      //   if (category) {
      //     const createdMedia = await prisma.inspection_media.create({
      //       data: {
      //         category_id: category.id,
      //         batch_id: Number(id),
      //         assessor_id: decoded.id, // to be updated
      //         media_type: mediaType,
      //         file_name: filename,
      //         uploaded_by: decoded.id, // to be updated
      //       }
      //     });
      //     return createdMedia;
      //   }
      // });

      // // outputs.push(`${filename}`);
      // if (createdMedia) {
      //   const url = `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
      //     relativePath,
      //     filename
      //   )}`;
      //   outputs.push({
      //     id: createdMedia?.id,
      //     url: url
      //   });
      // }


      const latitude = formData.get("latitude") as string | null;
      const longitude = formData.get("longitude") as string | null;
      const city = formData.get("city") as string | null;

      const category = await prisma.categories.findFirst({
        where: {
          category_name: key,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        return NextResponse.json(
          {
            status: "Error",
            statusCode: 400,
            message: "Category not found",
          },
          { status: 400 }
        );
      }

      const createdMedia = await prisma.inspection_media.create({
        data: {
          category_id: category.id,
          batch_id: Number(id),
          assessor_id: decoded.id,
          media_type: mediaType,
          file_name: filename,
          uploaded_by: decoded.id,
          latitude: latitude,
          longitude: longitude,
          city: city,
          ip_address: ip || undefined
        },
        select: {
          id: true,
        },
      });

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
        relativePath,
        filename
      )}`;

      outputs.push({
        id: createdMedia.id,
        url,
      });
    }

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Files uploaded successfully.",
      key,
      uploaded: outputs,
    });

  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error
      }, { status: 401 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error
      }, { status: 401 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: error.message,
        error: error
      }, { status: 400 });
    }

    // Fallback for any other server-side errors

    console.error('Server Error:', error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal server error',
      error: error
    }, { status: 500 });
  }
}

