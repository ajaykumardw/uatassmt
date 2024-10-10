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
      id: true
    }
  })

  return NextResponse.json({isBatchExist: !!batchExist, batchId: batchExist?.id});
}
