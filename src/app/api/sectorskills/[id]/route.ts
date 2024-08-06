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
  const agency_id = Number(session?.user?.agency_id)
  const id = Number(context.params.id);

  const sectorSkills = await prisma.sector_skill_councils.findFirst({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      qualification_packs: true,
      nos: true
    }
  })

  return NextResponse.json(sectorSkills);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);
  const {sscName, sscCode, username, status} = await req.json();

  const sscExist = await prisma.sector_skill_councils.findUnique({
    where: {
      id: id
    }
  })

  if (sscExist) {

    const result = await prisma.sector_skill_councils.update({
      where:{
        id: id
      },
      data: {
        ssc_name: sscName,
        ssc_code: sscCode,
        ssc_username: username,
        status: Number(status)
      }
    });

    if(result){

      return NextResponse.json({ message: 'SSC updated successfully!' });
    }else{
      return NextResponse.json({ message: 'SSC not updated' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'SSC not found' }, { status: 404 });
  }
}
