// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(req: Request) {
  const data = await req.json();
  const {examSetId, examDurations, totalQuestions} = data;
  const session = await getServerSession(authOptions);
  const student = Number(session?.user.id);

  const formattedTime = minutesToTimeFormat(examDurations);

  console.log("data:", data);

  const studentExamResult = await prisma.student_exam_set_results.findFirst({
    where: {
      exam_set_id: examSetId,
      student_id: student
    }
  })

  if(studentExamResult){

    await prisma.student_exam_set_results.update({
      where: {
        id: studentExamResult.id
      },
      data: {
        total_attempts: studentExamResult.total_attempts+1
      }
    })

  } else {

    await prisma.student_exam_set_results.create({
      data: {
        language_id: 1,
        exam_set_id: examSetId,
        student_id: student,
        total_questions: totalQuestions,
        attempt_questions: 0,
        total_attempts: 1,
        exam_total_time: formattedTime,
        exam_appear_date: new Date(),
        ip_address: data.ip,
        user_agent: data.userAgent,
      }
    });
  }

  // if(result){
    return NextResponse.json({message: 'Student started exam successfully!'})

    // }
  // else{
  //   return NextResponse.json({message: 'Student question attempt not created!'},{status: 500})
  // }
}

// Function to convert minutes to hh:mm:ss format
const minutesToTimeFormat = (minutes: number): Date => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const date = new Date();

  date.setUTCHours(hours);     // Set hours in UTC
  date.setUTCMinutes(mins);    // Set minutes in UTC
  date.setUTCSeconds(0);       // Set seconds to 0
  date.setUTCMilliseconds(0);  // Remove milliseconds for clean time storage

  return date
}

// // Helper function to ensure time data is in the correct pair format
// const formatTimeData = (data: (string | [string, string])[]): [string, string][] => {
//   const formattedData: [string, string][] = [];
//   let temp: string[] = [];

//   data.forEach(item => {
//     if (Array.isArray(item)) {
//       formattedData.push(item); // Already a pair, push as-is

//     } else {
//       temp.push(item); // Collect timestamps into a pair

//       if (temp.length === 2) {

//         formattedData.push([temp[0], temp[1]]);
//         temp = []; // Reset for the next pair

//       }
//     }
//   });

//   return formattedData;
// }
