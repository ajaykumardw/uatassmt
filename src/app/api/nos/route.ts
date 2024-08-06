// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const nos = await prisma.nOS.findMany({
    where: {
      agency_id: agency_id
    },
    include: {
      ssc: true,
      qualification_packs: true,
      pc: true,
    }
  });

  // console.log(qualificationPacks);

  return NextResponse.json(nos);
}

export async function POST(req: Request) {

  const data = await req.json();
  const {sscId, nosId, nosName} = data;
  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agency_id = Number(session?.user?.agency_id);

  const result = await prisma.nOS.create({
    data: {
      agency_id: agency_id,
      ssc_id: Number(sscId),
      nos_id: nosId,
      nos_name: nosName,
      created_by: createdBy
    }
  });

  if(result){
    return NextResponse.json({message: 'NOS created successfully!'})
  }else{
    return NextResponse.json({message: 'Not created NOS!'})
  }

}
