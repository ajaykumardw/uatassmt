// Next Imports
import { NextResponse } from 'next/server'


// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';


export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user.agency_id);
  const id = Number(context.params.id);

  const batch = await prisma.batches.findFirst({
    where: {
      id: id,
      agency_id: agencyId
    },
    include: {
      qualification_pack: true
    }
  })

  // console.log(batch)

  if(batch){
    return NextResponse.json(batch);
  }

  return NextResponse.json({message: "Batch not found!"}, {status: 404});

}


export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const id = Number(context.params.id);

  const {assessorId} = await req.json();

  const session = await getServerSession(authOptions);

  // const createdBy = Number(session?.user.id);

  const agencyId = Number(session?.user?.agency_id);

  const batchExist = await prisma.batches.findUnique({
    where: {
      id: id,
      agency_id: agencyId
    }
  });

  if(batchExist){

    const result = await prisma.batches.update({
      where: {
        id: id,
        agency_id: agencyId
      },
      data: {
        assessor_id: Number(assessorId),
        assessor_assign_datetime: new Date()
      }
    });

    if(result){
      return NextResponse.json({message: 'Assigned Assessor successfully!'})
    }else{
      return NextResponse.json({message: 'Assessor not assigned!'}, {status: 500})
    }
  }else{
    return NextResponse.json({message: 'Batch not found!'}, {status: 404})
  }


}
