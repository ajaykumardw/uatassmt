import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  // const questions = await prisma.questions.findMany({
  // });

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);

  const practicalQuestions = await prisma.questions.findMany({
    where:{
      agency_id: agencyId,
      question_type: 'practical'
    },
    include: {
      pc: {
        select: {
          id: true,
          pc_id: true,
          pc_name: true,
        }
      }
    }
  })

  // console.log(qualificationPacks);

  return NextResponse.json(practicalQuestions);
}

export async function POST(req: Request) {

  const {sscId, qpId, nosId, selectPC, questionName} = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const pcsTotalMarks = await prisma.pc.aggregate({
    _sum: {
      practical_marks: true
    },
    where: {
      id: {
        in: selectPC.map((value: string) => Number(value))
      }
    }
  });

  const result = await prisma.questions.create({
    data: {
      agency_id: agencyId,
      ssc_id: Number(sscId),
      qp_id: Number(qpId),
      nos_id: Number(nosId),
      pc: {
        connect: selectPC.map((pcId: any) => ({ id: Number(pcId)}))
      },
      language_id: 1,
      question: questionName,
      marks: Number(pcsTotalMarks._sum.practical_marks),
      question_type: 'practical',
      created_by: createdBy
    }
  })

  if(result){
    return NextResponse.json({message: "Practical Question Created Successfully!"})
  }else{
    return NextResponse.json({message: "Practical Question not created. Some error occurred"})
  }
}
