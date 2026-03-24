// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  // const session = await getServerSession(authOptions);
  // const agency_id = Number(session?.user?.agency_id);

  const nos = await prisma.nos.findMany({

    // where: {
    //   agency_id: agency_id
    // },

    include: {
      ssc: true,
      qualification_packs: true,
      pc: {
        orderBy: {
          pc_id: 'asc'
        },
      },
    },
    orderBy: {
      nos_name: "asc"
    }
  });

  nos.forEach(nosItem => {
    nosItem.pc.sort((a, b) => {
      const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
      const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

      return numA - numB;
    });
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

  try {

    const existingNos = await prisma.nos.findFirst({
      where: { nos_id: nosId, agency_id },
    });

    if (existingNos) {
      return NextResponse.json(
        {
          status: 'Error',
          message: 'NOS with this ID already exists',
          errors: { nosId: ['NOS ID already exists'] }
        },
        { status: 422 }
      );
    }

    const result = await prisma.nos.create({
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

  } catch (error) {
    return NextResponse.json({message: 'Error creating NOS!', error: error}, {status: 500});
  }

}
