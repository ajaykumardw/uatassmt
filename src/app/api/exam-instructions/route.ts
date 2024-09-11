// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)

  const examInstructions = await prisma.exam_instructions.findMany({
    where: {
      agency_id: agency_id
    },
    include: {
      ssc: true
    },
    orderBy: {
      instruction: "asc"
    }
  });

  return NextResponse.json(examInstructions);
}

export async function POST(req: Request) {
  const { sscId, instruction, status } = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);

  const result = await prisma.exam_instructions.create({
    data: {
      ssc_id: Number(sscId),
      instruction: instruction,
      status: Number(status),
      agency_id: createdBy,
      created_by: createdBy
    }
  });


  if(result){
    return NextResponse.json({message: 'Exam Instruction created successfully!'})
  }
  else{
    return NextResponse.json({message: 'Exam Instruction not created!'},{status: 500})
  }
}
