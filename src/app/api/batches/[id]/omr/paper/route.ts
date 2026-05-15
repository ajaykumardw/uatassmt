
// app/api/offline-exam/generate/[id]/route.ts

import crypto from "crypto";

import { getServerSession } from "next-auth";

import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

import puppeteer from "puppeteer";

import QRCode from "qrcode";
import { getBrowser } from "@/libs/puppeteerBrowser";

import pLimit from "p-limit";
import { PDFDocument } from "pdf-lib";

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

async function generatePDF(browser: any, html: string, headerHtml: string) {
  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "domcontentloaded",
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="
        width: 100%;
        font-size: 10px;
        padding: 0 20px;
        margin: 20px 20px 20px 20px;
        box-sizing: border-box;
        border-bottom: 1px solid #000;
      ">
        ${headerHtml}
      </div>
    `,
    footerTemplate: `
      <div style="
        width: 100%;
        text-align: center;
        font-size: 10px;
      ">
        Page <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
    margin: {

      top: "0px",

      bottom: "60px",

      left: "20px",

      right: "20px"
    }
  });

  await page.close();

  return Buffer.from(pdf);
}

async function mergePDFs(buffers: Buffer[]) {
  const merged = await PDFDocument.create();

  for (const buf of buffers) {
    const pdf = await PDFDocument.load(buf);

    const pages = await merged.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    pages.forEach((p) => merged.addPage(p));
  }

  return Buffer.from(await merged.save());
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

    const browser = await getBrowser();

    const pdfBuffers: Buffer[] = [];

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

//       let questionsHTML = `
//   <table class="question-table" style="width:100%; border-collapse:collapse;">
// `;

// for (const item of mapping) {
//   const question = questionMap.get(item.question_id);
//   if (!question) continue;

//   const allOptions = [
//     question.option1,
//     question.option2,
//     question.option3,
//     question.option4,
//     question.option5
//   ];

//   const printedOptions = item.options.map(
//     (optionIndex: number) => allOptions[optionIndex - 1]
//   );

//   questionsHTML += `
//     <tr>
//       <td style="padding:10px 0; font-weight:bold;">
//         ${item.question_no}) ${question.question} (${question.marks} marks)
//       </td>
//     </tr>

//     <tr>
//       <td style="padding-left:20px;">
//         <table style="width:100%; border-collapse:collapse;">
//           <tr>
//             <td style="width:50%; padding:3px 0;">
//               A) ${printedOptions[0] || ""}
//             </td>
//             <td style="width:50%; padding:3px 0;">
//               B) ${printedOptions[1] || ""}
//             </td>
//           </tr>

//           <tr>
//             <td style="width:50%; padding:3px 0;">
//               C) ${printedOptions[2] || ""}
//             </td>
//             <td style="width:50%; padding:3px 0;">
//               D) ${printedOptions[3] || ""}
//             </td>
//           </tr>

//           ${printedOptions[4] ? `
//           <tr>
//             <td colspan="2" style="padding:3px 0;">
//               E) ${printedOptions[4]}
//             </td>
//           </tr>` : ""}
//         </table>
//       </td>
//     </tr>

//     <tr><td style="height:10px;"></td></tr>
//   `;
// }

// questionsHTML += `</table>`;

      // PAPER HTML

      const headerHtml = `
        <div style="display:flex;justify-content: space-between;align-items:flex-start; font-size: 16px;">

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

              ${batch.qualification_pack.qualification_pack_id}

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
      `;


      const html = `

        <div class="paper">



          <div class="content">
            ${questionsHTML}
          </div>

        </div>
      `;

      const finalHtml = `
        <!DOCTYPE html>

        <html>

        <head>

          <meta charset="UTF-8" />

          <style>

            @page {
              margin: 180px 20px 40px 20px;
              border: 2px solid red;
            }

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

            .question{

              border-top: 1px solid green;

              margin-top:0px;
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

          ${html}

        </body>

        </html>
      `

      const pdf = await generatePDF(browser, finalHtml, headerHtml);
      pdfBuffers.push(Buffer.from(pdf));

    }

    const finalPDF = await mergePDFs(pdfBuffers);

    // // FINAL HTML

    // const finalHTML = `

    // <!DOCTYPE html>

    // <html>

    // <head>

    //   <meta charset="UTF-8" />

    //   <style>

    //     body{

    //       font-family:
    //         Arial,
    //         "Noto Sans Devanagari",
    //         sans-serif;

    //       padding:20px;

    //       font-size:14px;

    //       line-height:1.5;
    //     }

    //     .paper{

    //       page-break-after:always;

    //       padding-bottom:30px;
    //     }

    //     .paper:last-child{

    //       page-break-after:auto;
    //     }

    //     .header{

    //       display:flex;

    //       justify-content:
    //         space-between;

    //       align-items:flex-start;
    //     }

    //     .question{

    //       margin-top:20px;
    //     }

    //     .question *{
    //       font-size: 12px;
    //     }

    //     .question-title{

    //       font-weight:bold;
    //     }

    //     .options {
    //       display: grid;
    //       grid-template-columns: repeat(2, minmax(0, 1fr));
    //       column-gap: 40px;
    //       row-gap: 10px;
    //       margin-left: 20px;
    //     }

    //     .option {
    //       padding: 4px 0;
    //     }

    //   </style>

    // </head>

    // <body>

    //   ${allHTML}

    // </body>

    // </html>
    // `;

    // // PDF

    // // const browser = await getBrowser();

    // const page = await browser.newPage();

    // await page.setContent(

    //   finalHTML,

    //   {
    //     waitUntil: "domcontentloaded",

    //     timeout: 0
    //   }
    // );

    // // PDF BUFFER

    // const pdfBuffer =
    //   await page.pdf({

    //     format: "A4",

    //     printBackground: true,

    //     margin: {

    //       top: "20px",

    //       bottom: "20px",

    //       left: "20px",

    //       right: "20px"
    //     }
    //   });

    // await page.close();

    // await browser.close();

    // RESPONSE

    return new NextResponse(

      finalPDF,

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
