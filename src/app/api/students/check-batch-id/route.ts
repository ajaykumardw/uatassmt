// Next Imports
import { NextResponse } from 'next/server';

// import { getServerSession } from 'next-auth';

// import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const id = url.searchParams.get('batchId');

  // const session = await getServerSession(authOptions);
  // const agencyId = Number(session?.user?.agency_id);

  const batchExist = await prisma.batches.findUnique({
    where: {
      batch_name: id?.toString()
    },
    select: {
      id: true,
      batch_size: true,
      students: {
        select: {
          id: true
        }
      }
    }
  })

  if(batchExist?.batch_size){

    const existingStudents = batchExist?.students.length || 0;

    const allowedStudents = Number(batchExist.batch_size) - existingStudents;

    console.log("allowedStudents", allowedStudents, existingStudents);
    const totalStudents = existingStudents + allowedStudents;

    console.log("batch size ",batchExist?.batch_size)

    const batchSizeNotExceeds = Boolean(totalStudents <= Number(batchExist.batch_size))

    console.log("students Exceeds " + totalStudents, batchSizeNotExceeds)

    return NextResponse.json({isBatchExist: !!batchExist, batchId: batchExist?.id, batchSize: Number(batchExist.batch_size), existingStudentsCount: batchExist?.students.length});
  }

  return NextResponse.json({isBatchExist: !!batchExist, batchId: batchExist?.id, batchSize: Number(batchExist?.batch_size) });
}
