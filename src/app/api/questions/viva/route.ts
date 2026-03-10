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
    },
    include: {
      pc: {
        orderBy: {
          pc_id: 'asc'
        },
        select: {
          id: true,
          pc_id: true,
          pc_name: true,
        }
      },
      exam_sets_questions: {
        select: {
          id: true,
          exam_set_id: true
        }
      },
    }
  })

  // Sort PCs numerically by pc_id number
  const formattedQuestions = vivaQuestions.map(question => {
    const sortedPc = [...question.pc].sort((a, b) => {
      const numA = parseInt(a.pc_id.replace(/^\D+/g, ""), 10);
      const numB = parseInt(b.pc_id.replace(/^\D+/g, ""), 10);

      return numA - numB;
    });

    return {
      ...question,
      pc: sortedPc,
      inExamSet: question.exam_sets_questions.length > 0
    };
  });

  // console.log(qualificationPacks);

  return NextResponse.json(formattedQuestions);
}

export async function POST(req: Request) {

  const {sscId, qpId, nosId, selectPC, questionName} = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const pcsTotalMarks = await prisma.pc.aggregate({
    _sum: {
      viva_marks: true
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
      marks: Number(pcsTotalMarks._sum.viva_marks),
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
