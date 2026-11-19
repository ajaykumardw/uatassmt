// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)

  const examSets = await prisma.exam_sets.findMany({
    where:{
      agency_id: agency_id
    },
    include: {
      exam_sets_questions: true
    }
  });

  const questionIds = examSets.flatMap(examSet => examSet.exam_sets_questions.map(item => item.question_id));

  const questions = await prisma.questions.findMany({
    where: {
      id: {
        in: questionIds
      }
    },
    select: {
      id: true,
      question_level: true
    }
  });

  const questionLevels = new Map(questions.map(question => [question.id, question.question_level]));

  const examSetsWithQuestionLevels = examSets.map(examSet => ({
    ...examSet,
    exam_sets_questions: examSet.exam_sets_questions.map(item => ({
      ...item,
      questions: {
        question_level: questionLevels.get(item.question_id) || 'E'
      }
    }))
  }));

  return NextResponse.json(examSetsWithQuestionLevels);
}
