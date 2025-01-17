// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(req: Request) {
  const data = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);

  const questionData = await prisma.questions.findUnique({
    where: {
      id: Number(data[1])
    },
    select: {
      id: true,
      answer: true
    }
  })

  const question = await prisma.exam_set_results.findFirst({
    where: {
      student_id: createdBy,
      question_id: data[1]
    }
  });

  if(question){

    let updatedTime = JSON.parse(question.attempt_time_data)

    updatedTime = formatTimeData(updatedTime);

    updatedTime.push(data[3]);

    await prisma.exam_set_results.update({
      where: {
        id: question.id
      },
      data: {
        student_id: Number(session?.user.id),
        question_id: Number(data[1]),
        student_answer: Number(data[2]),
        attempt_time_data: JSON.stringify(updatedTime),
      }
    });

  } else {

    await prisma.exam_set_results.create({
      data: {
        exam_set_id: data[0],
        student_id: Number(session?.user.id),
        question_id: Number(data[1]),
        student_answer: Number(data[2]),
        correct_answer: Number(questionData?.answer),
        attempt_time_data: JSON.stringify(data[3]),
        created_by: createdBy,
        updated_by: createdBy,
      }
    });
  }


  // if(result){
    return NextResponse.json({message: 'Student question attempt added successfully!'})

    // }
  // else{
  //   return NextResponse.json({message: 'Student question attempt not created!'},{status: 500})
  // }
}


// Helper function to ensure time data is in the correct pair format
const formatTimeData = (data: (string | [string, string])[]): [string, string][] => {
  const formattedData: [string, string][] = [];
  let temp: string[] = [];

  data.forEach(item => {
    if (Array.isArray(item)) {
      formattedData.push(item); // Already a pair, push as-is

    } else {
      temp.push(item); // Collect timestamps into a pair

      if (temp.length === 2) {

        formattedData.push([temp[0], temp[1]]);
        temp = []; // Reset for the next pair

      }
    }
  });

  return formattedData;
}
