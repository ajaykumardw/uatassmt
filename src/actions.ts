"use server";

import fs from "fs";

import path from "path";

import { getBrowser } from "@/libs/puppeteerBrowser";
import notoSansDevanagari from "@/fonts/noto-sans-devanagari-base64";

const imageCache = new Map<string, string>();

async function imageToDataUri(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:image")) return url;
  const cached = imageCache.get(url);

  if (cached) return cached;

  try {
    const parsedUrl = new URL(url);
    let buffer: Buffer;
    let mimeType: string;

    if (parsedUrl.pathname.startsWith("/storage/uploads/")) {
      const relativePath = parsedUrl.pathname.replace("/storage/uploads/", "");
      const filePath = path.join(process.cwd(), "storage", "uploads", relativePath);

      if (!fs.existsSync(filePath)) return null;
      buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };

      mimeType = mimeMap[ext] || "image/png";
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
      mimeType = res.headers.get("content-type") || "image/png";
    }

    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    imageCache.set(url, dataUri);

    return dataUri;
  } catch {
    return null;
  }
}

export async function generateResultPdf(data: {
  candidateDetails: any;
  logDetail: any[];
  practicalReport: any[];
  vivaReport: any[];
  projectReport: any[];
  tabValue: string;
  selectedCandidate: string;
}) {

  const details = data.candidateDetails;

  const [logos, agencySign, tcSign] = await Promise.all([
    Promise.all([
      imageToDataUri(details?.agency_image),
      imageToDataUri(details?.ssc_image),
      imageToDataUri(details?.tp_image),
    ]),
    imageToDataUri(details?.agency_sign),
    imageToDataUri(details?.tc_sign),
  ]);

  const html = buildHtml({ ...data, _logos: logos, _agencySign: agencySign, _tcSign: tcSign });
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "load" });
  const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "10mm", bottom: "10mm", left: "5mm", right: "5mm" } });

  await page.close();

  return Buffer.from(pdf).toString("base64");
}

