// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
// import { getServerSession } from 'next-auth';

import { type JwtPayload, verify } from 'jsonwebtoken';

// import { authOptions } from '@/libs/auth';

import {
  number,
  object,
  tuple,
  string,
  nullable,
  minValue,
  maxValue,
  pipe,
  regex,
  check,
  safeParse
} from 'valibot';

import prisma from '@/libs/prisma';

const schemaValidation = object({

  examSetId:
    number(),

  questionId:
    number(),

  candidateAnswer:
    nullable(number()),

  attemptTime:
    pipe(
      tuple([

        pipe(
          number("isAnswered must be 0 or 1"),
          minValue(0,"isAnswered must be 0 or 1"),
          maxValue(1,"isAnswered must be 0 or 1")
        ),

        pipe(
          string("Start time must be a datetime string"),
          regex(
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
            "Start time format must be YYYY-MM-DD HH:MM:SS"
          )
        ),

        pipe(
          string("End time must be a datetime string"),
          regex(
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
            "End time format must be YYYY-MM-DD HH:MM:SS"
          )
        )

      ]),
      check(
        ([, start, end]) => {

          const s = new Date(start).getTime();
          const e = new Date(end).getTime();

          return (
            !isNaN(s) &&
            !isNaN(e) &&
            e >= s
          );

        },
        "End time must be after start time"
      )
    )

});

export async function POST(req: Request) {
  const data = await req.json();

  const validation = safeParse(schemaValidation, data);

  if (!validation.success) {

    return NextResponse.json({
      status: 'Error',
      statusCode: 400,
      message: 'Validation error',
      errors: validation.issues.map(issue => issue.message)
    }, { status: 400 });
  }

  const { examSetId, questionId, candidateAnswer, attemptTime } = validation.output;

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: 'Unauthorized'
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    if (!decoded.candidate_id) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token'
      }, { status: 401 });
    }

    const candidateId = decoded.id;

    const questionData = await prisma.questions.findUnique({
      where: {
        id: Number(questionId)
      },
      select: {
        id: true,
        answer: true
      }
    })

    const question = await prisma.exam_set_results.findFirst({
      where: {
        student_id: candidateId,
        question_id: Number(questionId)
      }
    });

    if (question) {

      // let updatedTime = JSON.parse(question.attempt_time_data)
      const updatedTime = question.attempt_time_data ? JSON.parse(question.attempt_time_data) : [];

      // updatedTime = formatTimeData(updatedTime);

      updatedTime.push(attemptTime);

      await prisma.exam_set_results.update({
        where: {
          id: question.id
        },
        data: {
          student_id: candidateId,
          question_id: questionId,
          student_answer: candidateAnswer ?? null,
          attempt_time_data: JSON.stringify(updatedTime),
        }
      });

    } else {

      await prisma.exam_set_results.create({
        data: {
          exam_set_id: examSetId,
          student_id: candidateId,
          question_id: questionId,
          student_answer: candidateAnswer ?? null,
          correct_answer: Number(questionData?.answer),
          attempt_time_data: JSON.stringify([attemptTime]),
          created_by: candidateId,
          updated_by: candidateId,
        }
      });
    }

    const attemptQuestionsData = await prisma.exam_set_results.findMany({
      where: {
        exam_set_id: examSetId,
        student_id: candidateId,
      }
    });

    let correctCount = 0;
    let incorrectCount = 0;

    // let totalSpentTimeInMil = 0;

    let earliestStartTime: Date | null = null;
    let latestEndTime: Date | null = null;

    let formattedSpentTime;

    if (attemptQuestionsData.length > 0) {

      attemptQuestionsData.forEach((attempt) => {
        if (attempt.student_answer === attempt.correct_answer) {
          correctCount++;
        } else {
          incorrectCount++;
        }

        const timeIntervals = JSON.parse(attempt.attempt_time_data);

        // console.log("Time interval", timeIntervals);


        timeIntervals.forEach((interval: string[]) => {
          const startTime = new Date(interval[1]);
          const endTime = new Date(interval[2]);

          // console.log("startTime and endTime:", startTime, endTime, interval[1], interval[2]);

          // Update earliest start time if necessary
          if (!earliestStartTime || startTime < earliestStartTime) {
            earliestStartTime = startTime;
          }

          // Update latest end time if necessary
          if (!latestEndTime || endTime > latestEndTime) {
            latestEndTime = endTime;
          }
        });

      });

      // console.log('earliestStartTime && latestEndTime', earliestStartTime , latestEndTime);

      if (earliestStartTime && latestEndTime) {
        // Calculate the total time in milliseconds
        const totalTimeInMilliseconds = (latestEndTime as Date).getTime() - (earliestStartTime as Date).getTime();

        // Convert milliseconds to total seconds
        const totalTimeInSeconds = totalTimeInMilliseconds / 1000;

        // Calculate hours, minutes, and seconds
        const hours = Math.floor(totalTimeInSeconds / 3600);
        const minutes = Math.floor((totalTimeInSeconds % 3600) / 60);
        const seconds = Math.floor(totalTimeInSeconds % 60);

        // Format the result into hh:mm:ss format
        formattedSpentTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
      } else {
        formattedSpentTime = "00:00:00";
      }

    }

    const studentExamResult = await prisma.student_exam_set_results.findUnique({
      where: {
        student_id_exam_set_id: {
          exam_set_id: examSetId,
          student_id: candidateId
        }
      }
    })

    if (studentExamResult) {
      await prisma.student_exam_set_results.update({
        where: {
          id: studentExamResult.id
        },
        data: {
          exam_spent_time: formattedSpentTime,
          attempt_questions: attemptQuestionsData.length,
          correct: correctCount,
          incorrect: incorrectCount
        }
      })
    }



    // if(result){
    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'Student question attempt added successfully!'
    })

    // }
    // else{
    //   return NextResponse.json({message: 'Student question attempt not created!'},{status: 500})
    // }
  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error
      }, { status: 401 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error
      }, { status: 401 });
    }

    console.error("Error in POST /api/students/question-attempt:", error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });

  }
}

// Function to pad single digits with a leading zero
const padZero = (value: number): string => {
  return value < 10 ? `0${value}` : `${value}`;
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

// // Function to convert milliseconds to HH:MM:SS format
// const formatTime = (ms: number): string => {
//   const hours = Math.floor(ms / (1000 * 60 * 60));
//   const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
//   const seconds = Math.floor((ms % (1000 * 60)) / 1000);

//   // Format the time components to ensure two digits (e.g., 05 for minutes or seconds)
//   const formattedHours = hours.toString().padStart(2, '0');
//   const formattedMinutes = minutes.toString().padStart(2, '0');
//   const formattedSeconds = seconds.toString().padStart(2, '0');

//   return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
// }

