import fs from 'fs';
import path from 'path';

import { randomUUID } from 'crypto';

// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import { verify, type JwtPayload } from 'jsonwebtoken';

// Data Imports
// import { getServerSession } from 'next-auth';

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
  centerInspection: "center-inspection",
  images: "images",
}

// export async function GET(req: Request, context: { params: { id: number } }) {

//   const authHeader = req.headers.get("authorization");

//   if (!authHeader) {
//     return NextResponse.json({
//       status: 'Error',
//       statusCode: 401,
//       message: "Missing token"
//     }, { status: 401 });
//   }

//   const token = authHeader.split(" ")[1];

//   try {

//     const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

//     // const agency_id = Number(decoded?.id);

//     if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
//       return NextResponse.json({
//         status: 'Error',
//         statusCode: 403,
//         message: 'Forbidden: Insufficient permissions'
//       }, { status: 403 });
//     }

//     const batchId = Number(context.params.id);

//     const batch = await prisma.batches.findUnique({
//       where: {
//         id: batchId,
//         assessor: {
//           id: Number(decoded.id)
//         }
//       },
//     })

//     if (!batch) {
//       return NextResponse.json({
//         status: 'Error',
//         statusCode: 404,
//         message: 'Batch not found'
//       }, { status: 404 });
//     }

//     const centerAndBuildingPhoto = await prisma.inspection_media.findMany({
//       where: {
//         batch: {
//           id: batchId,
//           assessor_id: Number(decoded.id)
//         },
//         category: {
//           category_name: {
//             in: ['center_photo', 'building_photo']
//           }
//         }
//       },
//       include: {
//         category: true
//       }
//     });

//     if(centerAndBuildingPhoto.length === 0) {
//       return NextResponse.json({
//         status: "Error",
//         statusCode: 404,
//         message: "Center and building photos not found"
//       }, { status: 404 });
//     }

//     const groupedData: Record<string, { id: number; url: string }[]> = {};

//     const relativePath = `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}`;

//     centerAndBuildingPhoto.forEach(item => {
//       const categoryName = item.category.category_name;

//       if (!groupedData[categoryName]) {
//         groupedData[categoryName] = [];
//       }

//       groupedData[categoryName].push({
//         id: item.id,
//         url: `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
//           relativePath,
//           item.batch_id.toString(),
//           categoryName === "center_photo" ? "center-photo" : "building-photo",
//           item.file_name
//         )}`
//       });
//     });

//     // const mappedData = centerAndBuildingPhoto.map(item => ({
//     //   id: item.id,
//     //   category: item.category.category_name,
//     //   url: `${process.env.NEXT_PUBLIC_APP_URL}/storage/uploads/agency/batches/${item.batch_id}/${item.category.category_name === 'center_photo' ? 'center-photo' : 'building-photo'}/${item.file_name}`
//     // }));

//     return NextResponse.json({
//       status: "Success",
//       statusCode: 200,
//       message: "Center and building photos fetched successfully",
//       data: groupedData
//     });

//   } catch (error: any) {

//     if (error.name === 'TokenExpiredError') {
//       return NextResponse.json({
//         status: 'Error',
//         statusCode: 401,
//         message: 'Token expired',
//         error: error
//       }, { status: 401 });
//     }

//     if (error.name === 'JsonWebTokenError') {
//       return NextResponse.json({
//         status: 'Error',
//         statusCode: 401,
//         message: 'Invalid token',
//         error: error
//       }, { status: 401 });
//     }

//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       return NextResponse.json({
//         status: 'Error',
//         statusCode: 400,
//         message: error.message,
//         error: error
//       }, { status: 400 });
//     }

//     // Fallback for any other server-side errors

//     console.error('Server Error:', error);

//     return NextResponse.json({
//       status: 'Error',
//       statusCode: 500,
//       message: 'Internal server error',
//       error: error
//     }, { status: 500 });
//   }

// }

const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const allowedVideoMimeTypes = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/x-msvideo",
  "video/3gpp",
];

const allowedMimeTypes = [
  ...allowedImageMimeTypes,
  ...allowedVideoMimeTypes
];

