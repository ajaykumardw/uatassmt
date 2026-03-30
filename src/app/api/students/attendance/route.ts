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

export async function POST(
    request: NextRequest,
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

        if (!decoded.candidate_id) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 403,
                message: 'Forbidden: Insufficient permissions'
            }, { status: 403 });
        }

        const batchId = decoded.batch_id;
        const studentId = Number(decoded.id);

        const student = await prisma.students.findUnique({
            where: {
                id: studentId,
                batch_id: batchId,
            },
            select: {
                id: true,
                batch_id: true,
                candidate_id: true,
                user_name: true,
                candidate_name: true,
                image: true,
                id_front_image: true,
                id_back_image: true,
            }
        });

        if (!student) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'Student not found'
            }, { status: 404 });
        }

        const formData = await request.formData();
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

        // Initialize files to process array
        const filesToProcess = [];

        // Files and their keys for processing
        const files = [
            { key: "image", file: formData.get("image") },
            { key: "id_front_image", file: formData.get("id_front_image") },
            { key: "id_back_image", file: formData.get("id_back_image") },
        ];

        // Validate and prepare files
        for (const { key, file } of files) {
            if (file) {
                if (!(file instanceof File)) {
                    return errorResponse(`${key} is invalid.`, 400);
                }

                // Check if the student already has an image in the database
                const student = await prisma.students.findUnique({
                    where: {
                        id: studentId,
                        batch_id: batchId,
                    },
                    select: {
                        [key]: true, // Retrieve the image field (image, id_front_image, or id_back_image)
                    }
                });

                // If the image exists in the database, skip file upload and database update
                if (student && student[key]) {
                    console.log(`File for ${key} already exists. Skipping upload.`);
                    filesToProcess.push({
                        file,
                        filename: student[key],
                        key,
                        exists: true, // Mark as existing file in the database
                    });
                } else {
                    // Validate file type and size if it doesn't exist in the database
                    const ext = validateFile(file, allowedMimeTypes, MAX_IMAGE_SIZE);

                    // Generate a unique filename
                    const filename = `${randomUUID()}.${ext}`;

                    filesToProcess.push({
                        file,
                        filename,
                        key,
                        exists: false, // New file, needs upload
                    });
                }
            }
        }

        // Prepare upload directory
        const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches, batchId.toString(), storageFolders.student, studentId.toString(), storageFolders.images);

        createDirectoryIfNotExist(uploadDir);

        // Process each file
        for (const { file, filename, key, exists } of filesToProcess) {
            if (exists) {
                // If the file already exists, skip the file upload and database update
                continue;
            }

            // const arrayBuffer = await file.arrayBuffer();
            // const buffer = Buffer.from(arrayBuffer);

            // // Write the file to disk
            // fs.writeFileSync(path.resolve(uploadDir, filename as string), buffer);

            const filePath = path.resolve(uploadDir, filename as string);

            // Stream write (better than buffer)
            await pipeline(
                file.stream() as unknown as NodeJS.ReadableStream,
                fs.createWriteStream(filePath)
            );

            // Update database
            await prisma.students.update({
                where: {
                    id: studentId,
                    batch_id: batchId,
                },
                data: {
                    [key]: filename,
                    ...(key === "image" && { attendance: 1 })
                },
            });
        }

        const relativePath = path.posix.join(
            storageFolders.storage,
            storageFolders.uploads,
            storageFolders.agency,
            storageFolders.batches,
            batchId.toString(),
            storageFolders.student,
            studentId.toString(),
            storageFolders.images
        );

        return NextResponse.json({
            status: "Success",
            statusCode: 200,
            message: "Attendance recorded successfully.",
            data: filesToProcess.map(f => ({ key: f.key, filename: `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(relativePath, f.filename as string)}` })),
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


        console.error('Error processing request:', error);

        return NextResponse.json({
            status: "Error",
            statusCode: error.statusCode || 500,
            message: error.message || "Internal server error",
        }, { status: error.statusCode || 500 });
    }
}

// Improved DELETE function with async file operations and enhanced error handling
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; studentId: string } }
) {
    const batchId = Number(params.id);
    const studentId = Number(params.studentId);
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

        const requestBody = await request.json().catch(err => {
            if (err) {

                return null;  // Handle empty body case or malformed JSON
            }
        });

        if (!requestBody) {

            return NextResponse.json({
                status: "Error",
                statusCode: 400,
                message: "Request body is missing or invalid JSON",
            }, { status: 400 });
        }

        const { key } = requestBody;  // Access key from body

        // Validate the key provided in form data
        if (!key || !["image", "id_front_image", "id_back_image"].includes(key)) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 400,
                message: 'Invalid key provided for deletion.'
            }, { status: 400 });
        }

        // Fetch the student data
        const student = await prisma.students.findUnique({
            where: {
                id: studentId,
                batch_id: batchId,
            },
            select: {
                image: true,
                id_front_image: true,
                id_back_image: true,
            }
        });

        if (!student) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'File not found for the specified student.'
            }, { status: 404 });
        }

        if (key === "image" && !student.image) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'No image file to delete.'
            }, { status: 404 });
        }

        if (key === "id_front_image" && !student.id_front_image) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'No front ID image file to delete.'
            }, { status: 404 });
        }

        if (key === "id_back_image" && !student.id_back_image) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'No back ID image file to delete.'
            }, { status: 404 });
        }

        // Construct the file path for deletion
        const filePath = path.join(
            process.cwd(),
            storageFolders.storage,
            storageFolders.uploads,
            storageFolders.agency,
            storageFolders.batches,
            batchId.toString(),
            storageFolders.student,
            studentId.toString(),
            storageFolders.images,
            key === "image" ? student.image! : key === "id_front_image" ? student.id_front_image! : student.id_back_image!
        );

        // Asynchronous file deletion
        try {
            // Check if the file exists asynchronously
            await fs.promises.access(filePath, fs.constants.F_OK);
            await fs.promises.unlink(filePath); // Delete the file
        } catch (err) {
            console.error('Error deleting file:', err);

            return NextResponse.json({
                status: 'Error',
                statusCode: 500,
                message: `Failed to delete file: ${key === "image" ? student.image! : key === "id_front_image" ? student.id_front_image! : student.id_back_image!}`,
            }, { status: 500 });
        }

        // Update the database to nullify the image field
        await prisma.students.update({
            where: {
                id: studentId,
                batch_id: batchId,
            },
            data: {
                [key]: null,
                ...(key === "image" && { attendance: 0 }) // Reset attendance if the main image is deleted
            },
        });

        return NextResponse.json({
            status: "Success",
            statusCode: 200,
            message: "File deleted successfully.",
        });

    } catch (error: any) {
        console.error('Error processing request:', error);

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

        return NextResponse.json({
            status: "Error",
            statusCode: error.statusCode || 500,
            message: error.message || "Internal server error",
        }, { status: error.statusCode || 500 });
    }
}
