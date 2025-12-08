import fs from 'fs';

import { randomUUID } from "crypto";

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

    if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
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

      if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
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
        "selfie_with_center",
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
      ];

      // ----- extract only one key -----
      const keys = new Set<string>();

      for (const [key] of formData.entries()) keys.add(key);

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

      // ----- process files -----
      const outputs: string[] = [];

      const files = formData.getAll(key);

      for (const file of files) {
        if (!(file instanceof Blob)) continue;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // get extension from MIME type
        const ext = file.type.split("/")[1] || "bin";

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

        fs.writeFileSync(
          path.resolve(uploadDir, filename),
          buffer
        )

        await prisma.categories.findFirst({
          where: {
            category_name: key
          },
          select: {
            id: true,
            category_name: true,
          }
        }).then(async (category) => {
          if (category) {
            await prisma.inspection_media.create({
              data: {
                category_id: category.id,
                batch_id: Number(id),
                assessor_id: decoded.id, // to be updated
                media_type: ext === 'mp4' || ext === 'mov' ? 'video' : (ext === 'pdf' ? 'document' : 'image'),
                file_name: filename,
                uploaded_by: decoded.id, // to be updated
              }
            });
          }
        });

        outputs.push(`${filename}`);
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

