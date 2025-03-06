import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(req: Request) {
  const {captured_image} = await req.json();
  const session = await getServerSession(authOptions);
  const student = Number(session?.user.id);

  const timestamp =  getTime(new Date());
  const imageName = `${timestamp}.jpg`;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'student', student.toString(), 'captured');

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

  const result = await prisma.student_captured_images.create({
    data: {
      student_id: student,
      student_exam_set_result_id: 1,
      captured_image: imageName,
      captured_time: new Date()
    }
  })

  if(result){

    return NextResponse.json({message: 'Student Captured Image added successfully!'})

  }
  else{

    return NextResponse.json({message: 'Student Captured Image not stored'},{status: 500})

  }
}
