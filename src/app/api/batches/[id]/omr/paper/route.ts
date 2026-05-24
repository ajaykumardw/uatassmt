
// app/api/offline-exam/generate/[id]/route.ts

// import fs from "fs";
// import path from "path";

// import crypto from "crypto";

import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

// import { format } from "date-fns";

// import { PDFDocument } from "pdf-lib";

import { authOptions } from "@/libs/auth";

// import prisma from "@/libs/prisma";

// import QRCode from "qrcode";

// import { getBrowser } from "@/libs/puppeteerBrowser";

import { createQuestionPaperJob } from "@/services/job.service";

// import { getAgencyImagePath, getSSCImagePath } from "@/configs/customDataConfig";


// const imageCache =
//   new Map<string, string>();

// function fileToBase64(
//   relativePath: string
// ) {

//   if (!relativePath) {
//     return "";
//   }

//   if (
//     imageCache.has(relativePath)
//   ) {

//     return imageCache.get(
//       relativePath
//     )!;
//   }

//   const cleanedPath =
//     relativePath.startsWith("/")
//       ? relativePath.substring(1)
//       : relativePath;

//   const absolutePath =
//     path.join(
//       process.cwd(),
//       cleanedPath
//     );

//   if (
//     !fs.existsSync(
//       absolutePath
//     )
//   ) {

//     console.log(
//       "File not found:",
//       absolutePath
//     );

//     return "";
//   }

//   const ext =
//     path.extname(
//       absolutePath
//     )
//       .substring(1)
//       .toLowerCase();

//   const mime =
//     ext === "jpg" ||
//       ext === "jpeg" ||
//       ext === "jfif"
//       ? "image/jpeg"
//       : ext === "png"
//         ? "image/png"
//         : ext === "webp"
//           ? "image/webp"
//           : `image/${ext}`;

//   const buffer =
//     fs.readFileSync(
//       absolutePath
//     );

//   const base64 = `data:${mime};base64,${buffer.toString("base64")}`;

//   imageCache.set(
//     relativePath,
//     base64
//   );

//   return base64;
// }

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

// async function generatePDF(page: any, browser: any, html: string, headerHtml: string) {
//   // const page = await browser.newPage();

//   await page.setContent(html, {
//     waitUntil: "domcontentloaded",
//   });

//   const pdf = await page.pdf({
//     format: "A4",
//     printBackground: true,
//     displayHeaderFooter: true,
//     headerTemplate: `
//       <div style="
//         width: 100%;
//         font-size: 10px;
//         padding: 0 20px;
//         margin: 20px 40px 20px 40px;
//         box-sizing: border-box;
//         border-bottom: 2px solid #000;
//       ">
//         ${headerHtml}
//       </div>
//     `,
//     footerTemplate: `
//       <div style="
//         width: 100%;
//         text-align: center;
//         font-size: 10px;
//       ">
//         Page <span class="pageNumber"></span> / <span class="totalPages"></span>
//       </div>
//     `,
//     margin: {

//       top: "0px",

//       bottom: "60px",

//       left: "20px",

//       right: "20px"
//     }
//   });

//   // await page.close();

//   return Buffer.from(pdf);
// }

// async function mergePDFs(buffers: Buffer[]) {
//   const merged = await PDFDocument.create();

//   for (const buf of buffers) {
//     const pdf = await PDFDocument.load(buf);

//     const pages = await merged.copyPages(
//       pdf,
//       pdf.getPageIndices()
//     );

//     pages.forEach((p) => merged.addPage(p));
//   }

