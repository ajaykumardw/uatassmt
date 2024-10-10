// Next Imports
import { NextResponse } from 'next/server';

// import { getServerSession } from 'next-auth';

// import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const candidateId = url.searchParams.get('candidateId');

  // const session = await getServerSession(authOptions);
  // const agencyId = Number(session?.user?.agency_id);

  const uniqueEnrollmentNo = await prisma.students.findUnique({
    where: {
      candidate_id: candidateId?.toString()
    },
    select: {
      id: true
    }
  })

  // console.log("enrollment no.", id);

  // // console.log(batches)

  return NextResponse.json({isUnique: !uniqueEnrollmentNo});
}
