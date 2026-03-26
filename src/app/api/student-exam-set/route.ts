// Next Imports
import { type NextRequest, NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { type JwtPayload, verify } from 'jsonwebtoken';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(req: NextRequest) {

  const authHeader = req.headers.get("authorization");
  const session = await getServerSession(authOptions);

  console.log("authHeader", authHeader);

  if (!authHeader && !session) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Unauthorized"
    }, { status: 401 });
  }

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

      console.log("Decoded JWT:", decoded);

      if (!decoded.candidate_id) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 403,
          message: 'Forbidden: Insufficient permissions'
        }, { status: 403 });
      }

      const candidateId = decoded.id;

      const exam = await prisma.students.findFirst({
        where: {
          id: Number(candidateId)
        },
        select: {
          id: true,
          student_exam_set_results: true,
          exam_set_results: true,
          batch: {
            select: {
              assessment_start_datetime: true,
              assessment_end_datetime: true,
              login_restrict: true,
              capture_image_in_seconds: true,
              theory_exam_set: {
                include: {
                  exam_sets_questions: {
                    select: {
                      question_id: true,
                      marks: true,
                      questions: {
                        select: {
                          question: true,
                          option1: true,
                          option2: true,
                          option3: true,
                          option4: true,
                          option5: true,
                        }
                      }
                    }
                  }
                }
              },

              // practical_exam_set: {
              //   include: {
              //     exam_sets_questions: {
              //       select: {
              //         question_id: true,
              //         marks: true,
              //         questions: {
              //           select: {
              //             question: true,
              //             option1: true,
              //             option2: true,
              //             option3: true,
              //             option4: true,
              //             option5: true,
              //           }
              //         }
              //       }
              //     }
              //   }
              // },
              // viva_exam_set: {
              //   include: {
              //     exam_sets_questions: {
              //       select: {
              //         question_id: true,
              //         marks: true,
              //         questions: {
              //           select: {
              //             question: true,
              //             option1: true,
              //             option2: true,
              //             option3: true,
              //             option4: true,
              //             option5: true,
              //           }
              //         }
              //       }
              //     }
              //   }
              // },
            }
          }
        }
      })

      if (!exam) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 404,
          message: 'Exam not found for the student'
        }, { status: 404 });
      }

      // // Check if the exam_set is random and shuffle the questions
      // if (exam?.batch?.theory_exam_set?.question_random) {
      //   // Shuffle the exam_sets_questions array
      //   exam.batch.theory_exam_set.exam_sets_questions = exam.batch.theory_exam_set.exam_sets_questions.sort(() => Math.random() - 0.5);
      // }

      // let data;

      // if (exam?.batch.theory_exam_set) {
      //   if (exam.batch.theory_exam_set.option_random === 0) {
      //     exam.batch.theory_exam_set.option_random = 1
      //   }
      // }

      const questions = exam?.batch?.theory_exam_set?.exam_sets_questions.map(eq => {
          const optRandom = exam?.batch.theory_exam_set?.option_random === 1;
          
          return {
            question_id: eq.question_id,
            marks: eq.marks,
            question: eq.questions?.question,
            options: [
              { id: "option1", value: eq.questions.option1},
              { id: "option2", value: eq.questions.option2},
              eq.questions.option3 && { id: "option3", value: eq.questions.option3},
              eq.questions.option4 && { id: "option4", value: eq.questions.option4},
              eq.questions.option5 && { id: "option5", value: eq.questions.option5},
            ].sort(() => optRandom ? Math.random() - 0.5 : 0) // Shuffle options if option_random is 1
          }
      });

      const data = {
        batch: {
          assessment_start_datetime: exam.batch.assessment_start_datetime,
          assessment_end_datetime: exam.batch.assessment_end_datetime,
          remaining_attempts: (
            (exam.batch?.login_restrict || 0) -
            (
              exam?.student_exam_set_results
                ?.find(result => result?.exam_set_id === exam?.batch?.theory_exam_set?.id)
                ?.total_attempts || 0
            )
          ),
          capture_image_in_seconds: exam.batch.capture_image_in_seconds,
        },
        exam_set_id: exam?.batch?.theory_exam_set?.id,
        total_questions: exam?.batch?.theory_exam_set?.total_questions,
        question_random: exam?.batch?.theory_exam_set?.question_random,
        option_random: exam?.batch?.theory_exam_set?.option_random,
        exam_duration_in_minutes: exam?.batch?.theory_exam_set?.exam_duration,
        instruction: exam?.batch?.theory_exam_set?.instruction,

        theory_questions: questions || [],
      }

      if (data.question_random) {
        data.theory_questions.sort(() => Math.random() - 0.5);
      }




      return NextResponse.json({
        status: 'Success',
        statusCode: 200,
        message: 'Student exam set fetched successfully!',
        data: data

        // data: {
        //   data,
        //   exam: exam
        // }
      });

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

      console.error("Error verifying token:", error);

      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: "Unauthorized"
      }, { status: 401 });
    }
  }


  const exam = await prisma.students.findFirst({
    where: {
      id: Number(session?.user.id)
    },
    select: {
      id: true,
      student_exam_set_results: true,
      exam_set_results: true,
      batch: {
        select: {
          assessment_start_datetime: true,
          assessment_end_datetime: true,
          login_restrict: true,
          capture_image_in_seconds: true,
          theory_exam_set: {
            include: {
              exam_sets_questions: {
                select: {
                  question_id: true,
                  marks: true,
                  questions: {
                    select: {
                      question: true,
                      option1: true,
                      option2: true,
                      option3: true,
                      option4: true,
                      option5: true,
                    }
                  }
                }
              }
            }
          },
          practical_exam_set: {
            include: {
              exam_sets_questions: {
                select: {
                  question_id: true,
                  marks: true,
                  questions: {
                    select: {
                      question: true,
                      option1: true,
                      option2: true,
                      option3: true,
                      option4: true,
                      option5: true,
                    }
                  }
                }
              }
            }
          },
          viva_exam_set: {
            include: {
              exam_sets_questions: {
                select: {
                  question_id: true,
                  marks: true,
                  questions: {
                    select: {
                      question: true,
                      option1: true,
                      option2: true,
                      option3: true,
                      option4: true,
                      option5: true,
                    }
                  }
                }
              }
            }
          },
        }
      }
    }
  })

  // Check if the exam_set is random and shuffle the questions
  if (exam?.batch?.theory_exam_set?.question_random) {
    // Shuffle the exam_sets_questions array
    exam.batch.theory_exam_set.exam_sets_questions = exam.batch.theory_exam_set.exam_sets_questions.sort(() => Math.random() - 0.5);
  }

  // console.log("exam set data", exam)

  return NextResponse.json(exam);
}