//   return Buffer.from(await merged.save());
// }

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

    const job = createQuestionPaperJob(

      batchId,
      userId
    );

    return NextResponse.json({
      job
    });

    // // FETCH BATCH

    // const batch =
    //   await prisma.batches.findUnique({
    //     where: {
    //       id: batchId,
    //       agency_id: userId
    //     },
    //     select: {
    //       id: true,
    //       batch_name: true,
    //       assessment_start_datetime: true,
    //       qualification_pack: {
    //         select: {
    //           id: true,
    //           qualification_pack_name: true,
    //           total_theory_marks: true,
    //           ssc: {
    //             select: {
    //               id: true,
    //               ssc_name: true,
    //               ssc_image: true,
    //             }
    //           }
    //         }
    //       },
    //       agency: {
    //         select: {
    //           id: true,
    //           company_name: true,
    //           avatar: true
    //         }
    //       },
    //       theory_exam_set: {
    //         select: {
    //           id: true,
    //           set_name: true,
    //           total_questions: true,
    //           exam_duration: true,
    //           exam_sets_questions: {
    //             select: {
    //               id: true,
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
    //                   pc_questions: {
    //                     select: {
    //                       pc: {
    //                         select: {
    //                           id: true,
    //                           nos_id: true,
    //                           nos: {
    //                             select: {
    //                               nos_id: true,
    //                               nos_name: true
    //                             }
    //                           }
    //                         }
    //                       }
    //                     }
    //                   }
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
    //         },
    //         orderBy: {
    //           candidate_name: "asc"
    //         }
    //       },
    //     },
    //   });

    // if (!batch) {

    //   return NextResponse.json({

    //     message:
    //       "Batch not found"

    //   }, { status: 404 });
    // }

    // if (!batch.theory_exam_set) {

    //   return NextResponse.json({

    //     message:
    //       "Theory exam set not found"

    //   }, { status: 400 });
    // }

    // // DELETE OLD PAPERS

    // await prisma
    //   .offline_candidate_papers
    //   .deleteMany({

    //     where: {

    //       batch_id: batch.id,

    //       exam_set_id:
    //         batch.theory_exam_set.id
    //     }
    //   });

    // // MEMORY ARRAY

    // const papersData = [];

    // // LOOP STUDENTS

    // for (
    //   const student
    //   of batch.students
    // ) {

    //   let questions = [

    //     ...batch.theory_exam_set.exam_sets_questions
    //   ];

    //   // RANDOM QUESTIONS

    //   const nosGroups =
    //     new Map<number, typeof questions>();

    //   for (const item of questions) {

    //     const firstPC =
    //       item.questions
    //         .pc_questions?.[0];

    //     if (!firstPC) {
    //       continue;
    //     }

    //     const nosId =
    //       firstPC.pc.nos_id;

    //     if (!nosGroups.has(nosId)) {

    //       nosGroups.set(
    //         nosId,
    //         []
    //       );
    //     }

    //     nosGroups
    //       .get(nosId)!
    //       .push(item);
    //   }

    //   const finalQuestions = [];

    //   // SORT NOS BY NAME
    //   const sortedNOS =
    //     Array.from(
    //       nosGroups.entries()
    //     ).sort(
    //       ([, a], [, b]) => {

    //         const nameA =
    //           a[0]
    //             ?.questions
    //             ?.pc_questions?.[0]
    //             ?.pc
    //             ?.nos
    //             ?.nos_id || "";

    //         const nameB =
    //           b[0]
    //             ?.questions
    //             ?.pc_questions?.[0]
    //             ?.pc
    //             ?.nos
    //             ?.nos_id || "";

    //         return nameA.localeCompare(nameB);
    //       }
    //     );

    //   for (
    //     const [, nosQuestions]
    //     of sortedNOS
    //   ) {

    //     // RANDOM QUESTIONS INSIDE NOS
    //     finalQuestions.push(

    //       ...shuffleArray(
    //         nosQuestions
    //       )
    //     );
    //   }

    //   questions = finalQuestions;

    //   // MAPPING

    //   const mapping =
    //     questions.map(

    //       (item, index) => {

    //         const question =
    //           item.questions;

    //         const availableOptions = [

    //           question.option1,
    //           question.option2,
    //           question.option3,
    //           question.option4,
    //           question.option5

    //         ]
    //           .map(
    //             (
    //               value,
    //               idx
    //             ) => ({

    //               index:
    //                 idx + 1,

    //               value
    //             })
    //           )
    //           .filter(
    //             option =>
    //               option.value
    //           );

    //         // RANDOM OPTIONS

    //         const shuffledOptions =

    //           shuffleArray(
    //             availableOptions
    //           );

    //         // CORRECT OPTION

    //         const correctOption =

    //           shuffledOptions.findIndex(

    //             option =>

    //               option.index ===
    //               question.answer

    //           ) + 1;

    //         return {

    //           question_no:
    //             index + 1,

    //           question_id:
    //             question.id,

    //           options:

    //             shuffledOptions.map(

    //               option =>
    //                 option.index
    //             ),

    //           correct_option: correctOption,
    //           marks: item.marks
    //         };
    //       }
    //     );

    //   // PAPER CODE

    //   const paperCode =

    //     crypto.randomUUID()
    //       .slice(0, 8)
    //       .toUpperCase();

    //   // PUSH MEMORY

    //   papersData.push({

    //     batch_id:
    //       batch.id,

    //     student_id:
    //       student.id,

    //     exam_set_id:
    //       batch.theory_exam_set.id,

    //     paper_code:
    //       paperCode,

    //     mapping,

    //     question_count:
    //       mapping.length,

    //     created_by:
    //       userId
    //   });
    // }

    // // TRANSACTION INSERT

    // await prisma.$transaction(

    //   papersData.map(

    //     data =>

    //       prisma
    //         .offline_candidate_papers
    //         .create({

    //           data
    //         })
    //   )
    // );

    // // FETCH PAPERS

    // const papers =
    //   await prisma
    //     .offline_candidate_papers
    //     .findMany({

    //       where: {

    //         batch_id:
    //           batch.id,

    //         exam_set_id:
    //           batch.theory_exam_set.id
    //       },

    //       select: {
    //         id: true,
    //         paper_code: true,
    //         mapping: true,
    //         student: {
    //           select: {
    //             id: true,
    //             candidate_id: true,
    //             candidate_name: true,
    //           }
    //         }
    //       },
    //       orderBy: {
    //         id: "asc"
    //       }
    //     });

    // // FETCH ALL QUESTIONS

    // const questionIds =

    //   papers.flatMap(

    //     paper =>

    //       (
    //         paper.mapping as any[]
    //       ).map(

    //         item =>
    //           item.question_id
    //       )
    //   );

    // const uniqueQuestionIds =

    //   [...new Set(questionIds)];

    // const questions =
    //   await prisma.questions.findMany({

    //     where: {

    //       id: {

    //         in:
    //           uniqueQuestionIds
    //       }
    //     },
    //     select: {
    //       id: true,
    //       question: true,
    //       option1: true,
    //       option2: true,
    //       option3: true,
    //       option4: true,
    //       option5: true,
    //       answer: true,
    //       pc_questions: {
    //         select: {
    //           pc: {
    //             select: {
    //               nos: {
    //                 select: {
    //                   nos_id: true,
    //                   nos_name: true
    //                 }
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   });

    // // QUESTION MAP

    // const questionMap =
    //   new Map(

    //     questions.map(

    //       q => [q.id, q]
    //     )
    //   );

    // // HTML

    // const browser = await getBrowser();

    // // const pdfBuffers: Buffer[] = [];

    // let sscLogo = "";
    // let agencyLogo = "";

    // if (batch.qualification_pack.ssc.ssc_image) {
    //   sscLogo = fileToBase64(getSSCImagePath(batch.qualification_pack.ssc.id, batch.qualification_pack.ssc.ssc_image));
    // }

    // if (batch.agency.avatar) {
    //   agencyLogo = fileToBase64(getAgencyImagePath(batch.agency.id, batch.agency.avatar));
    // }

    // const setName = batch.theory_exam_set.set_name || "";
    // const totalQuestions = batch.theory_exam_set.total_questions || 0;
    // const durationInMinutes = batch.theory_exam_set.exam_duration || 0;

    // const duration =
    //   durationInMinutes >= 60
    //     ? `${Math.floor(durationInMinutes / 60)}:${String(durationInMinutes % 60).padStart(2, '0')} ${
    //         Math.floor(durationInMinutes / 60) === 1 ? 'hr' : 'hrs'
    //       }`
    //     : `${durationInMinutes} ${
    //         durationInMinutes === 1 ? 'min' : 'mins'
    //       }`;

    // const totalMarks = batch.qualification_pack.total_theory_marks || 0;

    // const masterPdf = await PDFDocument.create();
    // const page = await browser.newPage();

    // // LOOP PAPERS

    // for (
    //   const paper
    //   of papers
    // ) {

    //   const mapping =
    //     paper.mapping as any[];

    //   // PRECOMPUTE NOS MARKS
    //   const nosMarksMap = new Map<string, number>();

    //   for (const mapItem of mapping) {

    //     const q =
    //       questionMap.get(
    //         mapItem.question_id
    //       );

    //     if (!q) continue;

    //     const nosName =
    //       q.pc_questions?.[0]
    //         ?.pc?.nos?.nos_name || "";

    //     nosMarksMap.set(
    //       nosName,
    //       (nosMarksMap.get(nosName) || 0) +
    //       Number(mapItem.marks || 0)
    //     );
    //   }

    //   // QUESTIONS HTML

    //   let questionsHTML = "";
    //   let currentNOS = "";

    //   for (
    //     const item
    //     of mapping
    //   ) {

    //     const question =

    //       questionMap.get(
    //         item.question_id
    //       );

    //     if (!question) {
    //       continue;
    //     }

    //     const firstPC =
    //       question.pc_questions?.[0];

    //     const nosId = firstPC?.pc?.nos?.nos_id || "";

    //     const nosName =
    //       firstPC?.pc?.nos?.nos_name || "";

    //     // SHOW NOS HEADING
    //     if (currentNOS !== nosName) {

    //       currentNOS = nosName;

    //       // TOTAL NOS MARKS
    //       // const nosTotalMarks =
    //       //   mapping.reduce(
    //       //     (total, mapItem) => {

    //       //       const q =
    //       //         questionMap.get(
    //       //           mapItem.question_id
    //       //         );

    //       //       if (!q) {

    //       //         return total;
    //       //       }

    //       //       const qNosName =
    //       //         q.pc_questions?.[0]
    //       //           ?.pc?.nos?.nos_name || "";

    //       //       if (qNosName === nosName) {

    //       //         return total + Number(mapItem.marks || 0);
    //       //       }

    //       //       return total;

    //       //     }, 0
    //       //   );

    //       const nosTotalMarks = nosMarksMap.get(nosName) || 0;

    //       questionsHTML += `
    //         <div class="nos-heading">
    //           <div>${nosId} - ${nosName}</div>
    //           <div class="nos-marks">${nosTotalMarks} MARKS</div>
    //         </div>
    //       `;
    //     }

    //     const allOptions = [
    //       question.option1,
    //       question.option2,
    //       question.option3,
    //       question.option4,
    //       question.option5
    //     ];

    //     const printedOptions = item.options.map( ( optionIndex: number ) => allOptions[ optionIndex - 1 ] );

    //     questionsHTML += `
    //       <div class="question">
    //         <div class="question-title">
    //           <div>${item.question_no}) ${question.question}</div>
    //           <div>(${item.marks} Marks)</div>
    //         </div>
    //         <div class="options">
    //           ${printedOptions.map(
    //             (
    //               option: string,
    //               index: number
    //             ) => `
    //               <div class="option">
    //                 ${String.fromCharCode(
    //                   65 + index
    //                 )})
    //                 ${option}
    //               </div>
    //             `
    //           ).join("")}
    //         </div>
    //       </div>
    //     `;
    //   }

    //   // PAPER HTML

    //   const headerHtml = `
    //     <div>
    //       <div style="display:flex; justify-content:space-between; align-items:center; font-size: 11px; line-height:1.2;">
    //         <div>
    //           ${sscLogo && `<img src="${sscLogo}" height="80" style="margin:5px 0px; object-fit:contain; display:block;" />`}
    //         </div>
    //         <div>
    //           <p style="text-align:center;">
    //             <b style="font-size:14px;">
    //               Question Paper
    //               </br>
    //               ${batch.qualification_pack.qualification_pack_name}
    //               </br>
    //               ${setName}
    //             </b>
    //           </p>
    //         </div>
    //         <div>
    //           ${agencyLogo && `<img src="${agencyLogo}" height="80" style="margin: 5px 0px; object-fit:contain; display:block;" />`}
    //         </div>
    //       </div>
    //       <div style="display:flex; justify-content:space-between; margin-top: 1px; margin-bottom: 5px;">
    //         <div>
    //           <div><b>Candidate ID:</b> ${paper.student.candidate_id}</div>
    //           <div><b>Candidate Name:</b> ${paper.student.candidate_name}</div>
    //           <div><b>Paper Code:</b> ${paper.paper_code}</div>
    //           <div><b>Batch Name:</b> ${batch.batch_name}</div>
    //         </div>
    //         <div>
    //           <div><b>Questions:</b> ${totalQuestions}</div>
    //           <div><b>Total Marks:</b> ${totalMarks}</div>
    //           <div><b>Duration:</b> ${duration}</div>
    //           <div><b>Exam Date:</b> ${batch.assessment_start_datetime && format(new Date(batch.assessment_start_datetime), "dd-MM-yyyy")}</div>
    //         </div>
    //       </div>
    //     </div>
    //   `;


    //   const html = `

    //     <div class="paper">
    //       <div class="content">
    //         ${questionsHTML}
    //       </div>
    //     </div>
    //   `;

    //   const finalHtml = `
    //     <!DOCTYPE html>
    //     <html>
    //     <head>
    //       <meta charset="UTF-8" />
    //       <style>
    //         * {
    //           box-sizing: border-box;
    //           margin: 0;
    //           padding: 0;
    //         }

    //         @page {
    //           margin: 40px 40px 40px 40px;
    //           padding: 160px 20px 10px 20px;
    //           border: 2px solid black;
    //         }

    //         body{
    //           font-family: Arial, "Noto Sans Devanagari", sans-serif;
    //           font-size:14px;
    //           line-height:1.5;
    //         }

    //         .watermark {
    //           position: fixed;
    //           top: calc(50% - 80px);
    //           left: 50%;
    //           transform: translate(-50%, -50%);
    //         }

    //         .watermark img {
    //           opacity: 0.1;
    //           width: 500px;
    //           height: auto;
    //           display: block;
    //         }

    //         .paper{
    //           page-break-after:always;
    //           padding-bottom:30px;
    //         }

    //         .paper:last-child{
    //           page-break-after:auto;
    //         }

    //         .nos-heading{
    //           margin-top: 0px;
    //           margin-bottom: 15px;
    //           padding: 2px 12px;
    //           border: 1px solid #000;
    //           background: #f5f5f5;
    //           font-size: 12px;
    //           display: flex;
    //           justify-content: space-between;
    //           align-items: center;
    //         }

    //         .nos-heading * {
    //           font-size: 12px;
    //           font-weight: bold;
    //         }

    //         .nos-marks {
    //           border-left: 1px solid #000;
    //           padding-left: 10px;
    //           margin-left: 10px;
    //         }

    //         .question{
    //           margin-bottom: 6px;
    //         }

    //         .question *{
    //           font-size: 12px;
    //         }

    //         .question-title {
    //           display: flex;
    //           justify-content: space-between;
    //           align-items: center;
    //           gap: 4px;
    //         }

    //         .question-title *{
    //           font-weight:bold;
    //         }

    //         .options {
    //           display: grid;
    //           grid-template-columns: repeat(2, minmax(0, 1fr));
    //           column-gap: 40px;
    //           row-gap: 2px;
    //           margin-left: 20px;
    //         }

    //       </style>
    //     </head>
    //     <body>
    //       ${agencyLogo && `
    //         <div class="watermark">
    //           <img src="${agencyLogo}" alt="Agency Watermark" />
    //         </div>
    //       ` }
    //       ${html}
    //     </body>
    //     </html>
    //   `

    //   const pdf = await generatePDF(page, browser, finalHtml, headerHtml);

    //   const mPdf = await PDFDocument.load(pdf);
      
    //   const pages =
    //     await masterPdf.copyPages(
    //       mPdf,
    //       mPdf.getPageIndices()
    //     );
      
    //   pages.forEach((p) => masterPdf.addPage(p));

    //   // pdfBuffers.push(Buffer.from(pdf));

    // }

    // await page.close();

    // // const finalPDF = await mergePDFs(pdfBuffers);
    // const finalPDF = await masterPdf.save();

    // const filename =
    //   `${batch.batch_name}_QP.pdf`
    //     .replace(/\s+/g, "_")
    //     .replace(/[^a-zA-Z0-9-_\.]/g, "");

    // const relativeFilePath = path.join(
    //   "storage",
    //   "uploads",
    //   "agency",
    //   "batches",
    //   batch.id.toString(),
    //   "question-paper",
    //   filename
    // );

    // const finalFilePath = path.join(
    //   process.cwd(),
    //   relativeFilePath
    // );

    // const finalDir = path.dirname(
    //   finalFilePath
    // );

    // try {

    //   await fs.promises.mkdir(finalDir, {
    //     recursive: true
    //   });

    //   await fs.promises.writeFile(
    //     finalFilePath,
    //     finalPDF
    //   );

    //   await prisma.batches.update({
    //     where:{
    //       id: batch.id
    //     },
    //     data: {
    //       question_paper: filename
    //     }
    //   })

    //   // RESPONSE

    //   const normalizedFilePath = relativeFilePath.replace(/\\/g, "/");

    //   return NextResponse.json({
    //     status: "Success",
    //     message: "Question Paper created successfully.",
    //     data: {
    //       filePath: normalizedFilePath
    //     }
    //   })

    // } catch (error) {
    //   console.error(`[${new Date().toLocaleDateString()}] error in batch question paper store:`, error);

    //   if (fs.existsSync(finalFilePath)) {
    //     await fs.promises.unlink(finalFilePath);
    //   }

    //   return NextResponse.json({
    //     status: "Error",
    //     message: "Error in storing question paper"
    //   }, {status: 500})
    // }

    // return new NextResponse(

    //   finalPDF,

    //   {

    //     headers: {

    //       "Content-Type":"application/pdf",

    //       "Content-Disposition":`attachment; filename=${filename}`
    //     }
    //   }
    // );

  } catch (error) {

    console.error(error);

    return NextResponse.json({

      message:
        "Something went wrong"

    }, { status: 500 });
  }
}
