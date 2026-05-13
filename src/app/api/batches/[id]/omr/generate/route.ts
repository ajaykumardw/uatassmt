import fs from "fs";
import path from "path";

import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { format } from "date-fns";

import prisma from "@/libs/prisma";

import { authOptions } from "@/libs/auth";

import { getBrowser } from "@/libs/puppeteerBrowser";

import { getAgencyImagePath } from "@/configs/customDataConfig";

import { decrypt, maskAadhaar } from "@/utils/encryption";

export const runtime = "nodejs";

// function generateOMRHTML(
//   questions: number,
//   options: string[]
// ) {

//   const questionsPerColumn = 25;
//   const columnsPerPage = 2;

//   const questionsPerPage =
//     questionsPerColumn * columnsPerPage;

//   const totalPages = Math.ceil(
//     questions / questionsPerPage
//   );

//   let pagesHTML = "";

//   for (let page = 0; page < totalPages; page++) {

//     let pageColumns = "";

//     for (
//       let col = 0;
//       col < columnsPerPage;
//       col++
//     ) {

//       const start =
//         page * questionsPerPage +
//         col * questionsPerColumn +
//         1;

//       const end = Math.min(
//         start + questionsPerColumn - 1,
//         questions
//       );

//       if (start > questions) continue;

//       let rows = "";

//       for (let i = start; i <= end; i++) {

//         rows += `
//           <tr>

//             <td class="qno">${i}</td>

//             ${options.map(opt => `
//               <td>
//                 <div class="bubble">${opt}</div>
//               </td>
//             `).join("")}

//           </tr>
//         `;
//       }

//       pageColumns += `
//         <table class="omr-table">

//           <thead>
//             <tr>
//               <th>Q</th>

//               ${options.map(opt => `
//                 <th>${opt}</th>
//               `).join("")}

//             </tr>
//           </thead>

//           <tbody>
//             ${rows}
//           </tbody>

//         </table>
//       `;
//     }

//     pagesHTML += `

//       <div class="page">

//         <div class="sheet">

//           <div class="title">
//             OMR ANSWER SHEET
//           </div>

//           <div class="omr-grid">
//             ${pageColumns}
//           </div>

//         </div>

//       </div>
//     `;
//   }

//   // const perColumn = 25;

//   // const totalColumns = Math.ceil(
//   //   questions / perColumn
//   // );

//   // let columnsHTML = "";

//   // for (let col = 0; col < totalColumns; col++) {

//   //   let rows = "";

//   //   const start =
//   //     col * perColumn + 1;

//   //   const end = Math.min(
//   //     start + perColumn - 1,
//   //     questions
//   //   );

//   //   for (let i = start; i <= end; i++) {

//   //     rows += `
//   //       <tr>
//   //         <td class="qno">${i}</td>

//   //         ${options.map(opt => `
//   //           <td>
//   //             <div class="bubble"></div>
//   //             <div class="opt-label">${opt}</div>
//   //           </td>
//   //         `).join("")}

//   //       </tr>
//   //     `;
//   //   }

//   //   columnsHTML += `
//   //     <table class="omr-table">
//   //       <thead>
//   //         <tr>
//   //           <th>Q</th>

//   //           ${options.map(opt => `
//   //             <th>${opt}</th>
//   //           `).join("")}

//   //         </tr>
//   //       </thead>

//   //       <tbody>
//   //         ${rows}
//   //       </tbody>
//   //     </table>
//   //   `;
//   // }

//   return `
//   <!DOCTYPE html>

//   <html>

//     <head>

//       <style>

//         *{
//           box-sizing:border-box;
//         }

//         body{
//           margin:0;
//           padding:20px;
//           font-family:Arial, sans-serif;
//           background:#fff;
//         }

//         .sheet{

//           width:100%;
//           border:3px solid #000;
//           padding:20px;
//           position:relative;
//         }

//         .title{
//           text-align:center;
//           font-size:28px;
//           font-weight:bold;
//           margin-bottom:20px;
//         }

//         .student-info{
//           display:grid;
//           grid-template-columns:1fr 1fr;
//           gap:20px;
//           margin-bottom:25px;
//         }