// export async function POST(req: Request) {
//   const {
//     sscId,
//     qpId,
//     setName,
//     mode,
//     totalQuestions,
//     status,
//     easy,
//     medium,
//     hard,
//     questionRandom,
//     optionRandom,
//     selectedQuestions
//   } = await req.json();

//   const session = await getServerSession(authOptions);
//   const agency_id = Number(session?.user?.agency_id)
//   const createdBy = Number(session?.user.id);

//   if(mode === 'Manual'){

//     const questions = await prisma.questions.findMany({
//       where: {
//         id: {
//           in: selectedQuestions
//         }
//       },
//       select: {
//         id: true,
//         marks: true
//       }
//     });

//     // const groupedQuestions = questions.reduce((acc, question) => {
//     //   const level = question.question_level;
//     //   if (!acc[level]) {
//     //     acc[level] = 0; // Initialize count for this level
//     //   }
//     //   acc[level] += 1; // Increment count
//     //   return acc;
//     // }, {'E': 0, 'M': 0, 'H': 0});

//     const result = await prisma.exam_sets.create({
//       data: {
//         agency_id: agency_id,
//         ssc_id: Number(sscId),
//         qp_id: Number(qpId),
//         set_name: setName,
//         mode: mode,
//         total_questions: Number(totalQuestions),
//         status: Number(status),
//         question_random: questionRandom ? 1 : 0,
//         option_random: optionRandom ? 1 : 0,
//         created_by: createdBy
//       }
//     })


