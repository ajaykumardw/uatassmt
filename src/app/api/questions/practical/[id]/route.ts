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
  const agency_id = Number(session?.user?.agency_id);

  const id = Number(context.params.id);

  const question = await prisma.questions.findUnique({
    where: {
      id: id,
      agency_id: agency_id,
      question_type: 'practical'
    }
  })

  return NextResponse.json(question);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const {sscId, qpId, nosId, questionName, questionMarks} = await req.json();

  const questionExist = await prisma.questions.findUnique({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      pc: true
    }
  })

  if (questionExist) {

    const result = await prisma.questions.update({
      where: {
        id: id,
        agency_id: agency_id
      },
      data: {
        ssc_id: Number(sscId),
        qp_id: Number(qpId),
        nos_id: Number(nosId),
        question: questionName,
        marks: Number(questionMarks)
      }
    });

    if(result){

      return NextResponse.json({ message: 'Practical Question is updated successfully!' });
    }else{

      return NextResponse.json({ message: 'Practical Question not updated!' }, { status: 500 });
    }
  } else {

    return NextResponse.json({ message: 'Practical Question not found' }, { status: 404 });
  }
}