//         .field{
//           border:2px solid #000;
//           padding:10px;
//           font-size:14px;
//           height:45px;
//         }

//         .omr-grid{
//           display:flex;
//           gap:20px;
//           justify-content:space-between;
//         }

//         .omr-table{
//           width:100%;
//           border-collapse:collapse;
//         }

//         .omr-table th,
//         .omr-table td{
//           border:1px solid #000;
//           text-align:center;
//           padding:4px;
//           font-size:12px;
//         }

//         .qno{
//           font-weight:bold;
//           width:30px;
//         }

//         .bubble{
//           width:18px;
//           height:18px;
//           border:2px solid #000;
//           border-radius:50%;
//           margin:auto;
//         }

//         .opt-label{
//           font-size:9px;
//           margin-top:2px;
//         }

//         .corner{
//           width:25px;
//           height:25px;
//           background:#000;
//           position:absolute;
//         }

//         .tl{
//           top:0;
//           left:0;
//         }

//         .tr{
//           top:0;
//           right:0;
//         }

//         .bl{
//           bottom:0;
//           left:0;
//         }

//         .br{
//           bottom:0;
//           right:0;
//         }

//       </style>

//     </head>

//     <body>

//       <div class="sheet">

//         <div class="corner tl"></div>
//         <div class="corner tr"></div>
//         <div class="corner bl"></div>
//         <div class="corner br"></div>

//         <div class="title">
//           OMR ANSWER SHEET
//         </div>

//         <div class="student-info">

//           <div class="field">
//             Student Name
//           </div>

//           <div class="field">
//             Roll Number
//           </div>

//           <div class="field">
//             Exam Name
//           </div>

//           <div class="field">
//             Subject
//           </div>

//         </div>

//         <div class="omr-grid">
//           ${pagesHTML}
//         </div>

//       </div>

//     </body>

//   </html>
//   `;
// }


const imageCache =
  new Map<string, string>();

function fileToBase64(
  relativePath: string
) {

  if (!relativePath) {
    return "";
  }

  if (
    imageCache.has(relativePath)
  ) {

    return imageCache.get(
      relativePath
    )!;
  }

  const cleanedPath =
    relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;

  const absolutePath =
    path.join(
      process.cwd(),
      cleanedPath
    );

  if (
    !fs.existsSync(
      absolutePath
    )
  ) {

    console.log(
      "File not found:",
      absolutePath
    );

    return "";
  }

  const ext =
    path.extname(
      absolutePath
    )
      .substring(1)
      .toLowerCase();

  const mime =
    ext === "jpg" ||
      ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : `image/${ext}`;

  const buffer =
    fs.readFileSync(
      absolutePath
    );

  const base64 =
    `data:${mime};base64,${buffer.toString("base64")}`;

  imageCache.set(
    relativePath,
    base64
  );

  return base64;
}

