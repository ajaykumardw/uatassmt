// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const qpId = url.searchParams.get('qpId');
  const qType = url.searchParams.get('qType');

  // console.log('qType', qType);

  if(qpId){
    const questions = await prisma.questions.findMany({
      where: {
        qp_id: Number(qpId),
        question_type: qType == 'practical' ? 'practical' : qType == 'viva' ? 'viva' : 'theory'
      },
      include: {
        pc: true
      }
    })

    return NextResponse.json(questions);

  }

  // const questions = await prisma.questions.findMany({
  // });
  const questions = await prisma.sector_skill_councils.findMany({
    select: {
      id: true,
      agency_id: true,
      ssc_name: true,
      qualification_packs: {
        select: {
          id: true,
          qualification_pack_id: true,
          qualification_pack_name: true,
          nsqf_level: true,
          nos: {
            select: {
              id: true,
              nos_id: true,
              nos_name: true,
              pc: {
                select: {
                  id: true,
                  pc_id: true,
                  pc_name: true,
                  theory_marks: true,
                  practical_marks: true,
                  viva_marks: true,
                  questions: {
                    where: {
                      question_type: 'theory'
                    },
                    include: {
                      pc: {
                        select: {
                          id: true,
                          pc_id: true,
                          pc_name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy:{
      ssc_name: "asc"
    }
  });

  // console.log(qualificationPacks);

  return NextResponse.json(questions);
}

export async function POST(req: Request) {

  const reqData = await req.json();

  // const {selectPC, sscId, qpId, pcId, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer, questionMarks} = reqData;

  const {selectPC, sscId, qpId, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer} = reqData;
  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agency_id = Number(session?.user?.agency_id);

  const filterOption = option.filter((opt: string) => {
    return opt !== ''
  });

  // const pcExist = await prisma.questions.findUnique({
  //   where: {
  //     agency_id: agency_id,
  //     id: pcId
  //   }
  // })


  // if(pcExist){

  //   return NextResponse.json({message: 'PC already exist.'}, {status: 409});
  // }else{

    const pcsTotalMarks = await prisma.pc.aggregate({
      _sum: {
        theory_marks: true
      },
      where: {
        id: {
          in: selectPC.map((value: string) => Number(value))
        }
      }
    });

    const result = await prisma.questions.create({
      data: {
        agency_id: agency_id,
        ssc_id: sscId,
        qp_id: qpId,
        language_id: 1,
        question_type: 'theory',
        question_level: questionLevel,
        question_explanation: questionExplanation,
        question: questionName,
        option1: option1,
        option2: option2,
        option3: filterOption[0],
        option4: filterOption[1],
        option5: filterOption[2],
        answer: Number(correctAnswer),
        marks: Number(pcsTotalMarks._sum.theory_marks),
        created_by: createdBy,
        pc: {
          connect: selectPC.map((pcId: any) => ({ id: Number(pcId) }))
        }
      }
    });

    if(result){
      return NextResponse.json({message: 'Question created successfully!'})
    }else{
      return NextResponse.json({message: 'Not created Question!'}, {status: 500})
    }

  // }

}
