import fs from 'fs';

import path from "path";

import { type NextRequest, NextResponse } from "next/server";

import { verify, type JwtPayload } from 'jsonwebtoken';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

import { storageFolders } from "@/configs/customDataConfig";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, fileId: string } }
) {
  const id = Number(params.id);
  const fileId = Number(params.fileId);

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: "Error",
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    if (decoded.user_type !== "U" && decoded.role_id !== 1) {
      return NextResponse.json({
        status: "Error",
        statusCode: 403,
        message: "Forbidden: Insufficient permissions"
      }, { status: 403 });
    }

    const fileRecord = await prisma.inspection_media.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord || fileRecord.batch_id !== id) {
      return NextResponse.json({
        status: "Error",
        statusCode: 404,
        message: "File not found"
      }, { status: 404 });
    }

    const filePath = path.join(
      process.cwd(),
      storageFolders.storage,
      storageFolders.uploads,
      storageFolders.agency,
      storageFolders.batches,
      id.toString(),
      storageFolders.centerInspection,
      fileRecord.file_name
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.inspection_media.delete({
      where: { id: fileId }
    });

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "File deleted successfully",
      filePath: filePath
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
