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

  const examSets = await prisma.exam_sets.findUnique({
    where:{
      id: id,
      agency_id: agency_id
    },
    include: {
      exam_sets_questions: {
        include: {
          questions: {
            select: {
              question_level: true
            }
          }
        }
      }
    }
  });

  return NextResponse.json(examSets);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const {
    sscId,
    qpId,
    setName,
    mode,
    totalQuestions,
    status,

    // easy,
    // medium,
    // hard,

    questionRandom,
    optionRandom,
    selectedQuestions
  } = await req.json();

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)
  const createdBy = Number(session?.user.id);

  const existingExamSet = await prisma.exam_sets.findUnique({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      exam_sets_questions: {
        include: {
          questions: {
            select: {
              question_level: true
            }
          }
        }
      }
    }
  })

  if(existingExamSet){

    if(mode === 'Manual'){

      const existingQuestions = existingExamSet?.exam_sets_questions.map(q => q.question_id) || [];

      // Determine which questions to add
      const questionsToAdd = selectedQuestions.filter((id: number) => !existingQuestions.includes(id));

      // Determine which questions to remove
      const questionsToRemove = existingQuestions.filter(id => !selectedQuestions.includes(id));

      // Fetch details for questions to be added
      const questions = await prisma.questions.findMany({
        where: {
          id: {
            in: questionsToAdd
          }
        },
        select: {
          id: true,
          marks: true
        }
      });

      // Update the exam set
      const result = await prisma.exam_sets.update({
        where: {
          id: id,
          agency_id: agency_id
        },
        data: {
          ssc_id: Number(sscId),
          qp_id: Number(qpId),
          set_name: setName,
          mode: mode,
          total_questions: Number(totalQuestions),
          status: Number(status),
          question_random: questionRandom ? 1 : 0,
          option_random: optionRandom ? 1 : 0,
        }
      });

      if (result) {
        // Add new questions to the exam set
        for (const question of questions) {
          await prisma.exam_sets_questions.create({
            data: {
              agency_id: agency_id,
              exam_set_id: result.id,
              question_id: question.id,
              marks: question.marks,  // Use the individual marks here
              created_by: createdBy
            }
          });
        }

        // Remove questions that are no longer selected
        for (const questionId of questionsToRemove) {
          await prisma.exam_sets_questions.deleteMany({
            where: {
              exam_set_id: result.id,
              question_id: questionId
            }
          });
        }

        return NextResponse.json({ message: 'Exam Set updated successfully!' });
      } else {
        return NextResponse.json({ message: 'Exam Set not updated!' }, { status: 500 });
      }

    }else if(mode === 'Auto'){
      return NextResponse.json({message: 'Exam Set Edit for Auto mode is pending!'})
    }
  } else {
    return NextResponse.json({message: "Exam set not found."}, {status: 404});
  }

}