export async function GET(req: NextRequest, context: { params: { id: number } }) {

  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return errorResponse("Missing token", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    if (decoded.user_type !== "U" && decoded.role_id !== 1) {
      return errorResponse("Forbidden: Insufficient permissions", 403);
    }

    const type = req.nextUrl.searchParams.get("type") || "practical";
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

    const selectField = type === "viva" ? {
      "viva_students": {
        select: {
          id: true,
          batch_id: true,
          candidate_id: true,
          candidate_name: true,
        }
      }
    } : {"practical_students": {
      select: {
        id: true,
        batch_id: true,
        candidate_id: true,
        candidate_name: true,
      }
    }};

    const groups = await prisma.student_groups.findMany({
      where: {
        batch_id: id,
        group_type: String(type),
      },
      select: {
        id: true,
        group_id: true,
        group_photo: true,
        group_video: true,
        ...selectField
      }
    });

    const mappedGroups = groups.map(group => {
      const mappedGroup: any = {
        id: group.id,
        group_id: group.group_id,
      };

      if (group.group_photo) {
        const relativePhotoPath = path.posix.join(
          storageFolders.storage,
          storageFolders.uploads,
          storageFolders.agency,
          storageFolders.batches,
          id.toString(),
          'group-photo',
          group.group_photo
        );

        mappedGroup.group_photo_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativePhotoPath}`;
      }

      if (group.group_video) {
        const relativeVideoPath = path.posix.join(
          storageFolders.storage,
          storageFolders.uploads,
          storageFolders.agency,
          storageFolders.batches,
          id.toString(),
          'group-video',
          group.group_video
        );

        mappedGroup.group_video_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativeVideoPath}`;
      }

      if (type === "viva") {
        mappedGroup.students = group.viva_students;
      } else {
        mappedGroup.students = group.practical_students;
      }

      return mappedGroup;
    });

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Groups fetched successfully.",
      data: mappedGroups,
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
    const group_photo = formData.get("group_photo");
    const group_video = formData.get("group_video");
    const student_ids = formData.getAll('student_ids');
    const group_id = formData.get('group_id') || 'A';
    const group_type = formData.get('group_type') || 'practical';

    if(!student_ids || student_ids.length === 0) {
      return errorResponse("At least one student must be assigned to the group.", 400);
    }

    if (!group_photo && !group_video) {
      return errorResponse("At least one photo or video must be provided.", 400);
    }

    let groupPhotoName = null;
    let groupVideoName = null;

    // ----------------------------------------------------------
    // 📌 Validate + Prepare Center Photo
    // ----------------------------------------------------------
    if (group_photo) {
      if (!(group_photo instanceof File)) {
        return errorResponse("Invalid group photo file.", 400);
      }

      if (!allowedMimeTypes.includes(group_photo.type)) {
        return errorResponse("Group photo must be an image.", 400);
      }

      const ext = group_photo.type.split("/")[1];

      const filename = `${randomUUID()}.${ext}`;

      const uploadDir = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        id.toString(),
        'group-photo'
      );


      // Create folder if not exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }


      // Write file
      const buffer = Buffer.from(await group_photo.arrayBuffer());

      fs.writeFileSync(path.resolve(uploadDir, filename), buffer);

      groupPhotoName = filename;

      // filesToProcess.push({
      //   blob: group_photo,
      //   original: group_photo.name,
      //   name: filename,
      //   category: "group_photo",
      //   dir: "group-photo",
      // });
    }

    // ----------------------------------------------------------
    // 📌 Validate + Prepare Building Photo
    // ----------------------------------------------------------

    if (group_video) {
      if (!(group_video instanceof File)) {
        return errorResponse("Invalid group video file.", 400);
      }

      if (!allowedMimeTypes.includes(group_video.type)) {
        return errorResponse("Group video must be a video file.", 400);
      }

      const ext = group_video.type.split("/")[1];
      const filename = `${randomUUID()}.${ext}`;


      const uploadDir = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        id.toString(),
        'group-video'
      );


      // Create folder if not exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }


      // Write file
      const buffer = Buffer.from(await group_video.arrayBuffer());

      fs.writeFileSync(path.resolve(uploadDir, filename), buffer);

      groupVideoName = filename;

    }


    const group = await prisma.student_groups.create({
      data: {
        batch_id: id,
        group_id: String(group_id),
        group_type: String(group_type),
        group_photo: groupPhotoName,
        group_video: groupVideoName,
        created_by: Number(decoded.id),
      }
    })

    if (group){
      await prisma.students.updateMany({
        where: {
          batch_id: id,
          id: {
            in: formData.getAll('student_ids').map(Number)
          }
        },
        data: {
          practical_group_id: group.id,
        }
      })
    }

    // ----------------------------------------------------------
    // 📌 Build response object dynamically
    // ----------------------------------------------------------
    const responseData: any = {};

    if (groupPhotoName) {
      const relativePhotoPath = path.posix.join(
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        id.toString(),
        'group-photo',
        groupPhotoName
      );

      responseData.group_photo_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativePhotoPath}`;
    }

    if (groupVideoName) {
      const relativeVideoPath = path.posix.join(
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        id.toString(),
        'group-video',
        groupVideoName
      );

      responseData.group_video_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativeVideoPath}`;
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
