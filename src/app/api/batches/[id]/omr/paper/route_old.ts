// import { getServerSession } from "next-auth";
// import { NextRequest, NextResponse } from "next/server";
// import { authOptions } from "@/libs/auth";
// import prisma from "@/libs/prisma";

// function shuffleArray<T>(array: T[]) {

//   const arr = [...array];

//   for (let i = arr.length - 1; i > 0; i--) {

//     const j =
//       Math.floor(
//         Math.random() * (i + 1)
//       );

//     [arr[i], arr[j]] =
//       [arr[j], arr[i]];
//   }

//   return arr;
// }

// export async function POST (

//   request: NextRequest,
//   { params }: { params: { id: string } }

// ) {

//   const session = await getServerSession(authOptions);
//   const userId = Number(session?.user.id);
//   const userType = session?.user.user_type;

//   if (userType !== "AG") {
//     return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
//   }

//   const batchId = parseInt(params.id);

//   if (isNaN(batchId)) {
//     return NextResponse.json({ message: "Invalid batch ID" }, { status: 400 });
//   }

//   const batch = await prisma.batches.findUnique({

//     where: { id: batchId, agency_id: userId },
//     select: {
//       id: true,
//       theory_exam_set: {
//         include: {
//           exam_sets_questions: {
//             select: {
//               question_id: true,
//               marks: true,
//               questions: {
//                 select: {
//                   id: true,
//                   question: true,
//                   option1: true,
//                   option2: true,
//                   option3: true,
//                   option4: true,
//                   option5: true,
//                   answer: true,
//                 }
//               }
//             }
//           }
//         }
//       },
//       students: {
//         select: {
//           id: true,
//           candidate_id: true,
//           candidate_name: true,

//         }
//       }
//     }

//   });

//   if (!batch) {
//     return NextResponse.json({
//       status: "Error",
//       statusCode: 404,
//       message: "Batch not found"
//     }, { status: 404 });
//   }

//   if (!batch.theory_exam_set) {
//     return NextResponse.json({
//       status: "Error",
//       statusCode: 400,
//       message: "Theory exam set not assigned to this batch"
//     }, { status: 400 });
//   }

//   console.log("Received request to generate certificates for batch ID:", batchId);

//   for (const student of batch.students) {

//     let questions =
//       batch.theory_exam_set.exam_sets_questions;

//     // QUESTION RANDOM

//     // if (batch.theory_exam_set.question_random) {

//       questions = shuffleArray(questions);
//     // }

//     const mapping = questions.map(
//       (item, index) => {

//         const question =
//           item.questions;

//         // DYNAMIC OPTIONS

//         const availableOptions = [

//           question.option1,
//           question.option2,
//           question.option3,
//           question.option4,
//           question.option5

//         ]
//           .map((value, idx) => ({

//             index: idx + 1,

//             value
//           }))
//           .filter(option => option.value);

//         // OPTION RANDOM

//         // const shuffledOptions =
//         //   batch?.theory_exam_set?.option_random
//         //     ? shuffleArray(availableOptions)
//         //     : availableOptions;
//         const shuffledOptions = shuffleArray(availableOptions);

//         // PRINTED CORRECT OPTION

//         const correctOption =
//           shuffledOptions.findIndex(
//             option =>
//               option.index === question.answer
//           ) + 1;

//         return {

//           question_no: index + 1,

//           question_id: question.id,

//           options:
//             shuffledOptions.map(
//               option => option.index
//             ),

//           correct_option:
//             correctOption
//         };
//       }
//     );

//     // PAPER CODE

//     const paperCode =
//       crypto.randomUUID()
//         .slice(0, 8)
//         .toUpperCase();

//     // SAVE

//     await prisma.offline_candidate_papers.create({

//       data: {

//         batch_id: batch.id,

//         student_id: student.id,

//         exam_set_id: batch.theory_exam_set.id,

//         paper_code: paperCode,

//         mapping,

//         question_count:
//           mapping.length,

//         created_by: userId
//       }
//     });
//   }

//   const questionPapers = await prisma.offline_candidate_papers.findMany({

//     where: { batch_id: batch.id }
//   });



//   return NextResponse.json({
//     message: "Question paper generation started",
//     data: questionPapers
//   });

