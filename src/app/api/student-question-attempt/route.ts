// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { DateTime } from 'luxon';

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

  if (question) {

    // Server-side hold timer check: enforce minimum 10 seconds between attempts
    const existingTimeData = JSON.parse(question.attempt_time_data);

    if (existingTimeData.length > 0) {
      const lastEntry = existingTimeData[existingTimeData.length - 1];

      if (lastEntry && lastEntry[2]) {
        const lastEndTime = DateTime.fromFormat(lastEntry[2], 'yyyy-LL-dd HH:mm:s', { zone: 'Asia/Kolkata' });
        const now = DateTime.now().setZone('Asia/Kolkata');
        const diff = now.diff(lastEndTime, 'seconds').seconds;

        if (diff < 10) {
          return NextResponse.json({ error: `Please wait ${Math.ceil(10 - diff)} seconds before proceeding` }, { status: 429 });
        }
      }
    }

    let updatedTime = JSON.parse(question.attempt_time_data);

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

    // Create with race-condition guard: unique constraint at DB level prevents duplicates
    try {
      await prisma.exam_set_results.create({
        data: {
          exam_set_id: data[0],
          student_id: Number(session?.user.id),
          question_id: Number(data[1]),
          student_answer: Number(data[2]),
          correct_answer: Number(questionData?.answer),
          attempt_time_data: JSON.stringify([data[3]]),
          created_by: createdBy,
          updated_by: createdBy,
        }
      });
    } catch (err: any) {
      // P2002 = unique constraint violation → concurrent request already created this row
      if (err?.code === 'P2002') {
        const existingRow = await prisma.exam_set_results.findFirst({
          where: { student_id: createdBy, question_id: Number(data[1]) }
        });

        if (existingRow) {
          let existingData = JSON.parse(existingRow.attempt_time_data);

          existingData = formatTimeData(existingData);
          existingData.push(data[3]);

          await prisma.exam_set_results.update({
            where: { id: existingRow.id },
            data: {
              student_answer: Number(data[2]),
              attempt_time_data: JSON.stringify(existingData),
            }
          });
        }
      } else {
        throw err;
      }
    }
  }

  const attemptQuestionsData = await prisma.exam_set_results.findMany({
    where: {
      exam_set_id: data[0],
      student_id: createdBy,
    }
  });

  let correctCount = 0;
  let incorrectCount = 0;

  // let totalSpentTimeInMil = 0;

  let earliestStartTime: Date | null = null;
  let latestEndTime: Date | null = null;

  let formattedSpentTime;

  if(attemptQuestionsData.length > 0) {

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


    // attemptQuestionsData.forEach((attempt) => {
    // });

    // return totalTime; // Return the total time in milliseconds

  }

  // const formattedSpentTime = formatTime(totalSpentTimeInMil);


  // console.log("attemptQuestionsData:", attemptQuestionsData, correctCount, incorrectCount, formattedSpentTime);


  const studentExamResult = await prisma.student_exam_set_results.findUnique({
    where: {
      student_id_exam_set_id: {
        exam_set_id: data[0],
        student_id: createdBy
      }
    }
  })

  if(studentExamResult){
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
    return NextResponse.json({message: 'Student question attempt added successfully!'})

    // }
  // else{
  //   return NextResponse.json({message: 'Student question attempt not created!'},{status: 500})
  // }
}

// Function to pad single digits with a leading zero
const padZero = (value: number): string => {
  return value < 10 ? `0${value}` : `${value}`;
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