function generateOMRHTML(
  title: string | null = "OMR ANSWER SHEET",
  questions: number,
  options: string[],
  logo?: string,
  candidate?: {
    name: string;
    candidateId: string;
    aadhaar: string;
    batchId: string;
    assessmentDate: string;
  }
) {

  // ================= DYNAMIC COLUMNS =================

  const columns =
    questions <= 50
      ? 2
      : questions <= 100
        ? 4
        : questions <= 150
          ? 5
          : 6;

  const questionsPerColumn =
    Math.ceil(questions / columns);

  let columnsHTML = "";

  // ================= GENERATE COLUMNS =================

  for (let col = 0; col < columns; col++) {

    let rows = "";

    const start =
      col * questionsPerColumn + 1;

    const end = Math.min(
      start + questionsPerColumn - 1,
      questions
    );

    for (let i = start; i <= end; i++) {

      rows += `
        <tr>

          <td class="qno">
            ${i}
          </td>

          <td class="opt-cell">
            <div class="bubble-cell">
            ${options.map((opt) => `

              <div class="bubble">${opt}</div>

            `).join("")}
            </div>
          </td>

        </tr>
      `;
    }

    columnsHTML += `
      <table class="omr-table">

        <tbody>
          ${rows}
        </tbody>

      </table>
    `;
  }

  // ================= FINAL HTML =================

  return `
  <!DOCTYPE html>

  <html>

    <head>

      <meta charset="UTF-8" />

      <style>

        *{
          box-sizing:border-box;
        }

        :root{
          --border-color: #8b1555;
        }

        body{

          margin:0.5in;

          padding:8px;

          font-family:Arial, sans-serif;

          background:#fff;
        }

        .sheet{

          width:100%;

          border:3px solid #000;

          padding:12px;

          position:relative;
        }

        .title-section{
          display:flex;
          align-items:center;
        }

        .title-section img{
          height:80px;
          margin-right:80px;
          margin-bottom:4px;
          object-fit:contain;
        }

        .title{

          text-align:center;

          font-size:22px;

          font-weight:bold;

          margin-bottom:15px;

          letter-spacing:1px;

          text-transform:uppercase;
        }

        .student-info{

          display:grid;

          grid-template-columns:1fr 1fr;

          gap:10px;

          margin-bottom:15px;
        }

        .field{

          border:2px solid #000;

          padding:8px;

          height:38px;

          font-size:12px;

          display:flex;

          align-items:center;
        }

        .omr-grid{

          display:grid;

          grid-template-columns:
            repeat(auto-fit, minmax(120px, 1fr));

          gap:12px;
        }

        .omr-table{

          width:100%;

          border-collapse:collapse;

          table-layout:fixed;
        }

        .omr-table th,
        .omr-table td{

          // border:1px solid var(--border-color);

          text-align:center;

          padding:3px 2px;

          font-size:9px;
        }

        .omr-table td:first-child{

          border-left:1px solid var(--border-color);
          border-right:1px solid var(--border-color);
        }

        .omr-table td:last-child{
          border-right:1px solid var(--border-color);
        }

        .omr-table tr:first-child td{
          border-top:1px solid var(--border-color);
        }

        .omr-table tr:last-child td{
          border-bottom:1px solid var(--border-color);
        }

        .omr-table tr:nth-child(10n+1) td,
        .omr-table tr:nth-child(10n+2) td,
        .omr-table tr:nth-child(10n+3) td,
        .omr-table tr:nth-child(10n+4) td,
        .omr-table tr:nth-child(10n+5) td{
          background:#f7c9de;
        }

        .omr-table th{

          background:#f2f2f2;

          font-weight:bold;
        }

        .qno{

          width:28px;

          color: var(--border-color);

          font-weight:bold;

          font-size:9px;
        }

        .opt-cell{

          padding:1px;
        }

        .bubble-cell{

          display:flex;
          gap:4px;
          align-items:center;
          justify-content:start;
          display:flex;
        }

        .bubble{

          width:18px;

          height:18px;

          border:1.5px solid var(--border-color);

          border-radius:50%;

          margin:auto;

          display:flex;

          align-items:center;

          justify-content:center;

          font-size:8px;

          font-weight:bold;

          line-height:0;

          text-align:center;

          background:#fff;

          color: var(--border-color);
        }

        .opt-text{

          font-size:7px;

          line-height:1;
        }

        /* ===== SCAN MARKERS ===== */

        .corner{

          width:18px;

          height:18px;

          background:#000;

          position:absolute;
        }

        .tl{
          top:0;
          left:0;
        }

        .tr{
          top:0;
          right:0;
        }

        .bl{
          bottom:0;
          left:0;
        }

        .br{
          bottom:0;
          right:0;
        }

        .can-table {
        	width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .can-table td {
        	border: 1px solid;
          vertical-align: top;
          padding: 4px;
		    }

        .can-table * {
          font-size: 12px;
          line-height: 1.2;
          margin: 0;
          padding: 0;
        }

        .can-table ol {
          padding-left: 16px;
          margin-top: 4px;
        }

        .can-table li {
          margin-bottom: 2px;
        }

        .candidate-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sign-sec {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-top: 10px;
          border: 1px solid;
          padding: 60px 20px 10px;
        }

        .sign-sec * {
          font-size: 12px;
          line-height: 1.2;
        }

        /* ===== PRINT ===== */

        @media print {

          body{
            padding:0;
          }

          .sheet{
            border-width:2px;
          }
        }

      </style>

    </head>

    <body>

      <div class="sheet">

        <!-- SCAN MARKERS -->

        <!--<div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>-->

        <!-- TITLE -->

        <div class="title-section">
          ${logo && `
            <img src="${logo}" alt="Logo" />
          `}
          <div class="title">
            ${title}
          </div>
        </div>

        <!-- STUDENT INFO -->

        <!-- <div class="student-info">

          <div class="field">
            Student Name
          </div>

          <div class="field">
            Roll Number
          </div>

          <div class="field">
            Exam Name
          </div>

          <div class="field">
            Subject
          </div>

        </div> -->
        <table class="can-table">
          <tbody>
            <tr>
              <td rowspan="2">
                <div>
                  <strong>General Instruction:</strong>
                  <ol>
                    <li>Fill all the required details(Mandatory)</li>
                    <li>Circle & shade the correct option</li>
                    <li>Do not scribble on the OMR sheet</li>
                    <li>Use blue/black ball point pen only</li>
                    <li>Multiple answer for the same question will not be evaluated</li>
                    <li>No negative mark for wrong answer</li>
                  </ol>
                </div>
              </td>
              <td><div style="margin-bottom: 18px;">Name of the Candidate:- <strong>${candidate?.name}</strong></div></td>
            </tr>
            <tr>
              <td>
                <div class="candidate-details">
                  <div>Candidate Id:- <strong>${candidate?.candidateId}</strong></div>
                  <div>Aadhaar Card No.:- <strong>${candidate?.aadhaar}</strong></div>
                  <div>Batch Id.:- <strong>${candidate?.batchId}</strong></div>
                  <div>Date of Assessment:- <strong>${candidate?.assessmentDate}</strong></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="font-size:14px;text-align:center; margin:10px 0px;">Answers</div>

        <!-- QUESTIONS -->

        <div class="omr-grid">
          ${columnsHTML}
        </div>

        <div class="sign-sec">
          <div>Candidate's Signature</div>
          <div>Assessor's Signature</div>
          <div>TP Stamp & Signature</div>
        </div>

      </div>

    </body>

  </html>
  `;
}

