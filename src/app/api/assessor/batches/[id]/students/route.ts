import path from "path";

import { type NextRequest, NextResponse } from "next/server";

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/auth";

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { Prisma } from "@prisma/client";

import prisma from "@/libs/prisma";

import { storageFolders } from "@/configs/customDataConfig";

export async function GET(req: NextRequest, context: { params: { id: number } }) {

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const id = Number(context.params.id);

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    // const agency_id = Number(decoded?.id);

    if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const students = await prisma.students.findMany({
      where: {
        batch_id: id
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
        gender: true,
        category: true,
        date_of_birth: true,
        mobile_no: true,
        practical_group: true,
        viva_group: true,
      }
    });


    const mappedData = students.map(student => {

      const relativePath = path.posix.join(
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        student.batch_id.toString(),
        storageFolders.student,
        student.id.toString(),
        storageFolders.images
      );

      return {
        ...student,
        image: student.image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.image}` : null,
        id_front_image: student.id_front_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.id_front_image}` : null,
        id_back_image: student.id_back_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.id_back_image}` : null,
      };
    });

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'Students fetched successfully',
      data: mappedData
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
