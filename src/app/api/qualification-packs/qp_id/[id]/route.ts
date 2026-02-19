// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';


export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const url = new URL(await req.url);
  const sscId = url.searchParams.get('sscId');

  // const qpId = url.searchParams.get('qpId');

  const id = decodeURIComponent(context.params.id.toString()).trim();
  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)

  // const pc = await prisma.pc.findFirst({
  //   where: {
  //     pc_id: id,
  //     nos: {
  //       ssc_id: Number(sscId),
  //       qualification_packs: {
  //         some: {
  //           id: Number(qpId),
  //         },
  //       }
  //     }
  //   }
  // })

  const qp = await prisma.qualification_packs.findUnique({
    where: {
      qualification_pack_id: id,
      agency_id: agency_id,
      ssc_id: Number(sscId)
    }
  });

  return NextResponse.json(qp);
}