// }


// app/api/offline-exam/generate/[id]/route.ts

import crypto from "crypto";

import { getServerSession } from "next-auth";

import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

import puppeteer from "puppeteer";

import QRCode from "qrcode";
import { getBrowser } from "@/libs/puppeteerBrowser";

function shuffleArray<T>(array: T[]) {

  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [arr[i], arr[j]] =
      [arr[j], arr[i]];
  }

  return arr;
}

export async function POST(

  request: NextRequest,

  { params }: {
    params: {
      id: string
    }
  }
) {

  try {

    // SESSION

    const session =
      await getServerSession(
        authOptions
      );

    const userId =
      Number(session?.user.id);

    const userType =
      session?.user.user_type;

    if (userType !== "AG") {

      return NextResponse.json({

        message: "Unauthorized"

      }, { status: 403 });
    }

    // BATCH ID

    const batchId =
      parseInt(params.id);

    if (isNaN(batchId)) {

      return NextResponse.json({

        message:
          "Invalid batch ID"

      }, { status: 400 });
    }

    // FETCH BATCH

    const batch =
      await prisma.batches.findUnique({

        where: {

          id: batchId,

          agency_id: userId
        },

        include: {

          qualification_pack: true,

          theory_exam_set: {

            include: {

              exam_sets_questions: {

                include: {

                  questions: true
                }
              }
            }
          },

          students: {
            select: {
              id: true,
              candidate_id: true,
              candidate_name: true,
            },
            orderBy: {
              candidate_name: "asc"
            }
          },
        },
      });

    if (!batch) {

      return NextResponse.json({

        message:
          "Batch not found"

      }, { status: 404 });
    }

    if (!batch.theory_exam_set) {

      return NextResponse.json({

        message:
          "Theory exam set not found"

      }, { status: 400 });
    }

    // DELETE OLD PAPERS

    await prisma
      .offline_candidate_papers
      .deleteMany({

        where: {

          batch_id: batch.id,

          exam_set_id:
            batch.theory_exam_set.id
        }
      });

    // MEMORY ARRAY

    const papersData = [];

    // LOOP STUDENTS

    for (
      const student
      of batch.students
    ) {

      let questions = [

        ...batch.theory_exam_set
          .exam_sets_questions
      ];

      // RANDOM QUESTIONS

      questions =
        shuffleArray(
          questions
        );

      // MAPPING

      const mapping =
        questions.map(

          (item, index) => {

            const question =
              item.questions;

            const availableOptions = [

              question.option1,
              question.option2,
              question.option3,
              question.option4,
              question.option5

            ]
              .map(
                (
                  value,
                  idx
                ) => ({

                  index:
                    idx + 1,

                  value
                })
              )
              .filter(
                option =>
                  option.value
              );

            // RANDOM OPTIONS

            const shuffledOptions =

              shuffleArray(
                availableOptions
              );

            // CORRECT OPTION

            const correctOption =

              shuffledOptions.findIndex(

                option =>

                  option.index ===
                  question.answer

              ) + 1;

            return {

              question_no:
                index + 1,

              question_id:
                question.id,

              options:

                shuffledOptions.map(

                  option =>
                    option.index
                ),

              correct_option:
                correctOption
            };
          }
        );

      // PAPER CODE

      const paperCode =

        crypto.randomUUID()
          .slice(0, 8)
          .toUpperCase();

      // PUSH MEMORY

      papersData.push({

        batch_id:
          batch.id,

        student_id:
          student.id,

        exam_set_id:
          batch.theory_exam_set.id,

        paper_code:
          paperCode,

        mapping,

        question_count:
          mapping.length,

        created_by:
          userId
      });
    }

    // TRANSACTION INSERT

    await prisma.$transaction(

      papersData.map(

        data =>

          prisma
            .offline_candidate_papers
            .create({

              data
            })
      )
    );

    // FETCH PAPERS

    const papers =
      await prisma
        .offline_candidate_papers
        .findMany({

          where: {

            batch_id:
              batch.id,

            exam_set_id:
              batch.theory_exam_set.id
          },

          include: {

            student: true
          },

          orderBy: {

            id: "asc"
          }
        });

    // FETCH ALL QUESTIONS

    const questionIds =

      papers.flatMap(

        paper =>

          (
            paper.mapping as any[]
          ).map(

            item =>
              item.question_id
          )
      );

    const uniqueQuestionIds =

      [...new Set(questionIds)];

    const questions =
      await prisma.questions.findMany({

        where: {

          id: {

            in:
              uniqueQuestionIds
          }
        }
      });

    // QUESTION MAP

    const questionMap =
      new Map(

        questions.map(

          q => [q.id, q]
        )
      );

    // HTML

    let allHTML = "";

    // LOOP PAPERS

    for (
      const paper
      of papers
    ) {

      const mapping =
        paper.mapping as any[];

      // QR CODE

      const qrCode =

        await QRCode.toDataURL(

          JSON.stringify({

            paper_code:
              paper.paper_code
          })
        );

      // QUESTIONS HTML

      let questionsHTML = "";

      for (
        const item
        of mapping
      ) {

        const question =

          questionMap.get(
            item.question_id
          );

        if (!question) {
          continue;
        }

        const allOptions = [

          question.option1,
          question.option2,
          question.option3,
          question.option4,
          question.option5
        ];

        const printedOptions =

          item.options.map(

            (
              optionIndex:
              number
            ) =>

              allOptions[
                optionIndex - 1
              ]
          );

        questionsHTML += `

        <div class="question">

          <div class="question-title">

            ${item.question_no})

            ${question.question}

            (${question.marks}
            marks)

          </div>

          <div class="options">

            ${printedOptions.map(

              (
                option: string,
                index: number
              ) => `

                <div class="option">

                  ${String.fromCharCode(
                    65 + index
                  )})

                  ${option}

                </div>

              `
            ).join("")}
          </div>

        </div>
        `;
      }

      // PAPER HTML

      allHTML += `

      <div class="paper">

        <div class="header">

          <div>

            <p>

              <b>
                SDMS Enrollment No:
              </b>

              ${paper.student.candidate_id}

            </p>

            <p>

              <b>
                Candidate Name:
              </b>

              ${paper.student.candidate_name}

            </p>

            <p>

              <b>
                QB CODE:
              </b>

              ${batch.qualification_pack
                .qualification_pack_id}

            </p>

            <p>

              <b>
                Batch Name:
              </b>

              ${batch.batch_name}

            </p>

          </div>

          <img
            src="${qrCode}"
            width="100"
          />

        </div>

        <hr/>

        ${questionsHTML}

      </div>
      `;
    }

    // FINAL HTML

    const finalHTML = `

    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="UTF-8" />

      <style>

        body{

          font-family:
            Arial,
            "Noto Sans Devanagari",
            sans-serif;

          padding:20px;

          font-size:14px;

          line-height:1.5;
        }

        .paper{

          page-break-after:always;

          padding-bottom:30px;
        }

        .paper:last-child{

          page-break-after:auto;
        }

        .header{

          display:flex;

          justify-content:
            space-between;

          align-items:flex-start;
        }

        .question{

          margin-top:20px;
        }

        .question *{
          font-size: 12px;
        }

        .question-title{

          font-weight:bold;
        }

        .options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 40px;
          row-gap: 10px;
          margin-left: 20px;
        }

        .option {
          padding: 4px 0;
        }

      </style>

    </head>

    <body>

      ${allHTML}

    </body>

    </html>
    `;

    // PDF

    const browser = await getBrowser();

    const page = await browser.newPage();

    await page.setContent(

      finalHTML,

      {
        waitUntil: "domcontentloaded",

        timeout: 0
      }
    );

    // PDF BUFFER

    const pdfBuffer =
      await page.pdf({

        format: "A4",

        printBackground: true,

        margin: {

          top: "20px",

          bottom: "20px",

          left: "20px",

          right: "20px"
        }
      });

    await page.close();

    // await browser.close();

    // RESPONSE

    return new NextResponse(

      Buffer.from(pdfBuffer),

      {

        headers: {

          "Content-Type":"application/pdf",

          "Content-Disposition":`attachment; filename=batch-${batch.id}-question-paper.pdf`
        }
      }
    );

  } catch (error) {

    console.error(error);

    return NextResponse.json({

      message:
        "Something went wrong"

    }, { status: 500 });
  }
}
