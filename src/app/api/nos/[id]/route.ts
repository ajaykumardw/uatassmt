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
      pc: {
        orderBy: {
          pc_id: 'asc'
        },
      }
    }
  })

  nos?.pc.sort((a, b) => {
    const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
    const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

    return numA - numB;
  });

  return NextResponse.json(nos);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);
  const {sscId, nosId, nosName} = await req.json();

  const nosExist = await prisma.nos.findUnique({
    where: {
      id: id
    }
  })

  if (nosExist) {

    const duplicate = await prisma.nos.findFirst({
      where: {
        nos_id: nosId,
        agency_id: nosExist.agency_id,
        NOT: { id },
      },
    })

    if (duplicate) {
      return NextResponse.json(
        {
          status: 'Error',
          message: 'NOS ID must be unique',
          errors: { nosId: ['This NOS ID is already exists'] },
        },
        { status: 422 }
      )
    }

    const result = await prisma.nos.update({
      where:{
        id: id
      },
      data: {
        ssc_id: Number(sscId),
        nos_id: nosId,
        nos_name: nosName
      }
    });

    if(result){

      return NextResponse.json({ message: 'NOS updated successfully!' });
    }else{

      return NextResponse.json({ message: 'NOS not updated!' }, { status: 500 });
    }
  } else {

    return NextResponse.json({ message: 'NOS not found' }, { status: 404 });
  }
}
