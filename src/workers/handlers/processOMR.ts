import fs from "fs";
import path from "path";

import { format } from "date-fns";

import { type Job } from "bullmq";

import prisma from "@/libs/prisma";

import { getBrowser } from "@/libs/puppeteerBrowser";

import { getAgencyImagePath } from "@/configs/customDataConfig";

import { decrypt, maskAadhaar } from "@/utils/encryption";

export const runtime = "nodejs";

const imageCache = new Map<string, string>();

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
  batchDetails?: {
    batchName: string;
    assessmentDate: string;
  },
  candidates?: {
    candidate_name: string;
    candidate_id: string;
    aadhaar_no: string | null;
    theory_papers: {
      id: number;
      paper_code: string;
    }[];
  }[]
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

  let allSheetsHTML = "";

  if (candidates && candidates.length > 0) {
    for (const candidate of candidates) {

      const aadhaar =
      candidate?.aadhaar_no
        ? maskAadhaar(
            decrypt(candidate.aadhaar_no)
          )
        : "";

      const paperCode = candidate.theory_papers.length > 0
        ? candidate.theory_papers[0].paper_code
        : "";

      allSheetsHTML += `
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
                <td><div style="margin-bottom: 18px;">Name of the Candidate:- <strong>${candidate?.candidate_name}</strong></div></td>
              </tr>
              <tr>
                <td>
                  <div class="candidate-details">
                    <div>Candidate Id:- <strong>${candidate?.candidate_id}</strong></div>
                    <div>Aadhaar Card No.:- <strong>${aadhaar}</strong></div>
                    <div>Batch Id.:- <strong>${batchDetails?.batchName}</strong></div>
                    <div>Date of Assessment:- <strong>${batchDetails?.assessmentDate}</strong></div>
                    <div>Paper Code:- <strong>${paperCode}</strong></div>
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
      `
    }
  } else {
    allSheetsHTML = "";
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

          /* margin:0.5in;

          padding:8px; */

          font-family:Arial, sans-serif;

          background:#fff;
        }

        @page {
          margin: 0.5in;
          padding: 8px;
        }

        .sheet{

          width:100%;

          border:3px solid #000;

          padding:12px;

          position:relative;
          page-break-after: always;
        }

        .sheet:last-child{
          page-break-after:avoid;
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

          /* border:1px solid var(--border-color); */

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

      ${allSheetsHTML}

    </body>

  </html>
  `;
}

export const processOMRSheet = async (job: Job) => {
  const { jobId } = job.data;

  if (!jobId) {
    throw new Error("Invalid job data");
  }

  try {

    // ================= UPDATE JOB =================

    const dbJob = await prisma.jobs.update({
      where: {
        id: Number(jobId)
      },
      data: {
        status: "processing",
        progress: 5,
        started_at: new Date()
      }
    });

    await job.updateProgress(5);

    // Batch

    const batch = await prisma.batches.findUnique({
      where: { id: dbJob.reference_id },
      select: {
        id: true,
        batch_name: true,
        assessment_start_datetime: true,
        agency: {
          select: {
            id: true,
            company_name: true,
            avatar: true,
          }
        },
        students: {
          select: {
            id: true,
            candidate_name: true,
            candidate_id: true,
            aadhaar_no: true,
            theory_papers: {
              select: {
                id: true,
                paper_code: true,
              }
            }
          },
          orderBy: {
            candidate_name: "asc"
          }
        }
      }
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    await prisma.jobs.update({
      where: {
        id: Number(jobId)
      },
      data: {
        progress: 20
      }
    });

    await job.updateProgress(20);

    const agency = batch.agency;
    const candidateData = batch?.students;

    const questions = 100;
    const options = ["A", "B", "C", "D"];

    const browser = await getBrowser();

    const page = await browser.newPage();

    try {

      let logo = '';

      if (agency.avatar) {
        logo = fileToBase64(getAgencyImagePath(agency.id, agency.avatar));
      }

      const html = generateOMRHTML(agency.company_name, questions, options, logo, {
        batchName: batch?.batch_name || "",
        assessmentDate: batch?.assessment_start_datetime ? format(batch.assessment_start_datetime, "dd-MM-yyyy") : ""
      }, candidateData);

      await page.setContent(html, {
        waitUntil: "domcontentloaded",
      });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      await prisma.jobs.update({
        where: {
          id: Number(jobId)
        },
        data: {
          progress: 60
        }
      });

      await job.updateProgress(60);

      // await browser.close();

      const pdfBuffer = Buffer.from(pdf);

      const filename =
            `${batch.batch_name}_omr_sheet.pdf`
              .replace(/\s+/g, "_")
              .replace(/[^a-zA-Z0-9-_\.]/g, "");

      const relativeFilePath = path.join(
        "storage",
        "uploads",
        "agency",
        "batches",
        batch.id.toString(),
        "omr-sheet",
        filename
      );

      const finalFilePath = path.join(
        process.cwd(),
        relativeFilePath
      );

      const finalDir = path.dirname(
        finalFilePath
      );

      await prisma.jobs.update({
        where: {
          id: Number(jobId)
        },
        data: {
          progress: 80
        }
      });

      await job.updateProgress(80);

      try {

        await fs.promises.mkdir(finalDir, {
          recursive: true
        });

        await fs.promises.writeFile(
          finalFilePath,
          pdfBuffer
        );

        await prisma.batches.update({
          where:{
            id: batch.id
          },
          data: {
            omr_sheet: filename
          }
        })

        // RESPONSE

        const normalizedFilePath = relativeFilePath.replace(/\\/g, "/");

        await prisma.jobs.update({
          where: { id: Number(jobId) },
          data: {
            status: "completed",
            progress: 100,
            completed_at: new Date(),
            file_path: normalizedFilePath
          }
        });

        await job.updateProgress(100);

      } catch (error) {
        console.error(`[${new Date().toLocaleDateString()}] error in batch omr sheet store:`, error);

        if (fs.existsSync(finalFilePath)) {
          await fs.promises.unlink(finalFilePath);
        }

        throw new Error("Error in storing OMR sheet");
      }


    } catch (error) {
      console.error(`[${new Date().toLocaleDateString()}] error in batch omr sheet store:`, error);

      throw new Error("Error in generating OMR sheet");

    } finally {
      await page.close();
    }

  } catch (error) {

    await prisma.jobs.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error"
      }
    })

    throw error;
  }
}
