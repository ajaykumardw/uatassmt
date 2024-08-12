// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const nos = await prisma.nos.findFirst({
    where: {
      id: id
    },
    include: {
      pc: true
    }
  })

  return NextResponse.json(nos);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);
  const {sscId, nosName} = await req.json();

  const qualificationPackExist = await prisma.nos.findUnique({
    where: {
      id: id
    }
  })

  if (qualificationPackExist) {

    const result = await prisma.nos.update({
      where:{
        id: id
      },
      data: {
        ssc_id: Number(sscId),
        nos_name: nosName
      }
    });

    if(result){

      return NextResponse.json({ message: 'Qualification pack updated successfully!' });
    }else{

      return NextResponse.json({ message: 'Qualification pack not updated!' }, { status: 500 });
    }
  } else {

    return NextResponse.json({ message: 'Qualification pack not found' }, { status: 404 });
  }
}
