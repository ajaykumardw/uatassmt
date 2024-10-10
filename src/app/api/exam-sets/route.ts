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

export async function POST(req: Request) {
  const {
    sscId,
    qpId,
    setName,
    mode,
    totalQuestions,
    status,
    easy,
    medium,
    hard,
    questionRandom,
    optionRandom,
    selectedQuestions
  } = await req.json();

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)
  const createdBy = Number(session?.user.id);

  if(mode === 'Manual'){

    const questions = await prisma.questions.findMany({
      where: {
        id: {
          in: selectedQuestions
        }
      },
      select: {
        id: true,
        marks: true
      }
    });

    // const groupedQuestions = questions.reduce((acc, question) => {
    //   const level = question.question_level;
    //   if (!acc[level]) {
    //     acc[level] = 0; // Initialize count for this level
    //   }
    //   acc[level] += 1; // Increment count
    //   return acc;
    // }, {'E': 0, 'M': 0, 'H': 0});

    const result = await prisma.exam_sets.create({
      data: {
        agency_id: agency_id,
        ssc_id: Number(sscId),
        qp_id: Number(qpId),
        set_name: setName,
        mode: mode,
        total_questions: Number(totalQuestions),
        status: Number(status),
        question_random: questionRandom ? 1 : 0,
        option_random: optionRandom ? 1 : 0,
        created_by: createdBy
      }
    })


    if(result){

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

      return NextResponse.json({message: 'Exam Set created successfully!'})
    }
    else{

      return NextResponse.json({message: 'Exam Set not created!'},{status: 500})
    }
  }else if(mode === 'Auto'){

    const easyNum = Number(easy);
    const mediumNum = Number(medium);
    const hardNum = Number(hard);
    const totalQuestionsNum = Number(totalQuestions);
    const isEqual = totalQuestionsNum === (easyNum + mediumNum + hardNum);

    const questions = await prisma.questions.findMany({
      where: {
        agency_id: agency_id,
        ssc_id: Number(sscId),
        qp_id: Number(qpId),
        question_type: 'theory'
      },
      select: {
        id: true,
        question_level: true,
        marks: true
      }
    })

    const easyQuestions = questions.filter(q => q.question_level === 'E');
    const mediumQuestions = questions.filter(q => q.question_level === 'M');
    const hardQuestions = questions.filter(q => q.question_level === 'H');

    // Function to get random questions from an array
    const getRandomQuestions = (questionsArray: any[], count: number) => {

      if (count > questionsArray.length) {

        throw new Error(`Not enough questions available in this category. Required: ${count}, Available: ${questionsArray.length}`);
      }

      const shuffled = questionsArray.sort(() => 0.5 - Math.random());

      return shuffled.slice(0, count);
    };

    // Select random questions from each category
    const selectedEasyQuestions = easyQuestions.length > 0 ? getRandomQuestions(easyQuestions, easyNum) : [];
    const selectedMediumQuestions = mediumQuestions.length > 0 ? getRandomQuestions(mediumQuestions, mediumNum) : [];
    const selectedHardQuestions = hardQuestions.length > 0 ? getRandomQuestions(hardQuestions, hardNum) : [];

    const selectedQuestions = [
      ...selectedEasyQuestions,
      ...selectedMediumQuestions,
      ...selectedHardQuestions,
    ];

    if(totalQuestionsNum <= questions.length){

      if(isEqual){

        const result = await prisma.exam_sets.create({
          data: {
            agency_id: agency_id,
            ssc_id: Number(sscId),
            qp_id: Number(qpId),
            set_name: setName,
            mode: mode,
            total_questions: Number(totalQuestions),
            status: Number(status),
            question_levels: {"E": easyNum, "M": mediumNum, "H": hardNum},
            question_random: questionRandom ? 1 : 0,
            option_random: optionRandom ? 1 : 0,
            created_by: createdBy
          }
        })

        if(result){

          for (const question of selectedQuestions) {
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

          return NextResponse.json({message: 'Exam Set created successfully!'});
        }else {

          return NextResponse.json({message: 'Exam Set not created!'}, {status: 500});
        }

        // return NextResponse.json({message: 'Exam Set for Auto mode is pending!', questions: questions, selectedQuestions: selectedQuestions});
      }

      return NextResponse.json({message: 'Sum of Easy, Medium and Hard must be equal to Total Questions!', isEqual: isEqual, totalQuestions: totalQuestions, sum: (Number(easy) + Number(medium) + Number(hard))}, {status: 500});
    }else{

      return NextResponse.json({message: 'Total Question is greater then available questions!'}, {status: 500});
    }
  }
}
