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
  const id = Number(context.params.id);

  const pc = await prisma.pc.findFirst({
    where: {
      id: id
    }
  })

  return NextResponse.json(pc);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);
  const {nosId, pcId, pcName, theoryMarks, practicalMarks, vivaMarks} = await req.json();
  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const pcExist = await prisma.pc.findUnique({
    where: {
      id: id,
      agency_id: agency_id,
      nos_id: nosId,
      pc_id: pcId
    }
  })

  if (pcExist) {

    const result = await prisma.pc.update({
      where:{
        id: id,
        agency_id: agency_id,
        nos_id: nosId,
        pc_id: pcId
      },
      data: {
        pc_name: pcName,
        theory_marks: Number(theoryMarks),
        practical_marks: Number(practicalMarks),
        viva_marks: Number(vivaMarks),
        total_marks: (Number(theoryMarks)+Number(practicalMarks)+Number(vivaMarks)),
      }
    });

    if(result){

      return NextResponse.json({ message: 'PC updated successfully!' });
    }else{

      return NextResponse.json({ message: 'PC not updated!' }, { status: 500 });
    }
  } else {

    return NextResponse.json({ message: 'PC not found' }, { status: 404 });
  }
}
