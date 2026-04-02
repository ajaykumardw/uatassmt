import path from "path";

import { NextResponse, type NextRequest } from "next/server";

import { type JwtPayload, verify } from "jsonwebtoken";

import { Prisma } from "@prisma/client";

import prisma from '@/libs/prisma';

import { decrypt, encrypt } from "@/utils/encryption";

import { storageFolders } from "@/configs/customDataConfig";

export async function GET(req: NextRequest) {

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

    const studentId = Number(decoded.id);

    const student = await prisma.students.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        candidate_id: true,
        batch_id: true,
        user_name: true,
        candidate_name: true,
        image: true,
        id_front_image: true,
        id_back_image: true,
        aadhaar_no: true,
        category: true,
        gender: true,
        date_of_birth: true,
        mobile_no: true,
        attendance: true,
      }
    });

    if (!student) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Student not found'
      }, { status: 404 });
    }

    const relativePath = path.posix.join(
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        student.batch_id.toString(),
        storageFolders.student,
        studentId.toString(),
        storageFolders.images
    );


    const mappedStudent = {
      ...student,
      image: student.image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.image}` : null,
      id_front_image: student.id_front_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.id_front_image}` : null,
      id_back_image: student.id_back_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${student.id_back_image}` : null,
      aadhaar_no: student.aadhaar_no ? decrypt(student.aadhaar_no) : null
    };

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Profile data retrieved successfully.",
      data: mappedStudent,
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

    console.error("Error in GET /students/profile:", error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal Server Error'
    }, { status: 500 });
  }

}

export async function PATCH(
  req: NextRequest,
) {

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

    const studentId = Number(decoded.id);

    let data;

    try {

      data = await req.json();

    } catch (error) {

      console.error("Invalid JSON body in PATCH /students/profile:", error);

      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Invalid JSON body'
      }, { status: 400 });
    }

    const studentExist = await prisma.students.findUnique({
      where:{
        id: studentId
      },
      select: {
        id: true,
        candidate_name: true,
        mobile_no: true,
        gender: true,
        category: true,
        date_of_birth: true,
        aadhaar_no: true
      }

    })

    if(studentExist){
      const result = await prisma.students.update({
        where: {
          id: studentId
        },
        data: {
          mobile_no: data.mobile_no || studentExist.mobile_no,
          gender: data.gender || studentExist.gender,
          category: data.category || studentExist.category,
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : studentExist.date_of_birth,
          aadhaar_no: data.aadhaar_no ? encrypt(data.aadhaar_no) : studentExist.aadhaar_no
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
          aadhaar_no: true,
          category: true,
          gender: true,
          date_of_birth: true,
          mobile_no: true,
        }
      })

      if(result){

        const relativePath = path.posix.join(
            storageFolders.storage,
            storageFolders.uploads,
            storageFolders.agency,
            storageFolders.batches,
            result.batch_id.toString(),
            storageFolders.student,
            studentId.toString(),
            storageFolders.images
        );

        return NextResponse.json({
          status: 'Success',
          statusCode: 200,
          message: 'Profile Updated Successfully!',
          data: {
            ...result,
            image: result.image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${result.image}` : null,
            id_front_image: result.id_front_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${result.id_front_image}` : null,
            id_back_image: result.id_back_image ? `${process.env.NEXT_PUBLIC_APP_URL}/${relativePath}/${result.id_back_image}` : null,
            aadhaar_no: result?.aadhaar_no ? decrypt(result.aadhaar_no) : null
          }
        });

      } else {

        return NextResponse.json({
          status: 'Error',
          statusCode: 500,
          message: 'Profile not updated!'
        }, {status: 500});
      }

    }else{

      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Profile not found!'
      }, {status: 404});
    }

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


    console.error("Error in PUT /students/profile:", error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal Server Error'
    }, { status: 500 });
  }

}
