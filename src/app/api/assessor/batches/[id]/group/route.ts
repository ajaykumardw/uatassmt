import fs from 'fs';
import path from 'path';

import { randomUUID } from 'crypto';

import { pipeline } from 'stream/promises';

// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import { verify, type JwtPayload } from 'jsonwebtoken';

// Data Imports
// import { getServerSession } from 'next-auth';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

// import { authOptions } from '@/libs/auth';

class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

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

//     if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
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

        if (decoded.user_type !== "U" || decoded.role_id !== 1) {
            return errorResponse("Forbidden: Insufficient permissions", 403);
        }

        const type = req.nextUrl.searchParams.get("type") || "practical";
        const groupId = req.nextUrl.searchParams.get("groupId");
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

        if (!["theory", "practical", "viva"].includes(type)) {
            return errorResponse("Invalid group type. Must be 'theory', 'practical', or 'viva'.", 400);
        }

        // let selectField;

        // if(type === "viva") {
        //     selectField = {
        //         viva_students: {
        //             select: {
        //                 id: true,
        //                 batch_id: true,
        //                 candidate_id: true,
        //                 candidate_name: true,
        //             }
        //         }
        //     }
        // }

        // if(type === "practical") {
        //     selectField = {
        //         practical_students: {
        //             select: {
        //                 id: true,
        //                 batch_id: true,
        //                 candidate_id: true,
        //                 candidate_name: true,
        //             }
        //         }
        //     }
        // }

        // if(type === "theory") {
        //     selectField = {
        //         theory_students: {
        //             select: {
        //                 id: true,
        //                 batch_id: true,
        //                 candidate_id: true,
        //                 candidate_name: true,
        //             }
        //         }
        //     }
        // }



        const selectField = type === "theory" ? {
            "theory_students": {
                select: {
                    id: true,
                    batch_id: true,
                    candidate_id: true,
                    candidate_name: true,
                }
            }
        } : type === "viva" ? {
            "viva_students": {
                select: {
                    id: true,
                    batch_id: true,
                    candidate_id: true,
                    candidate_name: true,
                }
            }
        } : {
            "practical_students": {
                select: {
                    id: true,
                    batch_id: true,
                    candidate_id: true,
                    candidate_name: true,
                }
            }
        };

        const groups = await prisma.student_groups.findMany({
            where: {
                batch_id: id,
                ...(groupId ? { id: Number(groupId) } : {group_type: String(type)})
            },
            select: {
                id: true,
                group_id: true,
                media_files: true,
                group_photo: true,
                group_video: true,
                group_type: true,
                ...(groupId 
                ? {
                    theory_students: { 
                        select: {
                            id: true, 
                            batch_id: true, 
                            candidate_id: true, 
                            candidate_name: true
                        } 
                    },
                    practical_students: { 
                        select: {
                            id: true, 
                            batch_id: true, 
                            candidate_id: true, 
                            candidate_name: true 
                        }
                    },
                    viva_students: { 
                        select: {
                            id: true, 
                            batch_id: true, 
                            candidate_id: true, 
                            candidate_name: true 
                        }
                    },
                }
                : selectField
                )

            }
        });

        const mappedGroups = groups.map(group => {
            const mappedGroup: any = {
                id: group.id,
                group_id: group.group_id,
                group_type: group.group_type,
            };

            if (group.media_files && group.media_files.length > 0) {
                mappedGroup.photo_urls = group.media_files.filter(file => file.type === "photo").map(file => `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
                    storageFolders.storage,
                    storageFolders.uploads,
                    storageFolders.agency,
                    storageFolders.batches,
                    id.toString(),
                    type,
                    "groups",
                    group.id.toString(),
                    "photos",
                    file.filename
                )}`);

                mappedGroup.video_urls = group.media_files.filter(file => file.type === "video").map(file => `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
                    storageFolders.storage,
                    storageFolders.uploads,
                    storageFolders.agency,
                    storageFolders.batches,
                    id.toString(),
                    type,
                    "groups",
                    group.id.toString(),
                    "videos",
                    file.filename
                )}`);
            } else {
              mappedGroup.photo_urls = [];
              mappedGroup.video_urls = [];
              mappedGroup.media_files = group.media_files; // Include media_files for debugging
            }

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

            if (group.group_type === "viva") {
                mappedGroup.students = group.viva_students;
            } else if (group.group_type === "practical") {
                mappedGroup.students = group.practical_students;
            } else if (group.group_type === "theory") {
                mappedGroup.students = group.theory_students;
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

        if (decoded.user_type !== "U" || decoded.role_id !== 1) {
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

        const groupExists = await prisma.student_groups.findFirst({
            where: {
                batch_id: id,
                group_id: String(formData.get('group_id') || 'A'),
                group_type: String(formData.get('group_type') || 'practical'),
            }
        });

        if (groupExists) {
            return errorResponse("Group with the same ID and type already exists in this batch.", 400);
        }

        // ----------------------------------------------------------
        // 📌 Read files (optional)
        // ----------------------------------------------------------
        const group_photo = formData.get("group_photo");

        // const group_video = formData.get("group_video");

        // const student_ids = formData.getAll('student_ids');
        const rawStudentIds = formData.get('student_ids');

        const group_id = formData.get('group_id') || 'A';
        const group_type = formData.get('group_type') || 'practical';


        if (!rawStudentIds) {
            return errorResponse("student_ids is required", 400);
        }

        let student_ids: number[];

        try {

            student_ids = JSON.parse(rawStudentIds.toString());

        } catch {

            return errorResponse("student_ids must be valid JSON like [1,2,5]", 400);
        }

        if (
            !Array.isArray(student_ids) ||
            student_ids.length === 0 ||
            !student_ids.every(id => typeof id === 'number')
        ) {

            return errorResponse("student_ids must be an array of numbers", 400);
        }

        // if(!student_ids || student_ids.length === 0) {
        //   return errorResponse("At least one student must be assigned to the group.", 400);
        // }

        // if (!group_photo) {
        //     return errorResponse("At least one photo must be provided.", 400);
        // }

        let groupPhotoName = null;

        // let groupVideoName = null;

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

            // group_photo is a Blob from formData
            const uploadPath = path.join(uploadDir, filename);

            // Stream directly to disk
            await pipeline(
              group_photo.stream() as any, // Node.js readable stream
              fs.createWriteStream(uploadPath)
            );


            // Write file
            // const buffer = Buffer.from(await group_photo.arrayBuffer());

            // fs.writeFileSync(path.resolve(uploadDir, filename), buffer);

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

        // if (group_video) {
        //   if (!(group_video instanceof File)) {
        //     return errorResponse("Invalid group video file.", 400);
        //   }

        //   if (!allowedMimeTypes.includes(group_video.type)) {
        //     return errorResponse("Group video must be a video file.", 400);
        //   }

        //   const ext = group_video.type.split("/")[1];
        //   const filename = `${randomUUID()}.${ext}`;


        //   const uploadDir = path.join(
        //     process.cwd(),
        //     storageFolders.storage,
        //     storageFolders.uploads,
        //     storageFolders.agency,
        //     storageFolders.batches,
        //     id.toString(),
        //     'group-video'
        //   );


        //   // Create folder if not exists
        //   if (!fs.existsSync(uploadDir)) {
        //     fs.mkdirSync(uploadDir, { recursive: true });
        //   }


        //   // Write file
        //   const buffer = Buffer.from(await group_video.arrayBuffer());

        //   fs.writeFileSync(path.resolve(uploadDir, filename), buffer);

        //   groupVideoName = filename;

        // }


        const group = await prisma.student_groups.create({
            data: {
                batch_id: id,
                group_id: String(group_id),
                group_type: String(group_type),
                group_photo: groupPhotoName,
                created_by: Number(decoded.id),
            }
        })

        if (group) {

            const data = formData.get('group_type') === 'theory' ? {
                theory_group_id: group.id,
            } : formData.get('group_type') === 'viva' ? {
                viva_group_id: group.id,
            } : formData.get('group_type') === 'practical' ? {
                practical_group_id: group.id,
            } : {};

            if (Object.keys(data).length === 0) {

                return errorResponse("Invalid group type. Must be 'theory', 'practical', or 'viva'.", 400);
            }

            await prisma.students.updateMany({
                where: {
                    batch_id: id,
                    id: {
                        in: student_ids
                    }
                },
                data: data
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

        // if (groupVideoName) {
        //   const relativeVideoPath = path.posix.join(
        //     storageFolders.storage,
        //     storageFolders.uploads,
        //     storageFolders.agency,
        //     storageFolders.batches,
        //     id.toString(),
        //     'group-video',
        //     groupVideoName
        //   );

        //   responseData.group_video_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativeVideoPath}`;
        // }

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

// export async function PATCH(
//   req: NextRequest,
//   context: { params: { id: number } }
// ) {
//   try {

//     // 🔐 Auth
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader) return errorResponse("Missing token", 401);

//     const token = authHeader.split(" ")[1];

//     const decoded = verify(
//       token,
//       process.env.NEXTAUTH_SECRET as string
//     ) as any;

//     if (decoded.user_type !== "U" || decoded.role_id !== 1) {

//       return errorResponse("Forbidden: Insufficient permissions", 403);
//     }

//     // Input
//     const batchId = Number(context.params.id);

//     const body = await req.json();

//     const { student_ids, group_id } = body;

//     if (
//       !Array.isArray(student_ids) ||
//       student_ids.length === 0 ||
//       !student_ids.every((id) => typeof id === "number")
//     ) {

//       return errorResponse("student_ids must be array of numbers", 400);
//     }

//     // 🔍 Fetch Group
//     const group = await prisma.student_groups.findUnique({
//       where: { id: group_id },
//       select: {
//         id: true,
//         batch_id: true,
//         group_type: true,
//       }
//     });

//     if (!group || group.batch_id !== batchId) {

//       return errorResponse("Group not found in this batch", 404);
//     }

//     const isViva = group.group_type === "viva";
//     const groupField = isViva ? "viva_group_id" : "practical_group_id";

//     const selectField = isViva
//       ? {
//           viva_students: {
//             select: {
//               id: true,
//               batch_id: true,
//               candidate_id: true,
//               candidate_name: true,
//             },
//           },
//         }
//       : {
//           practical_students: {
//             select: {
//               id: true,
//               batch_id: true,
//               candidate_id: true,
//               candidate_name: true,
//             },
//           },
//         };

//     // ⚡ Transaction
//     const [currentStudents] = await prisma.$transaction([
//       prisma.students.findMany({
//         where: {
//           batch_id: batchId,
//           [groupField]: group.id,
//         },
//         select: { id: true },
//       }),
//     ]);

//     const currentIds = currentStudents.map((s) => s.id);

//     // 🔴 Students to remove
//     const toRemove = currentIds.filter(
//       (id) => !student_ids.includes(id)
//     );

//     // 🟢 Students to add
//     const toAdd = student_ids.filter(
//       (id) => !currentIds.includes(id)
//     );

//     // ⚡ Perform update in transaction
//     const transactionalResult = await prisma.$transaction([
//       // Remove
//       prisma.students.updateMany({
//         where: {
//           id: { in: toRemove },
//           batch_id: batchId,
//           [groupField]: group.id,
//         },
//         data: {
//           [groupField]: null,
//         },
//       }),

//       // Add
//       prisma.students.updateMany({
//         where: {
//           id: { in: toAdd },
//           batch_id: batchId,
//           [groupField]: null,
//         },
//         data: {
//           [groupField]: group.id,
//         },
//       }),

//       // Return updated group
//       prisma.student_groups.findUnique({
//         where: { id: group.id },
//         select: {
//           id: true,
//           group_id: true,
//           group_photo: true,
//           group_video: true,
//           ...selectField,
//         },
//       }),
//     ]);

//     const updatedGroup = transactionalResult[2];

//     if (!updatedGroup) {

//       return errorResponse("Failed to fetch updated group", 500);
//     }

//     // 🔁 Map Response
//     const mappedGroup: any = {
//       id: updatedGroup.id,
//       group_id: updatedGroup.group_id,
//     };

//     if (updatedGroup.group_photo) {
//       const relativePhotoPath = path.posix.join(
//         storageFolders.storage,
//         storageFolders.uploads,
//         storageFolders.agency,
//         storageFolders.batches,
//         batchId.toString(),
//         "group-photo",
//         updatedGroup.group_photo
//       );

//       mappedGroup.group_photo_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativePhotoPath}`;
//     }

//     if (updatedGroup.group_video) {
//       const relativeVideoPath = path.posix.join(
//         storageFolders.storage,
//         storageFolders.uploads,
//         storageFolders.agency,
//         storageFolders.batches,
//         batchId.toString(),
//         "group-video",
//         updatedGroup.group_video
//       );

//       mappedGroup.group_video_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativeVideoPath}`;
//     }

//     mappedGroup.students = isViva
//       ? updatedGroup.viva_students
//       : updatedGroup.practical_students;

//     return NextResponse.json({
//       status: "Success",
//       message: "Students added to group successfully",
//       data: mappedGroup,
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

// export async function PATCH(
//   req: NextRequest,
//   context: { params: { id: number } }
// ) {
//   try {

//     // 🔐 Auth
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader) return errorResponse("Missing token", 401);

//     const token = authHeader.split(" ")[1];

//     const decoded = verify(
//       token,
//       process.env.NEXTAUTH_SECRET as string
//     ) as any;

//     // ✅ Allow ONLY user_type "U" AND role_id 1
//     if (decoded.user_type !== "U" || decoded.role_id !== 1) {
//       return errorResponse("Forbidden: Insufficient permissions", 403);
//     }

//     // Input
//     const batchId = Number(context.params.id);

//     const body = await req.json();

//     const { student_ids, group_id } = body;

//     if (
//       !Array.isArray(student_ids) ||
//       student_ids.length === 0 ||
//       !student_ids.every((id) => typeof id === "number")
//     ) {

//       return errorResponse("student_ids must be array of numbers", 400);
//     }

//     // 🔍 Fetch Group
//     const group = await prisma.student_groups.findUnique({
//       where: { id: group_id },
//       select: {
//         id: true,
//         batch_id: true,
//         group_type: true,
//       },
//     });

//     if (!group || group.batch_id !== batchId) {

//       return errorResponse("Group not found in this batch", 404);
//     }

//     const isViva = group.group_type === "viva";
//     const groupField = isViva ? "viva_group_id" : "practical_group_id";

//     const selectField = isViva
//       ? {
//           viva_students: {
//             select: {
//               id: true,
//               batch_id: true,
//               candidate_id: true,
//               candidate_name: true,
//               practical_group_id: true,
//               viva_group_id: true,
//             },
//           },
//         }
//       : {
//           practical_students: {
//             select: {
//               id: true,
//               batch_id: true,
//               candidate_id: true,
//               candidate_name: true,
//               practical_group_id: true,
//               viva_group_id: true,
//             },
//           },
//         };

//     // 🔎 Find current students in this group
//     const currentStudents = await prisma.students.findMany({
//       where: {
//         batch_id: batchId,
//         [groupField]: group.id,
//       },
//       select: { id: true },
//     });

//     const currentIds = currentStudents.map((s) => s.id);

//     // 🔴 Students to remove
//     const toRemove = currentIds.filter(
//       (id) => !student_ids.includes(id)
//     );

//     // 🟢 Students requested to add
//     const requestedToAdd = student_ids.filter(
//       (id) => !currentIds.includes(id)
//     );

//     // 🚨 Find students already assigned elsewhere
//     const conflictingStudents = await prisma.students.findMany({
//       where: {
//         id: { in: requestedToAdd },
//         batch_id: batchId,
//         NOT: {
//           [groupField]: null,
//         },
//       },
//       select: {
//         id: true,
//         candidate_name: true,
//         practical_group_id: true,
//         viva_group_id: true,
//       },
//     });

//     const conflictingIds = conflictingStudents.map((s) => s.id);

//     // ✅ Only valid students to add
//     const validToAdd = requestedToAdd.filter(
//       (id) => !conflictingIds.includes(id)
//     );

//     // ⚡ Transaction
//     const updatedGroup = await prisma.$transaction(async (tx) => {
//       // Remove students
//       if (toRemove.length > 0) {
//         await tx.students.updateMany({
//           where: {
//             id: { in: toRemove },
//             batch_id: batchId,
//             [groupField]: group.id,
//           },
//           data: {
//             [groupField]: null,
//           },
//         });
//       }

//       // Add valid students
//       if (validToAdd.length > 0) {
//         await tx.students.updateMany({
//           where: {
//             id: { in: validToAdd },
//             batch_id: batchId,
//           },
//           data: {
//             [groupField]: group.id,
//           },
//         });
//       }

//       return tx.student_groups.findUnique({
//         where: { id: group.id },
//         select: {
//           id: true,
//           group_id: true,
//           group_type: true,
//           group_photo: true,
//           group_video: true,
//           ...selectField,
//         },
//       });
//     });

//     if (!updatedGroup) {

//       return errorResponse("Failed to fetch updated group", 500);
//     }

//     // 🔁 Map Response
//     const mappedGroup: any = {
//       id: updatedGroup.id,
//       group_id: updatedGroup.group_id,
//       group_type: updatedGroup.group_type,
//     };

//     if (updatedGroup.group_photo) {
//       const relativePhotoPath = path.posix.join(
//         storageFolders.storage,
//         storageFolders.uploads,
//         storageFolders.agency,
//         storageFolders.batches,
//         batchId.toString(),
//         "group-photo",
//         updatedGroup.group_photo
//       );

//       mappedGroup.group_photo_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativePhotoPath}`;
//     }

//     if (updatedGroup.group_video) {
//       const relativeVideoPath = path.posix.join(
//         storageFolders.storage,
//         storageFolders.uploads,
//         storageFolders.agency,
//         storageFolders.batches,
//         batchId.toString(),
//         "group-video",
//         updatedGroup.group_video
//       );

//       mappedGroup.group_video_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativeVideoPath}`;
//     }

//     mappedGroup.students = isViva
//       ? updatedGroup.viva_students
//       : updatedGroup.practical_students;

//     return NextResponse.json({
//       status: "Success",
//       message: "Students processed successfully",
//       data: {
//         ...mappedGroup,
//         meta: {
//           added_count: validToAdd.length,
//           removed_count: toRemove.length,
//           skipped_count: conflictingStudents.length,
//           skipped_students: conflictingStudents,
//         },
//       },
//     });

//   } catch (error: any) {
//     if (error.name === "TokenExpiredError") {
//       return NextResponse.json(
//         {
//           status: "Error",
//           statusCode: 401,
//           message: "Token expired",
//         },
//         { status: 401 }
//       );
//     }

//     if (error.name === "JsonWebTokenError") {
//       return NextResponse.json(
//         {
//           status: "Error",
//           statusCode: 401,
//           message: "Invalid token",
//         },
//         { status: 401 }
//       );
//     }

//     console.error("Server Error:", error);

//     return NextResponse.json(
//       {
//         status: "Error",
//         statusCode: 500,
//         message: "Internal server error",
//       },
//       { status: 500 }
//     );
//   }
// }

export async function PATCH(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {

        // 🔐 Auth
        const authHeader = req.headers.get("authorization");

        if (!authHeader) return errorResponse("Missing token", 401);

        const token = authHeader.split(" ")[1];

        const decoded = verify(
            token,
            process.env.NEXTAUTH_SECRET as string
        ) as any;

        // ✅ Allow ONLY user_type "U" AND role_id 1
        if (decoded.user_type !== "U" || decoded.role_id !== 1) {

            return errorResponse("Forbidden: Insufficient permissions", 403);
        }

        // Input
        const batchId = Number(context.params.id);

        if (!batchId) return errorResponse("Invalid batch id", 400);

        const body = await req.json();

        const { student_ids, group_id } = body;

        if (!Array.isArray(student_ids) || student_ids.length === 0)
            return errorResponse("student_ids must be a non-empty array", 400);

        if (!group_id)
            return errorResponse("group_id is required", 400);

        // Remove duplicates
        const requestedIds: number[] = [...new Set(student_ids.map(Number))];

        // Validate group
        const group = await prisma.student_groups.findUnique({
            where: { id: Number(group_id) },
            select: {
                id: true,
                batch_id: true,
                group_type: true,
            },
        });

        if (!group || group.batch_id !== batchId) {

            return errorResponse("Group not found in this batch", 404);
        }

        const isTheory = group.group_type === "theory";
        const isViva = group.group_type === "viva";
        const isPractical = group.group_type === "practical";

        // const groupField =
        //     group.group_type === "viva"
        //         ? "viva_group_id"
        //         : "practical_group_id";

        const groupField = isTheory
            ? "theory_group_id"
            : isViva
                ? "viva_group_id"
                : "practical_group_id";


        const selectField = isTheory
            ? {
                theory_students: {
                    select: {
                        id: true,
                        batch_id: true,
                        candidate_id: true,
                        candidate_name: true,
                        practical_group_id: true,
                        viva_group_id: true,
                    },
                },
            }
            : isViva
            ? {
                viva_students: {
                    select: {
                        id: true,
                        batch_id: true,
                        candidate_id: true,
                        candidate_name: true,
                        practical_group_id: true,
                        viva_group_id: true,
                    },
                },
            }
            : isPractical
            ? {
                practical_students: {
                    select: {
                        id: true,
                        batch_id: true,
                        candidate_id: true,
                        candidate_name: true,
                        practical_group_id: true,
                        viva_group_id: true,
                    },
                },
            }
            : {};

        // Fetch students in one query (10k+ safe)
        const students = await prisma.students.findMany({
            where: { id: { in: requestedIds } },
            select: {
                id: true,
                batch_id: true,
                candidate_name: true,
                viva_group_id: true,
                practical_group_id: true,
                theory_group_id: true,
            },
        });

        const studentMap = new Map(students.map((s) => [s.id, s]));

        const toAssign: number[] = [];

        const added_students: any[] = [];
        const already_existing_students: any[] = [];
        const conflict_students: any[] = [];
        const different_batch_students: any[] = [];
        const not_found_students: any[] = [];

        for (const id of requestedIds) {
            const student = studentMap.get(id);

            // Not found
            if (!student) {
                not_found_students.push({
                    student_id: id,
                    reason: "Student not found",
                });
                continue;
            }

            // Different batch
            if (student.batch_id !== batchId) {
                different_batch_students.push({
                    student_id: id,
                    candidate_name: student.candidate_name,
                    actual_batch_id: student.batch_id,
                    reason: "Student belongs to a different batch",
                });
                continue;
            }

            const currentGroup = student[groupField];

            // Already in same group
            if (currentGroup === group.id) {
                already_existing_students.push({
                    student_id: id,
                    candidate_name: student.candidate_name,
                    reason: "Already assigned to this group",
                });
                continue;
            }

            // Assigned to another group
            if (currentGroup !== null) {
                conflict_students.push({
                    student_id: id,
                    candidate_name: student.candidate_name,
                    existing_group_id: currentGroup,
                    reason: "Already assigned to another group",
                });
                continue;
            }

            // Ready to assign
            toAssign.push(id);

            added_students.push({
                student_id: id,
                candidate_name: student.candidate_name,
                message: "Successfully added to group",
            });
        }

        // Bulk update (single DB query)
        if (toAssign.length > 0) {
            await prisma.students.updateMany({
                where: {
                    id: { in: toAssign },
                    batch_id: batchId,
                },
                data: {
                    [groupField]: group.id,
                },
            });
        }

        const updatedGroup = await prisma.student_groups.findUnique({
            where: { id: group.id },
            select: {
                id: true,
                group_id: true,
                group_type: true,
                group_photo: true,
                group_video: true,
                ...selectField,
            },
        });

        if (!updatedGroup) {

            return errorResponse("Failed to fetch updated group", 500);
        }

        // 🔁 Map Response
        const mappedGroup: any = {
            id: updatedGroup.id,
            group_id: updatedGroup.group_id,
            group_type: updatedGroup.group_type,
        };

        if (updatedGroup.group_photo) {
            const relativePhotoPath = path.posix.join(
                storageFolders.storage,
                storageFolders.uploads,
                storageFolders.agency,
                storageFolders.batches,
                batchId.toString(),
                "group-photo",
                updatedGroup.group_photo
            );

            mappedGroup.group_photo_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativePhotoPath}`;
        }

        if (updatedGroup.group_video) {
            const relativeVideoPath = path.posix.join(
                storageFolders.storage,
                storageFolders.uploads,
                storageFolders.agency,
                storageFolders.batches,
                batchId.toString(),
                "group-video",
                updatedGroup.group_video
            );

            mappedGroup.group_video_url = `${process.env.NEXT_PUBLIC_APP_URL}/${relativeVideoPath}`;
        }

        mappedGroup.students = isViva
            ? updatedGroup.viva_students
            : updatedGroup.practical_students;

        const totalAdded = added_students.length;
        const totalRequested = requestedIds.length;

        let resStatus = "Success";
        let resMessage = "All students added to group successfully.";
        let httpCode = 200;

        // Complete failure
        if (totalAdded === 0) {
            resStatus = "Success";
            resMessage = "No new students were added to the group.";
            httpCode = 200;
        }

        // Partial success
        else if (totalAdded < totalRequested) {
            resStatus = "Multi-Status";
            resMessage = "Student group sync completed with partial success.";
            httpCode = 207;
        }

        return NextResponse.json({
            status: resStatus,
            message: resMessage,
            data: {
                ...mappedGroup,
                group_id: group.id,
                group_type: group.group_type,

                summary: {
                    total_requested: requestedIds.length,
                    added_count: added_students.length,
                    already_existing_count: already_existing_students.length,
                    conflict_count: conflict_students.length,
                    different_batch_count: different_batch_students.length,
                    not_found_count: not_found_students.length,
                },

                results: [
                    ...added_students.map((s) => ({
                        ...s,
                        status: "added",
                    })),
                    ...already_existing_students.map((s) => ({
                        ...s,
                        status: "already_exists",
                    })),
                    ...conflict_students.map((s) => ({
                        ...s,
                        status: "conflict",
                    })),
                    ...different_batch_students.map((s) => ({
                        ...s,
                        status: "different_batch",
                    })),
                    ...not_found_students.map((s) => ({
                        ...s,
                        status: "not_found",
                    })),
                ],
            },
        }, { status: httpCode });
    } catch (error: any) {

        if (error.name === "TokenExpiredError") {
            return NextResponse.json(
                {
                    status: "Error",
                    statusCode: 401,
                    message: "Token expired",
                },
                { status: 401 }
            );
        }

        if (error.name === "JsonWebTokenError") {
            return NextResponse.json(
                {
                    status: "Error",
                    statusCode: 401,
                    message: "Invalid token",
                },
                { status: 401 }
            );
        }

        console.error("GROUP SYNC ERROR:", error);

        return errorResponse("Internal server error", 500);
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {

        /* ---------------- AUTH ---------------- */
        const authHeader = req.headers.get("authorization");

        if (!authHeader) return errorResponse("Missing token", 401);

        const token = authHeader.split(" ")[1];

        const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

        if (decoded.user_type !== "U" || decoded.role_id !== 1) {
            return errorResponse("Forbidden: Insufficient permissions", 403);
        }

        const batchId = Number(context.params.id);

        if (!batchId) return errorResponse("Invalid batch id", 400);

        const body = await req.json();
        const { student_ids, group_id } = body;

        if (!Array.isArray(student_ids) || student_ids.length === 0)
            return errorResponse("student_ids must be a non-empty array", 400);

        if (!group_id)
            return errorResponse("group_id is required", 400);

        const requestedIds: number[] = [...new Set(student_ids.map(Number))];

        // Validate group
        const group = await prisma.student_groups.findUnique({
            where: { id: Number(group_id) },
            select: {
                id: true,
                batch_id: true,
                group_type: true,
            },
        });

        if (!group || group.batch_id !== batchId)
            return errorResponse("Group not found in this batch", 404);

        const groupField =
            group.group_type === "theory"
                ? "theory_group_id"
                :
            group.group_type === "viva"
                ? "viva_group_id"
                : "practical_group_id";

        // Fetch ALL requested students (do NOT filter batch here)
        const students = await prisma.students.findMany({
            where: { id: { in: requestedIds } },
            select: {
                id: true,
                batch_id: true,
                candidate_name: true,
                viva_group_id: true,
                practical_group_id: true,
                theory_group_id: true,
            },
        });

        const studentMap = new Map(students.map((s) => [s.id, s]));

        const toRemove: number[] = [];

        const removed_students: any[] = [];
        const not_found_students: any[] = [];
        const different_batch_students: any[] = [];
        const not_in_group_students: any[] = [];

        for (const id of requestedIds) {
            const student = studentMap.get(id);

            // Not found
            if (!student) {
                not_found_students.push({
                    student_id: id,
                    reason: "Student not found",
                });
                continue;
            }

            // Different batch
            if (student.batch_id !== batchId) {
                different_batch_students.push({
                    student_id: id,
                    candidate_name: student.candidate_name,
                    actual_batch_id: student.batch_id,
                    reason: "Student belongs to a different batch",
                });
                continue;
            }

            const currentGroup = student[groupField];

            // Not in this group
            if (currentGroup !== group.id) {
                not_in_group_students.push({
                    student_id: id,
                    candidate_name: student.candidate_name,
                    reason: "Student is not assigned to this group",
                });
                continue;
            }

            // Ready to remove
            toRemove.push(id);

            removed_students.push({
                student_id: id,
                candidate_name: student.candidate_name,
                message: "Successfully removed from group",
            });
        }

        // Bulk update (single query)
        if (toRemove.length > 0) {
            await prisma.students.updateMany({
                where: {
                    id: { in: toRemove },
                    batch_id: batchId,
                    [groupField]: group.id, // safety check
                },
                data: {
                    [groupField]: null,
                },
            });
        }

        return NextResponse.json({
            status: "Success",
            message: "Student group removal completed",
            data: {
                group_id: group.id,
                group_type: group.group_type,

                summary: {
                    total_requested: requestedIds.length,
                    removed_count: removed_students.length,
                    not_found_count: not_found_students.length,
                    different_batch_count: different_batch_students.length,
                    not_in_group_count: not_in_group_students.length,
                },

                removed_students,
                not_found_students,
                different_batch_students,
                not_in_group_students,
            },
        });
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return errorResponse("Token expired", 401);
        }

        if (error.name === "JsonWebTokenError") {
            return errorResponse("Invalid token", 401);
        }

        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }

        console.error("GROUP REMOVE ERROR:", error);

        return errorResponse("Internal server error", 500);
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