function buildHtml(data: any): string {
  const { candidateDetails, logDetail, practicalReport, vivaReport, projectReport, tabValue, _logos, _agencySign, _tcSign } = data;

  const isResultSheet = tabValue === "result_sheet";

  const passIcon = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#16a34a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12l5 5L20 7"/></svg>`);

  const failIcon = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#dc2626" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg>`);

  const summaryRows = candidateDetails?.summary_report?.map((row: any) => `
    <tr>
      <td>${row.sr_no}</td>
      <td>${row.nos_name}</td>
      <td>${row.total_marks}</td>
      <td>${row.obtained_marks}</td>
    </tr>
  `).join("") || "";

  // const td = "padding:2px 3px;border:1px solid #000";

  const tdC = `text-align:center`;
  const tdL = `text-align:left`;

  const theoryRows = (isResultSheet ? logDetail : []).map((item: any) => `
    <tr>
      <td>${item.sr_no}</td>
      <td>${item.nos_name}</td>
      <td>${item.pc_name}</td>
      <td>${item.question}</td>
      <td>${item.correct_answer}</td>
      <td>${item.candidate_response}</td>
      <td>${item.max_marks}</td>
      <td>${item.obtained_marks}</td>
    </tr>
  `).join("") || "";

  const isQuestionLog = tabValue === "question_wise_log";
  const isQuestionTime = tabValue === "question_wise_time_taken";

  const questionCol1Label = isQuestionLog ? "Correct Answer" : "Question open time (in hh:mm:ss)";
  const questionCol2Label = isQuestionLog ? "Candidate's Response" : "Question close time (in hh:mm:ss)";
  const questionCol3Label = isQuestionLog ? "Status" : "Duration";

  const questionCol1Width = isQuestionLog ? "32mm" : "30mm";
  const questionCol2Width = isQuestionLog ? "32mm" : "30mm";
  const questionCol3Width = isQuestionLog ? "13mm" : "17mm";

  const questionRows = (isQuestionLog || isQuestionTime ? logDetail : []).map((item: any) => `
    <tr>
      <td style="${tdC}">${item.sr_no}</td>
      <td style="${tdC}">${item.nos_name}</td>
      <td style="${tdC}">${item.pc_name}</td>
      <td style="${tdL}">${item.question}</td>
      <td style="${tdC}">${isQuestionLog ? item.correct_answer : item.open_time}</td>
      <td style="${tdC}">${isQuestionLog ? item.candidate_response : item.submit_time}</td>
      <td style="${tdC}">${isQuestionLog ? item.status === 1 ? `<img src="${passIcon}" style="width: 5mm; height: 5mm; object-fit: contain;" />` : item.status === 0 ? `<img src="${failIcon}" style="width: 5mm; height: 5mm; object-fit: contain;"  />` : "--" : item.duration}</td>
    </tr>
  `).join("") || "";

  const practicalRows = (practicalReport || []).map((item: any) => `
    <tr>
      <td style="${tdC}">${item.sr_no}</td>
      <td style="${tdC}">${item.nos_name}</td>
      <td style="${tdC}">${item.pc_name}</td>
      <td style="${tdL}">${item.question}</td>
      <td style="${tdC}">${item.max_marks}</td>
      <td style="${tdC}">${item.obtained_marks}</td>
    </tr>
  `).join("") || "";

  const vivaRows = (vivaReport || []).map((item: any) => `
    <tr>
      <td style="${tdC}">${item.sr_no}</td>
      <td style="${tdC}">${item.nos_name}</td>
      <td style="${tdC}">${item.pc_name}</td>
      <td style="${tdL}">${item.question}</td>
      <td style="${tdC}">${item.max_marks}</td>
      <td style="${tdC}">${item.obtained_marks}</td>
    </tr>
  `).join("") || "";

  const projectRows = (projectReport || []).map((item: any) => `
    <tr>
      <td style="${tdC}">${item.sr_no}</td>
      <td style="${tdC}">${item.nos_name}</td>
      <td style="${tdC}">${item.pc_name}</td>
      <td style="${tdC}">${item.max_marks}</td>
      <td style="${tdC}">${item.obtained_marks}</td>
    </tr>
  `).join("") || "";

  const [agencyLogo, sscLogo, tpLogo] = _logos || [];

  const logosHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
      <div style="width:30mm;height:30mm;display:flex;align-items:center;justify-content:center">${agencyLogo ? `<img src="${agencyLogo}" style="max-width:30mm;max-height:30mm;object-fit:contain" />` : ""}</div>
      <div style="width:30mm;height:30mm;display:flex;align-items:center;justify-content:center">${sscLogo ? `<img src="${sscLogo}" style="max-width:30mm;max-height:30mm;object-fit:contain" />` : ""}</div>
      <div style="width:30mm;height:30mm;display:flex;align-items:center;justify-content:center">${tpLogo ? `<img src="${tpLogo}" style="max-width:30mm;max-height:30mm;object-fit:contain" />` : ""}</div>
    </div>
  `;

  const title = isResultSheet ? "Result Sheet" : tabValue === "question_wise_log" ? "Question Wise Log Detail" : "Question Wise Time Taken Detail";

  let candidateHtml = "";

  if (isResultSheet) {
    candidateHtml = `
      <table class="candidate-table" style="width:48%;border-collapse:collapse;font-size:12px">
        ${[
          ["Candidate's Name:", candidateDetails?.name],
          ["Candidate's ID:", candidateDetails?.candidate_id],
          ["Batch ID:", candidateDetails?.batch],
          ["Aadhaar No.:", candidateDetails?.aadhaar],
          ["Scheme:", candidateDetails?.scheme],
          ["Sub Scheme:", candidateDetails?.sub_scheme],
          ["Assessment Date:", candidateDetails?.assessment_date],
          ["TP/PIA's Name:", candidateDetails?.partner],
          ["Job Role:", candidateDetails?.qp],
        ].map(([l, v]) => `
          <tr>
            <td>${l}</td>
            <td>${v ?? ""}</td>
          </tr>
        `).join("")}
      </table>
    `;
  } else {
    candidateHtml = `
      <table class="candidate-table" style="width:100%;border-collapse:collapse;font-size:12px">
        ${[
          ["Batch ID:", candidateDetails?.batch, "Scheme:", candidateDetails?.scheme],
          ["Sub Scheme:", candidateDetails?.sub_scheme, "Assessment Date:", candidateDetails?.assessment_date],
          ["Job Role:", candidateDetails?.qp, "TP/PIA's Name:", candidateDetails?.partner],
          ["Candidate's Name:", candidateDetails?.name, "Candidate's ID:", candidateDetails?.candidate_id],
          ["Aadhaar No.:", candidateDetails?.aadhaar, "Total Marks:", candidateDetails?.total_theory_marks ?? candidateDetails?.total_marks],
          ["Obtained Marks:", candidateDetails?.obtained_theory_marks ?? candidateDetails?.obtained_marks, "Result:", candidateDetails?.theory_result_status ?? candidateDetails?.result_status],
          ["Percentage (%):", candidateDetails?.theory_percentage ?? candidateDetails?.percentage],
        ].map(row => `
          <tr>${row.map((c, ci) => `<td style="${ci % 2 === 0 ? 'font-weight:bold;' : ''}">${c ?? ""}</td>`).join("")}</tr>
        `).join("")}
      </table>
    `;
  }

  const summaryHtml = isResultSheet ? `
    <table class="styled" style="width: 86mm;">
      <thead>
        <tr>
          <th colspan="4">Summary</th>
        </tr>
        <tr>
          <th style="width: 12mm;">S. No.</th>
          <th style="width: 34mm;">NOS Name</th>
          <th style="width: 20mm;">Total Marks</th>
          <th style="width: 20mm;">Obtained Marks</th>
        </tr>
      </thead>
      ${summaryRows}
      <tr>
        <td colspan="2" class="bold">Total Marks</td>
        <td>${candidateDetails?.total_marks ?? ""}</td>
        <td>${candidateDetails?.obtained_marks ?? ""}</td>
      </tr>
      <tr>
        <td colspan="2" class="bold">Percentage (%)</td>
        <td>100</td>
        <td>${candidateDetails?.percentage ?? ""}</td>
      </tr>
      <tr>
        <td colspan="2" class="bold">Result</td>
        <td colspan="2" class="bold" style="color:${candidateDetails?.result_status === "PASS" ? "#16a34a" : candidateDetails?.result_status === "FAIL" ? "#dc2626" : "#000"}">${candidateDetails?.result_status ?? ""}</td>
      </tr>
    </table>
  ` : "";

  const theoryHtml = isResultSheet && logDetail?.length ? `
    <table class="styled">
      <thead>
        <tr>
          <th colspan="8">Theory</th>
        </tr>
        <tr style="font-weight:bold">
          <th style="width: 14mm;">SR. No.</th>
          <th style="width: 30mm;">NOS Name</th>
          <th style="width: 30mm;">PC Name</th>
          <th style="width: 33mm;">Question</th>
          <th style="width: 26mm;">Correct Answer</th>
          <th style="width: 26mm;">Candidate's Response</th>
          <th style="width: 20mm;">Maximum Marks</th>
          <th style="width: 20mm;">Obtained Marks</th>
        </tr>
      </thead>
      <tbody>
        ${theoryRows}
      </tbody>
    </table>
  ` : "";

  const practicalHtml = practicalReport?.length ? `
    <table class="styled">
      <thead>
        <tr>
          <th colspan="6">Practical</th>
        </tr>
        <tr>
          <th style="width: 14mm;">SR. No.</th>
          <th style="width: 37mm;">NOS Name</th>
          <th style="width: 54mm;">PC Name</th>
          <th style="width: 54mm;">Question</th>
          <th style="width: 20mm;">Maximum Marks</th>
          <th style="width: 20mm;">Obtained Marks</th>
        </tr>
      </thead>
      <tbody>
        ${practicalRows}
      </tbody>
    </table>
  ` : "";

  const vivaHtml = vivaReport?.length ? `
    <table class="styled">
      <thead>
        <tr>
          <td colspan="6">Viva</td>
        </tr>
        <tr>
          <th style="width: 14mm;">SR. No.</th>
          <th style="width: 37mm;">NOS Name</th>
          <th style="width: 54mm;">PC Name</th>
          <th style="width: 54mm;">Question</th>
          <th style="width: 20mm;">Maximum Marks</th>
          <th style="width: 20mm;">Obtained Marks</th>
        </tr>
      </thead>
      <tbody>
        ${vivaRows}
      </tbody>
    </table>
  ` : "";

  const projectHtml = projectReport?.length ? `
    <table class="styled">
      <thead>
        <tr>
          <th colspan="5">Project</t>
        </tr>
        <tr>
          <th style="width: 14mm;">SR. No.</th>
          <th style="width: 72mm;">NOS Name</th>
          <th style="width: 73mm;">PC Name</th>
          <th style="width: 20mm;">Max Marks</th>
          <th style="width: 20mm;">Obtained Marks</th>
        </tr>
      </thead>
      ${projectRows}
    </table>
  ` : "";

  const questionTableHtml = (isQuestionLog || isQuestionTime) ? `
    <table class="styled">
      <thead>
        <tr>
          <th style="width: 14mm; border:0;">SR. No.</th>
          <th style="width: 28mm; border:0;">NOS Name</th>
          <th style="width: 28mm; border:0;">PC Name</th>
          <th style="width: 52mm; border:0;">Question</th>
          <th style="width: ${questionCol1Width}; border:0;">${questionCol1Label}</th>
          <th style="width: ${questionCol2Width}; border:0;">${questionCol2Label}</th>
          <th style="width: ${questionCol3Width}; border:0;">${questionCol3Label}</th>
        </tr>
      </thead>
      <tbody>
        ${questionRows}
      </tbody>
    </table>
  ` : "";

  const footerHtml = isResultSheet ? `
    <div style="display:flex;justify-content:space-between;gap:20px;margin-top:15px;">
      <div style="text-align:start; max-width: 50%">
        <div>Assessment Agency Name - ${candidateDetails?.agency_name ?? ""}</div>
        <div style="margin-top:8px">Assessment Agency's Head Name - ${candidateDetails?.agency_head_name ?? ""}</div>
        <div style="margin-top:8px">Seal & Sign</div>
        ${_agencySign ? `<img src="${_agencySign}" style="height:30mm;width:30mm;margin-top:-22mm;margin-left:40px;object-fit:contain;">` : ``}
      </div>
      <div style="max-width: 50%;">
        <div style="text-align:start;">TP Name - ${candidateDetails?.partner ?? ""}</div>
        <div style="margin-top:8px;text-align:start">Center Manager's Name - ${candidateDetails?.center_manager_name ?? ""}</div>
        <div style="margin-top:8px">Seal & Sign</div>
        ${_tcSign ? `<img src="${_tcSign}" style="height:30mm;width:30mm;margin-top:-22mm;margin-left:40px;object-fit:contain;">` : ``}
      </div>
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
      <html>
      <head>
      <meta charset="utf-8">
      <style>
          @font-face {
            font-family: 'Noto Sans Devanagari';
            src: url(data:font/ttf;base64,${notoSansDevanagari}) format('truetype');
            unicode-range: U+0900-097F, U+1CD0-1CFF, U+A8E0-A8FF, U+11B00-11B5F, U+200C-200D, U+20B9, U+25CC, U+A830-A839;
          }
          @page { size: A4; margin: 10mm 5mm; }
        body { font-family:Helvetica, 'Noto Sans Devanagari', sans-serif; font-size: 12px; padding: 0; margin: 0; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        .styled {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          margin-top: 20px;
        }

        .styled > thead > tr:first-child th {
          background: #0047AB;
          color: #ffffff;
          text-align: center;
        }

        .styled :is(th, td) {
          border: 0.1px solid #ccc;
          text-align: center;
          padding: 2mm;
          vertical-align: top;
        }

        .candidate-table {
          width: 90mm;
          border-collapse: collapse;
          font-size: 12px;
        }

        .candidate-table td {
          padding: 2mm;
        }

        .candidate-table td:first-child {
          font-weight: bold;
          white-space: nowrap;
        }

        .bold {
          font-weight: bold;
        }
      </style>
      </head>
      <body>
        ${logosHtml}
        <div style="text-align:center;font-size:16px;margin-bottom:10px">${title}</div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          ${candidateHtml}
          ${summaryHtml}
        </div>
        <div style="clear:both"></div>
        ${theoryHtml}
        ${questionTableHtml}
        ${practicalHtml}
        ${vivaHtml}
        ${projectHtml}
        ${footerHtml}
      </body>
    </html>
  `;
}
