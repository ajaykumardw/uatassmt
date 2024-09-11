// Next Imports
import { NextResponse } from 'next/server';

// import { getServerSession } from 'next-auth';

// import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  // const session = await getServerSession(authOptions);
  // const agency_id = Number(session?.user?.agency_id);

  const schemes = await prisma.schemes.findMany({
    where: {
      parent_id: null
    },
    include: {
      sub_schemes: true
    },
    orderBy: {
      scheme_name: "asc"
    }
  });

  // console.log(qualificationPacks);

  return NextResponse.json(schemes);
}

export async function POST(req: Request) {

  const data = await req.json();

  const {schemeName, schemeCode, parentId, status} = data;

  // const session = await getServerSession(authOptions);
  // const createdBy = Number(session?.user.id);
  // const agency_id = Number(session?.user?.agency_id);

  const schemeExist = await prisma.schemes.findUnique({
    where: {
      scheme_code: schemeCode,
    }
  })


  if(schemeExist){

    return NextResponse.json({message: 'Scheme already exist.'}, {status: 409});
  }else{

    const result = await prisma.schemes.create({
      data: {
        scheme_name: schemeName,
        scheme_code: schemeCode,
        parent_id: parentId || null,
        status: status
      }
    });

    if(result){
      return NextResponse.json({message: 'Scheme created successfully!'})
    }else{
      return NextResponse.json({message: 'Scheme not created!'}, {status: 500})
    }
  }

}
