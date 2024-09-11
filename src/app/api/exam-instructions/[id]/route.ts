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

  const examInstruction = await prisma.exam_instructions.findFirst({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      ssc: true
    }
  })

  return NextResponse.json(examInstruction);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);
  const {sscId, instruction, status} = await req.json();

  const examInstructionExist = await prisma.exam_instructions.findUnique({
    where: {
      id: id
    }
  })

  if (examInstructionExist) {

    const result = await prisma.exam_instructions.update({
      where:{
        id: id
      },
      data: {
        ssc_id: Number(sscId),
        instruction: instruction,
        status: Number(status)
      }
    });

    if(result){

      return NextResponse.json({ message: 'Exam Instruction updated successfully!' });
    }else{
      return NextResponse.json({ message: 'Exam Instruction not updated' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'Exam Instruction not found' }, { status: 404 });
  }
}
