import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import { verify, type JwtPayload } from 'jsonwebtoken';

// Data Imports
// import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

// import { authOptions } from '@/libs/auth';

const storageFolders = {
  storage: "storage",
  uploads: "uploads",
  ssc: "ssc",
  agency: "agency",
  users: "users",
  student: "student",
  captured: "captured",
  batches: "batches",
  centerPhoto: "center-photo",
  buildingPhoto: "building-photo",
  trainingResources: "training-resources",
}

export async function GET(req: Request, context: { params: { id: number } }) {

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

    // const agency_id = Number(decoded?.id);

    if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const batchId = Number(context.params.id);

    const batch = await prisma.batches.findUnique({
      where: {
        id: batchId,
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

    const centerAndBuildingPhoto = await prisma.inspection_media.findMany({
      where: {
        batch: {
          assessor_id: Number(decoded.id)
        },
        category: {
          category_name: {
            in: ['center_photo', 'building_photo']
          }
        }
      },
      include: {
        category: true
      }
    });

    if(centerAndBuildingPhoto.length === 0) {
      return NextResponse.json({
        status: "Error",
        statusCode: 404,
        message: "Center and building photos not found"
      }, { status: 404 });
    }

    const groupedData: Record<string, { id: number; url: string }[]> = {};

    const relativePath = `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}`;

    centerAndBuildingPhoto.forEach(item => {
      const categoryName = item.category.category_name;

      if (!groupedData[categoryName]) {
        groupedData[categoryName] = [];
      }

      groupedData[categoryName].push({
        id: item.id,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
          relativePath,
          item.batch_id.toString(),
          categoryName === "center_photo" ? "center-photo" : "building-photo",
          item.file_name
        )}`
      });
    });

    // const mappedData = centerAndBuildingPhoto.map(item => ({
    //   id: item.id,
    //   category: item.category.category_name,
    //   url: `${process.env.NEXT_PUBLIC_APP_URL}/storage/uploads/agency/batches/${item.batch_id}/${item.category.category_name === 'center_photo' ? 'center-photo' : 'building-photo'}/${item.file_name}`
    // }));

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Center and building photos fetched successfully",
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

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/gif",
];

export async function POST(req: NextRequest, context: { params: { id: number } }) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return errorResponse("Missing token", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as any;

    if (decoded.user_type !== "U" && decoded.role_id !== 1) {
      return errorResponse("Forbidden: Insufficient permissions", 403);
    }

    const formData = await req.formData();
    const id = Number(context.params.id);

    const batch = await prisma.batches.findUnique({
      where: {
        id: id,
        assessor: {
          id: Number(decoded.id),
        },
      },
    });

    if (!batch) {
      return errorResponse("Batch not found", 404);
    }

    // ----------------------------------------------------------
    // 📌 Read files (optional)
    // ----------------------------------------------------------
    const center_photo = formData.get("center_photo");
    const building_photo = formData.get("building_photo");

    if (!center_photo && !building_photo) {
      return errorResponse("At least one photo must be provided.", 400);
    }

    const filesToProcess: any[] = [];

    // ----------------------------------------------------------
    // 📌 Validate + Prepare Center Photo
    // ----------------------------------------------------------
    if (center_photo) {
      if (!(center_photo instanceof File)) {
        return errorResponse("Invalid center photo file.", 400);
      }

      if (!allowedMimeTypes.includes(center_photo.type)) {
        return errorResponse("Center photo must be an image.", 400);
      }

      filesToProcess.push({
        blob: center_photo,
        original: center_photo.name,
        name: getTime(new Date()) + "_" + center_photo.name,
        category: "center_photo",
        dir: storageFolders.centerPhoto,
      });
    }

    // ----------------------------------------------------------
    // 📌 Validate + Prepare Building Photo
    // ----------------------------------------------------------
    if (building_photo) {
      if (!(building_photo instanceof File)) {
        return errorResponse("Invalid building photo file.", 400);
      }

      if (!allowedMimeTypes.includes(building_photo.type)) {
        return errorResponse("Building photo must be an image.", 400);
      }

      filesToProcess.push({
        blob: building_photo,
        original: building_photo.name,
        name: getTime(new Date()) + "_" + building_photo.name,
        category: "building_photo",
        dir: storageFolders.buildingPhoto,
      });
    }

    // ----------------------------------------------------------
    // 📌 Insert categories lookup
    // ----------------------------------------------------------
    const categories = await prisma.categories.findMany({
      where: {
        category_name: { in: ["center_photo", "building_photo"] },
      },
      select: { id: true, category_name: true },
    });

    const categoryMap = Object.fromEntries(categories.map((c) => [c.category_name, c.id]));

    // ----------------------------------------------------------
    // 📌 Upload files to storage + Create DB rows
    // ----------------------------------------------------------
    const tasks = [];

    for (const file of filesToProcess) {
      const uploadDir = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        id.toString(),
        file.dir
      );

      // Create folder if not exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Write file
      const buffer = Buffer.from(await file.blob.arrayBuffer());

      fs.writeFileSync(path.resolve(uploadDir, file.name), buffer);

      // DB entry
      tasks.push(
        prisma.inspection_media.create({
          data: {
            category_id: categoryMap[file.category],
            batch_id: id,
            assessor_id: Number(decoded.id),
            media_type: "image",
            file_name: file.name,
            uploaded_by: Number(decoded.id),
          },
        })
      );
    }

    await Promise.all(tasks);

    // ----------------------------------------------------------
    // 📌 Build response object dynamically
    // ----------------------------------------------------------
    const responseData: any = {};

    for (const file of filesToProcess) {
      responseData[file.category] = `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}/${id}/${file.dir}/${file.name}`;
    }

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Photos uploaded successfully.",
      data: responseData,
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

function errorResponse(message: string, statusCode: number, error?: any) {
  return NextResponse.json(
    {
      status: "Error",
      statusCode,
      message,
      error,
    },
    { status: statusCode }
  );
}