export async function POST(req: NextRequest) {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user.agency_id);

  if (!session || !agency_id) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized"
      },
      { status: 401 }
    );
  }

  const agency = await prisma.users.findUnique({
    where: { id: agency_id },
    select: {
      id: true,
      company_name: true,
      avatar: true,
    }
  });

  const candidateData = await prisma.students.findUnique({
    where: {
      id: 2780
    },
    select: {
      candidate_name: true,
      candidate_id: true,
      aadhaar_no: true,
      batch: {
        select: {
          batch_name: true,
          assessment_start_datetime: true,
        }
      }
    }
  })

  const candidate = candidateData ? {
    name: candidateData.candidate_name,
    candidateId: candidateData.candidate_id,
    aadhaar: candidateData.aadhaar_no ? maskAadhaar(decrypt(candidateData.aadhaar_no)) : "",
    batchId: candidateData.batch.batch_name || "",
    assessmentDate: candidateData.batch.assessment_start_datetime ? format(candidateData.batch.assessment_start_datetime, "dd-MM-yyyy") : ""
  } : undefined;

  if (!agency) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized"
      },
      { status: 401 }
    );
  }

  const { questions = 100, options = ["A", "B", "C", "D"] } = await req.json();

  const browser = await getBrowser();

  const page = await browser.newPage();

  try {

    let logo = '';

    if (agency.avatar) {
      logo = fileToBase64(getAgencyImagePath(agency.id, agency.avatar));
    }

    const html = generateOMRHTML(agency.company_name, questions, options, logo, candidate);

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // await browser.close();

    const pdfBuffer = Buffer.from(pdf);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="omr-sheet.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
      },
      { status: 500 }
    );
  } finally {
    await page.close();
  }
}
