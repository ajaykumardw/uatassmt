// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
// import { getServerSession } from 'next-auth';

// import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';


export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const url = new URL(await req.url);

  // const sscId = url.searchParams.get('sscId');
  // const qpId = url.searchParams.get('qpId');

  const nosId = url.searchParams.get('nosId');
  const unique = url.searchParams.get('unique');
  const id = decodeURIComponent(context.params.id.toString());


  if(unique){
    const pc = await prisma.pc.findFirst({
      where: {
        pc_id: id
      }
    })

    return NextResponse.json(pc);
  }

  // const pc = await prisma.pc.findFirst({
  //   where: {
  //     pc_id: id,
  //     nos: {
  //       qualification_packs: {
  //         id: 6,

  //       }
  //     }
  //   }
  // })

  const pc = await prisma.pc.findFirst({
    where: {
      pc_id: id,
      nos: {
        nos_id: nosId ? nosId : undefined
      }
    }
  })
  
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

  return NextResponse.json(pc);
}

