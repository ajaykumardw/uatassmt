// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const nos = await prisma.pC.findMany({
    where: {
      agency_id: agency_id
    }
  });

  // console.log(qualificationPacks);

  return NextResponse.json(nos);
}

export async function POST(req: Request) {

  const data = await req.json();
  const {nosId, pcId, pcName} = data;
  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agency_id = Number(session?.user?.agency_id);

  const pcExist = await prisma.pC.findUnique({
    where: {
      nos_id: nosId,
      pc_id: pcId,
      agency_id: agency_id
    }
  })


  if(pcExist){

    return NextResponse.json({message: 'PC already exist.'}, {status: 409});
  }else{

    const result = await prisma.pC.create({
      data: {
        agency_id: agency_id,
        nos_id: nosId,
        pc_id: pcId,
        pc_name: pcName,
        created_by: createdBy
      }
    });

    if(result){
      return NextResponse.json({message: 'PC created successfully!'})
    }else{
      return NextResponse.json({message: 'Not created PC!'}, {status: 500})
    }
  }

}
