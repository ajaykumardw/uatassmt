// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
// import { getServerSession } from 'next-auth';

// import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const id = Number(context.params.id);

  const {isSSC, isStudent} = await req.json();

  let user;

  if(isSSC){
    user = await prisma.sector_skill_councils.findUnique({
      where: {
        id: id
      }
    });
  } else if(isStudent){
    user = await prisma.students.findUnique({
      where: {
        id: id
      }
    });
  } else {
    user = await prisma.users.findFirst({
      where: {
        id: id
      }
    })
  }

  return NextResponse.json({exists: !!user});
}
