import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const studentId = searchParams.get('student') ? Number(searchParams.get('student')) : null;
  const batchId = searchParams.get('batch') ? Number(searchParams.get('batch')) : null;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  const skip = (page - 1) * limit;

  if(!studentId || !batchId){
    return NextResponse.json({
      "status": "Error",
      "statusCode": "400",
      "message": "Missing student or batch parameter"
    }, {status: 400})
  }

  const studentExamSetResult = await prisma.student_exam_set_results.findFirst({
    where: {
      student_id: studentId
    },
    select: {
      id: true
    }
  })

  if(studentExamSetResult){

    // Total count (for pagination meta)
    const total = await prisma.student_captured_images.count({
      where: {
        student_id: studentId,
        student_exam_set_result_id: studentExamSetResult?.id,
      },
    });

    const capturedImages = await prisma.student_captured_images.findMany({
      where: {
        student_id: studentId,
        student_exam_set_result_id: studentExamSetResult.id
      },
      skip,
      take: limit,
      orderBy: { captured_time: "desc" },
    });

    const imagesWithUrls = capturedImages.map(image => {
      const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}/${batchId}/${storageFolders.student}/${image.student_id}/${storageFolders.captured}/${image.captured_image}`;

      return {
        ...image,
        captured_image_url: imageUrl,
      };
    })

    return NextResponse.json({
      "studentExamSetResult": studentExamSetResult,
      "capturedImages": imagesWithUrls,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      }
    })

  } else {

    return NextResponse.json({
      "studentExamSetResult": null,
      "capturedImages": [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      }
    })
  }
}


export async function POST(req: Request) {
  const { captured_image } = await req.json();
  const session = await getServerSession(authOptions);
  const student = Number(session?.user.id);

  const batchId = prisma.students.findUnique({
    where: {
      id: student
    },
    select: {
      batch_id: true
    }
  });

  const timestamp = getTime(new Date());
  const imageName = `${timestamp}.jpg`;

  const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches, batchId.toString(), storageFolders.student, student.toString(), storageFolders.captured);

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
      student_id: student
    },
    select: {
      id: true
    }
  });

  const result = await prisma.student_captured_images.create({
    data: {
      student_id: student,
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
}
