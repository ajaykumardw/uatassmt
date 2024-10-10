// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { hash } from 'bcrypt';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id) || 412

  const sectorSkills = await prisma.sector_skill_councils.findMany({
    where: {
      agency_id: agency_id
    },
    include: {
      qualification_packs: {
        include: {
          nos: true
        }
      },
      nos: true
    },
    orderBy:{
      ssc_name: "asc"
    }
  });

  return NextResponse.json(sectorSkills);
}

export async function POST(req: Request) {
  const { sscName, sscCode, username, password, status } = await req.json();
  const hashPassword = await hash(password, 10);

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);
  const createdBy = Number(session?.user.id);

  const result = await prisma.sector_skill_councils.create({
    data: {
      ssc_name: sscName,
      ssc_code: sscCode,
      ssc_username: username,
      ssc_pwd: hashPassword,
      status: Number(status),
      agency_id: agencyId,
      created_by: createdBy
    }
  });


  if(result){
    return NextResponse.json({message: 'SSC created successfully!'})
  }
  else{
    return NextResponse.json({message: 'SSC not created!'},{status: 500})
  }
}
