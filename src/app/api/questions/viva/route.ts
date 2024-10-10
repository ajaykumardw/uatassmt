import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  // const questions = await prisma.questions.findMany({
  // });

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);

  const vivaQuestions = await prisma.questions.findMany({
    where:{
      agency_id: agencyId,
      question_type: 'viva'
    }
  })

  // console.log(qualificationPacks);

  return NextResponse.json(vivaQuestions);
}

export async function POST(req: Request) {

  const {sscId, qpId, questionName, questionMarks} = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const result = await prisma.questions.create({
    data: {
      agency_id: agencyId,
      ssc_id: Number(sscId),
      qp_id: Number(qpId),
      language_id: 1,
      question: questionName,
      marks: Number(questionMarks),
      question_type: 'viva',
      created_by: createdBy
    }
  })

  if(result){
    return NextResponse.json({message: "Viva Question Created Successfully!"})
  }else{
    return NextResponse.json({message: "Viva Question not created. Some error occurred"})
  }
}