//     if(result){

//       for (const question of questions) {
//         await prisma.exam_sets_questions.create({
//           data: {
//             agency_id: agency_id,
//             exam_set_id: result.id,
//             question_id: question.id,
//             marks: question.marks,  // Use the individual marks here
//             created_by: createdBy
//           }
//         });
//       }

//       return NextResponse.json({message: 'Exam Set created successfully!'})
//     }
//     else{

//       return NextResponse.json({message: 'Exam Set not created!'},{status: 500})
//     }
//   }else if(mode === 'Auto'){

//     const easyNum = Number(easy);
//     const mediumNum = Number(medium);
//     const hardNum = Number(hard);
//     const totalQuestionsNum = Number(totalQuestions);
//     const isEqual = totalQuestionsNum === (easyNum + mediumNum + hardNum);

//     const questions = await prisma.questions.findMany({
//       where: {
//         agency_id: agency_id,
//         ssc_id: Number(sscId),
//         qp_id: Number(qpId),
//         question_type: 'theory'
//       },
//       select: {
//         id: true,
//         question_level: true,
//         marks: true
//       }
//     })

//     const easyQuestions = questions.filter(q => q.question_level === 'E');
//     const mediumQuestions = questions.filter(q => q.question_level === 'M');
//     const hardQuestions = questions.filter(q => q.question_level === 'H');

//     // Function to get random questions from an array
//     const getRandomQuestions = (questionsArray: any[], count: number) => {

//       if (count > questionsArray.length) {

//         throw new Error(`Not enough questions available in this category. Required: ${count}, Available: ${questionsArray.length}`);
//       }

//       const shuffled = questionsArray.sort(() => 0.5 - Math.random());

//       return shuffled.slice(0, count);
//     };

//     // Select random questions from each category
//     const selectedEasyQuestions = easyQuestions.length > 0 ? getRandomQuestions(easyQuestions, easyNum) : [];
//     const selectedMediumQuestions = mediumQuestions.length > 0 ? getRandomQuestions(mediumQuestions, mediumNum) : [];
//     const selectedHardQuestions = hardQuestions.length > 0 ? getRandomQuestions(hardQuestions, hardNum) : [];

//     const selectedQuestions = [
//       ...selectedEasyQuestions,
//       ...selectedMediumQuestions,
//       ...selectedHardQuestions,
//     ];

//     if(totalQuestionsNum <= questions.length){

//       if(isEqual){

//         const result = await prisma.exam_sets.create({
//           data: {
//             agency_id: agency_id,
//             ssc_id: Number(sscId),
//             qp_id: Number(qpId),
//             set_name: setName,
//             mode: mode,
//             total_questions: Number(totalQuestions),
//             status: Number(status),
//             question_levels: {"E": easyNum, "M": mediumNum, "H": hardNum},
//             question_random: questionRandom ? 1 : 0,
//             option_random: optionRandom ? 1 : 0,
//             created_by: createdBy
//           }
//         })

//         if(result){

//           for (const question of selectedQuestions) {
//             await prisma.exam_sets_questions.create({
//               data: {
//                 agency_id: agency_id,
//                 exam_set_id: result.id,
//                 question_id: question.id,
//                 marks: question.marks,  // Use the individual marks here
//                 created_by: createdBy
//               }
//             });
//           }

//           return NextResponse.json({message: 'Exam Set created successfully!'});
//         }else {

//           return NextResponse.json({message: 'Exam Set not created!'}, {status: 500});
//         }

//         // return NextResponse.json({message: 'Exam Set for Auto mode is pending!', questions: questions, selectedQuestions: selectedQuestions});
//       }

//       return NextResponse.json({message: 'Sum of Easy, Medium and Hard must be equal to Total Questions!', isEqual: isEqual, totalQuestions: totalQuestions, sum: (Number(easy) + Number(medium) + Number(hard))}, {status: 500});
//     }else{

//       return NextResponse.json({message: 'Total Question is greater then available questions!'}, {status: 500});
//     }
//   }
// }
