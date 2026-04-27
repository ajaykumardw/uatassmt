import { type SyntheticEvent, useEffect, useState } from "react";

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import CircularProgress from "@mui/material/CircularProgress";

// import XLSX from 'xlsx';

// import { format } from "date-fns";

// import type { batches, nos, pc, students } from "@prisma/client";

// import tableStyles from '@core/styles/table.module.css'
import TabContext from "@mui/lab/TabContext";
import Tab from '@mui/material/Tab';
import TabPanel from "@mui/lab/TabPanel";

import Divider from "@mui/material/Divider";

import CustomTabList from "@/@core/components/mui/TabList";
import DialogCloseButton from "@/components/dialogs/DialogCloseButton";
import QuestionWiseTimeTakenTable from "./QuestionWiseTimeTakenTable";
import QuestionWiseLogDetailTable from "./QuestionWiseLogDetailTable";
import CandidateDetail from "./CandidateDetail";
import QuestionReportTable from "./QuestionReportTable";


// import { agencyImagePath } from "@/configs/customDataConfig";



type QuestionWiseLogDetailDialogProps = {
  open: boolean
  handleClose: () => void
  selectedCandidate: string | null
  candidateId: number | null
}

const LogDetailDialog = ({ open, handleClose, selectedCandidate, candidateId } : QuestionWiseLogDetailDialogProps) => {

  const [logDetail, setLogDetail] = useState<any>(null);
  const [practicalReport, setPracticalReport] = useState<any>(null);
  const [vivaReport, setVivaReport] = useState<any>(null);
  const [projectReport, setProjectReport] = useState<any>(null);
  const [candidateDetails, setCandidateDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState('result_sheet');

//   const handleGenerateReport = async () => {

//     const XLSX = await import('xlsx');

//     // Get the table element
//     const table = document.querySelector('.table-pc-wise');

//     // Check if the table exists
//     if (table) {
//       // Convert the HTML table to a worksheet
//       const ws = XLSX.utils.table_to_sheet(table, { sheet: 'PC Wise Result' });

//       // Create a new workbook
//       const wb = XLSX.utils.book_new();

//       // Append the worksheet to the workbook
//       XLSX.utils.book_append_sheet(wb, ws, 'PC Wise Result');

//       // Write and download the Excel file
//       XLSX.writeFile(wb, `Question_wise_log_details.xlsx`);
//     } else {
//       console.error('Table not found!');
//     }
//   };

  const svgToPngBase64 = (svgBase64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();

      img.src = svgBase64;

      img.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = img.width || 24;
        canvas.height = img.height || 24;

        const ctx = canvas.getContext("2d");

        ctx?.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };
    });
  };

  const urlToBase64 = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();

      return await new Promise((resolve) => {

        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleGeneratePDF = async () => {

    setLoading(true);

    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const passIcon = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#16a34a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12l5 5L20 7"/></svg>`);

    const failIcon = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#dc2626" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg>`);



    const pdf = new jsPDF({
      orientation:"portrait",
      unit:"mm",
      format:"a4"
    });


    const tableColumn = [
      "SR. No.",
      "NOS Name",
      "PC Name",
      "Question",
      tabValue === 'question_wise_log' ? "Correct Answer" : "Question open time (in hh:mm:ss)",
      tabValue === 'question_wise_log' ? "Candidate's Response" : "Question close time (in hh:mm:ss)",
      tabValue === 'question_wise_log' ? "Status" : "Duration"
    ];

    const tableRows:any[] = [];

    logDetail?.forEach((item:any)=>{

      tableRows.push({
        sr_no: item.sr_no ,
        nos_name: item.nos_name ,
        pc_name: item.pc_name ,
        question: item.question ,

        col1: tabValue === 'question_wise_log'
          ? item.correct_answer
          : item.open_time,

        col2: tabValue === 'question_wise_log'
          ? item.candidate_response
          : item.submit_time,

        col3: tabValue === 'question_wise_log'
          ? item.status
          : item.duration
      });

    });


    const passIconPng = await svgToPngBase64(passIcon);
    const failIconPng = await svgToPngBase64(failIcon);

    pdf.setFontSize(14);

    const theoryTableColumns = [
      "SR. No.",
      "NOS Name",
      "PC Name",
      "Question",
      "Correct Answer",
      "Candidate's Response",
      "Maximum Marks",
      "Obtained Marks",
    ]

    const practicalAndVivaTableColumns = [
      "SR. No.",
      "NOS Name",
      "PC Name",
      "Question",
      "Maximum Marks",
      "Obtained Marks",
    ]

    const projectTableColumns = [
      "SR. No.",
      "NOS Name",
      "PC Name",
      "Maximum Marks",
      "Obtained Marks",
    ]

    const theoryTableRows:any[] = [];
    const practicalTableRows:any[] = [];
    const vivaTableRows:any[] = [];
    const projectTableRows:any[] = [];

    logDetail?.forEach((item:any)=>{

      theoryTableRows.push({
        sr_no: item.sr_no ,
        nos_name: item.nos_name ,
        pc_name: item.pc_name ,
        question: item.question ,
        correct_answer: item.correct_answer,
        candidate_response: item.candidate_response,
        max_marks: item.max_marks,
        obtained_marks: item.obtained_marks
      });

    });

    practicalReport?.forEach((item:any)=>{

      practicalTableRows.push({
        sr_no: item.sr_no ,
        nos_name: item.nos_name ,
        pc_name: item.pc_name ,
        question: item.question ,
        max_marks: item.max_marks,
        obtained_marks: item.obtained_marks
      });
    });

    vivaReport?.forEach((item:any)=>{
      vivaTableRows.push({
        sr_no: item.sr_no ,
        nos_name: item.nos_name ,
        pc_name: item.pc_name ,
        question: item.question ,
        max_marks: item.max_marks,
        obtained_marks: item.obtained_marks
      });
    });

    projectReport?.forEach((item:any)=>{
      projectTableRows.push({
        sr_no: item.sr_no ,
        nos_name: item.nos_name ,
        pc_name: item.pc_name ,
        max_marks: item.max_marks,
        obtained_marks: item.obtained_marks
      });
    });

    // const rawLogos = [
    //   candidateDetails?.ssc_image,
    //   candidateDetails?.agency_image,
    //   candidateDetails?.tp_image,
    // ].filter(Boolean);

    // // 🔥 convert all to base64
    // const logos: string[] = [];

    // for (const logo of rawLogos) {
    //   if (logo.startsWith("data:image")) {
    //     logos.push(logo); // already base64
    //   } else {
    //     const base64 = await urlToBase64(logo);

    //     if (base64) logos.push(base64);
    //   }
    // }

    // const pageWidth = pdf.internal.pageSize.getWidth();

    // const boxWidth = 30;
    // const boxHeight = 30;
    // const gap = 5;

    // let x = 10;
    // let y = 10;

    // // ======================
    // // DRAW LOGOS FIRST
    // // ======================
    // for (const logo of logos) {
    //   try {
    //     const img = new Image();

    //     img.src = logo;

    //     await new Promise((resolve) => {
    //       img.onload = resolve;
    //     });

    //     const imgW = img.width;
    //     const imgH = img.height;

    //     // ✅ scale like object-fit: contain
    //     const scale = Math.min(boxWidth / imgW, boxHeight / imgH);

    //     const drawWidth = imgW * scale;
    //     const drawHeight = imgH * scale;

    //     // ✅ center inside box
    //     const offsetX = (boxWidth - drawWidth) / 2;
    //     const offsetY = (boxHeight - drawHeight) / 2;

    //     // 👉 wrap if needed
    //     if (x + boxWidth > pageWidth - 10) {
    //       x = 10;
    //       y += boxHeight + gap;
    //     }

    //     // (optional) draw box border for debugging
    //     // pdf.rect(x, y, boxWidth, boxHeight);

    //     pdf.addImage(
    //       logo,
    //       "PNG",
    //       x + offsetX,
    //       y + offsetY,
    //       drawWidth,
    //       drawHeight
    //     );

    //     x += boxWidth + gap;

    //   } catch {

    //     // ignore broken images

    //   }
    // }

   const pageWidth = pdf.internal.pageSize.getWidth();

    const boxWidth = 30;
    const boxHeight = 30;
    const y = 0;

    // fixed slots
    const leftX = 10;
    const centerX = (pageWidth / 2) - (boxWidth / 2);
    const rightX = pageWidth - boxWidth - 10;

    const headerLogos = [
      { src: candidateDetails?.agency_image, x: leftX },
      { src: candidateDetails?.ssc_image, x: centerX },
      { src: candidateDetails?.tp_image, x: rightX }
    ];

    for (const item of headerLogos) {
      try {
        // always reserve space
        const slotX = item.x;
        const slotY = y;

        // optional debug / placeholder border
        // pdf.rect(slotX, slotY, boxWidth, boxHeight);

        if (!item.src) continue;

        const logo = item.src.startsWith("data:image")
          ? item.src
          : await urlToBase64(item.src);

        if (!logo) continue;

        const img = new Image();

        img.src = logo;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const imgW = img.width;
        const imgH = img.height;

        const scale = Math.min(
          boxWidth / imgW,
          boxHeight / imgH
        );

        const drawWidth = imgW * scale;
        const drawHeight = imgH * scale;

        const offsetX = (boxWidth - drawWidth) / 2;
        const offsetY = (boxHeight - drawHeight) / 2;

        pdf.addImage(
          logo,
          "PNG",
          slotX + offsetX,
          slotY + offsetY,
          drawWidth,
          drawHeight
        );

      } catch {

        // broken image => keep empty slot

      }
    }

    // ======================
    // TITLE BELOW LOGOS
    // ======================
    // const titleY =
    //   logos.length > 0
    //     ? y + boxHeight + 2
    //     : 15;

    const titleY = y + boxHeight + 2;

    if (tabValue === 'result_sheet') {

      pdf.text("Result Sheet", 105, titleY, { align: "center" })

    }

    if (tabValue === 'question_wise_log') {

      pdf.text("Question Wise Log Detail", 105, titleY, { align: "center" })

    } else if (tabValue === 'question_wise_time_taken') {

      pdf.text("Question Wise Time Taken Detail", 105, titleY, { align: "center" })

    }

    // ✅ next section starts here
    // const currentY = y + logos.length > 0 ? boxHeight : 0 + 5;
    const currentY = titleY + 10;

    // // ✅ Next content starts after logos
    // const currentY = y + logoHeight + 5;

    if (tabValue === 'result_sheet') {

      let candidateEndY = currentY;
      let summaryEndY = currentY;

      // ✅ Candidate Details (2-column)
      autoTable(pdf, {
        startY: currentY,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: "bold" },
          1: { cellWidth: 55 },
        },
        margin:{left:5,right:5},
        body: [

          [
            "Candidate's Name:", candidateDetails?.name ?? "",
          ],
          [
            "Candidate's ID:", candidateDetails?.candidate_id ?? ""
          ],
          [
            "Batch ID:", candidateDetails?.batch ?? "",
          ],
          [
            "Aadhaar No.:", candidateDetails?.aadhaar ?? "",
          ],
          [
            "Scheme:", candidateDetails?.scheme ?? ""
          ],
          [
            "Sub Scheme:", candidateDetails?.sub_scheme ?? "",
          ],
          [
            "Assessment Date:", candidateDetails?.assessment_date ?? ""
          ],
          [
            "TP/PIA's Name:", candidateDetails?.partner ?? ""
          ],
          [
            "Job Role:", candidateDetails?.qp ?? "",
          ],
        ],
      });

      candidateEndY = (pdf as any).lastAutoTable.finalY;

      // Summary Report
      autoTable(pdf, {
        startY: currentY,
        margin: { left: 118 },
        theme: "grid",

        head: [
          [
            { content: "Summary", colSpan: 4, styles:{ halign:'center', fillColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0047AB", textColor: "#FFFFFF", fontStyle: 'bold' } }
          ],
          ["S. No.", "NOS Name", "Total Marks", "Obtained Marks"]
        ],

        body: [
          ...candidateDetails?.summary_report.map((row:any) => [
            row.sr_no,
            row.nos_name,
            row.total_marks,
            row.obtained_marks
          ]),

          // totals rows
          [
            {
              content: "Total Marks",
              colSpan: 2,
              styles: { fontStyle: 'bold' }
            },
            candidateDetails?.total_marks ?? "",
            candidateDetails?.obtained_marks ?? ""
          ],
          [
            {
              content: "Percentage (%)",
              colSpan: 2,
              styles: { fontStyle: 'bold' }
            },
            "100",
            candidateDetails?.percentage ?? "",
          ],
          [
            {
              content: "Result",
              colSpan: 2,
              styles: { fontStyle: 'bold' }
            },
            {
              content: candidateDetails?.result_status ?? "",
              colSpan: 2,
              styles: { fontStyle: 'bold', textColor: candidateDetails?.result_status === "PASS" ? "#16a34a" : candidateDetails?.result_status === "FAIL" ? "#dc2626" : "#000000" }
            }
          ]
        ],

        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          overflow: "linebreak",
          halign: "center",
          textColor: "#000000"
        },

        headStyles:{
          fillColor: false,
          textColor: "#000000",
          fontStyle: 'bold',
          lineWidth: 0.1,
          halign: 'center'
        },

        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 34 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 }
        }
      });

      summaryEndY = (pdf as any).lastAutoTable.finalY;

      const topSectionEndY = Math.max(candidateEndY, summaryEndY) + 5;

      // theory table
      if(theoryTableRows.length > 0) {

        autoTable(pdf,{
          head:[
            [
              { content: "Theory", colSpan: 8, styles:{ halign:'center', fillColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0047AB", textColor: "#FFFFFF", fontStyle: 'bold' } }
            ],
            theoryTableColumns
          ],
          body:theoryTableRows.map(row => [
            row.sr_no,
            row.nos_name,
            row.pc_name,
            row.question,
            row.correct_answer,
            row.candidate_response,
            row.max_marks,
            row.obtained_marks
          ]),
          startY: topSectionEndY,
          theme:'grid',
          headStyles:{
            fillColor: false,
            textColor: "#000000",
            fontStyle: 'bold',
            lineWidth: 0.1,
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak'
          },
          columnStyles:{
            0:{cellWidth:14},   // Sr
            1:{cellWidth:30},  // NOS
            2:{cellWidth:30},  // PC
            3:{cellWidth:33},  // Question
            4:{cellWidth:26},  // Correct
            5:{cellWidth:26},  // Response
            6:{cellWidth:20},   // Max Marks
            7:{cellWidth:20},   // Obtained Marks
          },
          margin:{left:5,right:5},
        });
      }

      // practical table
      if(practicalTableRows.length > 0) {

        autoTable(pdf,{
          head:[
            [
              { content: "Practical", colSpan: 6, styles:{ halign:'center', fillColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0047AB", textColor: "#FFFFFF", fontStyle: 'bold' } }
            ],
            practicalAndVivaTableColumns
          ],
          body:practicalTableRows.map(row => [
            row.sr_no,
            row.nos_name,
            row.pc_name,
            row.question,
            row.max_marks,
            row.obtained_marks
          ]),
          startY: (pdf as any).lastAutoTable.finalY + 5,
          theme:'grid',
          headStyles:{
            fillColor: false,
            textColor: "#000000",
            fontStyle: 'bold',
            lineWidth: 0.1,
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak'
          },
          columnStyles:{
            0:{cellWidth:14},   // Sr
            1:{cellWidth:37},  // NOS
            2:{cellWidth:54},  // PC
            3:{cellWidth:54},  // Question
            4:{cellWidth:20},   // Max Marks
            5:{cellWidth:20},   // Obtained Marks
          },
          margin:{left:5,right:5},
        });
      }

      // viva table
      if(vivaTableRows.length > 0) {

        autoTable(pdf,{
          head:[
            [
              { content: "Viva", colSpan: 6, styles:{ halign:'center', fillColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0047AB", textColor: "#FFFFFF", fontStyle: 'bold' } }
            ],
            practicalAndVivaTableColumns
          ],
          body:vivaTableRows.map(row => [
            row.sr_no,
            row.nos_name,
            row.pc_name,
            row.question,
            row.max_marks,
            row.obtained_marks
          ]),
          startY: (pdf as any).lastAutoTable.finalY + 5,
          theme:'grid',
          headStyles:{
            fillColor: false,
            textColor: "#000000",
            fontStyle: 'bold',
            lineWidth: 0.1,
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak'
          },
          columnStyles:{
            0:{cellWidth:14},   // Sr
            1:{cellWidth:37},  // NOS
            2:{cellWidth:54},  // PC
            3:{cellWidth:54},  // Question
            4:{cellWidth:20},   // Max Marks
            5:{cellWidth:20},   // Obtained Marks
          },
          margin:{left:5,right:5},
        });
      }

      // project table
      if(projectTableRows.length > 0) {

        autoTable(pdf,{
          head:[
            [
              { content: "Project", colSpan: 5, styles:{ halign:'center', fillColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0047AB", textColor: "#FFFFFF", fontStyle: 'bold' } }
            ],
            projectTableColumns
          ],
          body:projectTableRows.map(row => [
            row.sr_no,
            row.nos_name,
            row.pc_name,
            row.max_marks,
            row.obtained_marks
          ]),
          startY: (pdf as any).lastAutoTable.finalY + 5,
          theme:'grid',
          headStyles:{
            fillColor: false,
            textColor: "#000000",
            fontStyle: 'bold',
            lineWidth: 0.1
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak'
          },
          columnStyles:{
            0:{cellWidth:14},    // Sr
            1:{cellWidth:72},   // NOS
            2:{cellWidth:73},   // PC
            3:{cellWidth:20},   // Max Marks
            4:{cellWidth:20},   // Obtained Marks
          },
          margin:{left:5,right:5},
        });
      }

      const pageHeight = pdf.internal.pageSize.getHeight();

      // estimate footer height (safe buffer)
      const estimatedFooterHeight = 50;


      let footerStartY = (pdf as any).lastAutoTable.finalY + 15;

      // 👉 check if footer fits in current page
      if (footerStartY + estimatedFooterHeight > pageHeight) {
        pdf.addPage();
        footerStartY = 20; // reset top margin for new page
      }

      // const footerStartY = (pdf as any).lastAutoTable.finalY + 15;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;

      // left + right section start
      const leftX = margin;
      const blockWidth = 90;
      const rightX = pageWidth - margin - blockWidth;

      pdf.setFontSize(9);

      // ==========================
      // HEADER TEXT
      // ==========================
      // drawWrappedText(
      //   `Assessment Agency Name - ${candidateDetails?.agency_name ?? ""}`,
      //   leftX,
      //   footerStartY
      // );

      // drawWrappedText(
      //   `TP Name - ${candidateDetails?.partner ?? ""}`,
      //   rightX,
      //   footerStartY
      // );

      // drawWrappedText(
      //   `Assessment Agency's Head Name - ${candidateDetails?.agency_head_name ?? "Raju Sharma"}`,
      //   leftX,
      //   footerStartY + 5
      // );

      // drawWrappedText(
      //   `Center Manager's Name - ${candidateDetails?.center_manager_name ?? ""}`,
      //   rightX,
      //   footerStartY + 5
      // );

      const drawLabelValue = (
        label: string,
        value: string,
        x: number,
        y: number,
        width: number
      ) => {
        const labelText = `${label} - `;

        // get label width
        const labelWidth = pdf.getTextWidth(labelText);

        // remaining width for value
        const valueWidth = width - labelWidth;

        // split ONLY value
        const valueLines = pdf.splitTextToSize(value || '', valueWidth);

        // first line → label + first value line
        pdf.text(labelText + (valueLines[0] || ''), x, y);

        // remaining lines → aligned under value
        valueLines.slice(1).forEach((line: string, i: number) => {
          pdf.text(line, x + labelWidth, y + (i + 1) * 4);
        });

        return valueLines.length * 4;
      };

      // LEFT SIDE
      let leftY = footerStartY;

      leftY += drawLabelValue(
        'Assessment Agency Name',
        candidateDetails?.agency_name ?? '',
        leftX,
        leftY,
        blockWidth
      );

      leftY += drawLabelValue(
        "Assessment Agency's Head Name",
        candidateDetails?.agency_head_name ?? '',
        leftX,
        leftY + 2,
        blockWidth
      );

      let rightY = footerStartY;

      rightY += drawLabelValue(
        'TP Name',
        candidateDetails?.partner ?? '',
        rightX,
        rightY,
        blockWidth
      );

      rightY += drawLabelValue(
        "Center Manager's Name",
        candidateDetails?.center_manager_name ?? '',
        rightX,
        rightY + 2,
        blockWidth
      );


      // ==========================
      // LABELS
      // ==========================
      // spacing after text
      const spacing = 4;

      // ==========================
      // LEFT SIDE (dynamic)
      // ==========================
      const leftLabelY = leftY + spacing;

      pdf.text("Seal & Sign", leftX, leftLabelY);

      const boxSize = 30;
      const leftBoxY = leftLabelY + 1;

      // center align box inside block (optional but better)
      const leftBoxX = leftX + (blockWidth - boxSize) / 2;

      // ==========================
      // RIGHT SIDE (dynamic)
      // ==========================
      const rightLabelY = rightY + spacing;

      pdf.text("Seal & Sign", rightX, rightLabelY);

      const rightBoxY = rightLabelY + 1;
      const rightBoxX = rightX + (blockWidth - boxSize) / 2;

      // ==========================
      // LEFT SIDE IMAGE (STAMP)
      // ==========================
      try {
        const img = candidateDetails?.agency_sign ? await urlToBase64(candidateDetails?.agency_sign) : null;

        if (img) {
          pdf.addImage(
            img,
            "PNG",
            leftBoxX - 10,
            leftBoxY - 3,
            boxSize,
            boxSize
          );
        }
      } catch {}

      // =========================
      // RIGHT SIDE IMAGE (STAMP)
      // =========================
      try {
        const img = candidateDetails?.tc_sign ? await urlToBase64(candidateDetails?.tc_sign) : null;

        if (img) {
          pdf.addImage(
            img,
            "PNG",
            rightBoxX - 10,
            rightBoxY - 3,
            boxSize,
            boxSize
          );
        }
      } catch {}

      // pdf.text("Seal & Sign", leftX, footerStartY + 5 + 5);
      // pdf.text("Seal & Sign", rightX, footerStartY + 5 + 5);

      // // ==========================
      // // SIGN / STAMP BOX SETTINGS
      // // ==========================
      // const boxSize = 25;
      // const boxTopY = footerStartY + 12;

      // // left square box
      // const leftBoxX = leftX + 10;

      // // right square box
      // // const rightBoxX = rightX + 10;

      // // // draw square areas
      // // pdf.rect(leftBoxX, boxTopY, boxSize, boxSize);
      // // pdf.rect(rightBoxX, boxTopY, boxSize, boxSize);

      // // ==========================
      // // ONLY LEFT SIDE IMAGE
      // // ==========================
      // // if (candidateDetails?.agency_sign) {
      // //   try {
      // //     const img = candidateDetails.agency_sign.startsWith("data:image")
      // //       ? candidateDetails.agency_sign
      // //       : await urlToBase64(candidateDetails.agency_sign);

      // //     if (img) {
      // //       pdf.addImage(
      // //         img,
      // //         "PNG",
      // //         leftBoxX + 2,
      // //         boxTopY + 2,
      // //         boxSize - 4,
      // //         boxSize - 4
      // //       );
      // //     }
      // //   } catch {}
      // // }

      // // temporary stamp
      // try {
      //   const img = await urlToBase64(`${process.env.NEXT_PUBLIC_APP_URL}/images/stamp/vistaskills_seal_sign.png`);

      //   if (img) {
      //     pdf.addImage(
      //       img,
      //       "PNG",
      //       leftBoxX + 2,
      //       boxTopY + 2,
      //       boxSize,
      //       boxSize
      //     );
      //   }
      // } catch {}


      // // Signature Labels
      // pdf.text(
      //   "Seal & Sign",
      //   leftX + 25,
      //   // footerStartY + 28
      //   boxTopY + boxSize + 6
      // );

      // pdf.text(
      //   "Seal & Sign",
      //   rightX + 25,
      //   // footerStartY + 28
      //   boxTopY + boxSize + 6
      // );

      // // signature lines
      // pdf.line(leftX, boxTopY + boxSize + 10, leftX + 60, boxTopY + boxSize + 10);
      // pdf.line(rightX, boxTopY + boxSize + 10, rightX + 60, boxTopY + boxSize + 10);

    } else {

      // ✅ Candidate Details (2-column)
      autoTable(pdf, {
        startY: currentY,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: "bold" },
          1: { cellWidth: 55 },
          2: { cellWidth: 35, fontStyle: "bold" },
          3: { cellWidth: 55 },
        },
        margin:{left:5,right:5},
        body: [
          [
            "Batch ID:", candidateDetails?.batch ?? "-",
            "Scheme:", candidateDetails?.scheme ?? "-"
          ],
          [
            "Sub Scheme:", candidateDetails?.sub_scheme ?? "-",
            "Assessment Date:", candidateDetails?.assessment_date ?? "-"
          ],
          [
            "Job Role:", candidateDetails?.qp ?? "-",
            "TP/PIA's Name:", candidateDetails?.partner ?? "-"
          ],
          [
            "Candidate's Name:", candidateDetails?.name ?? "-",
            "Candidate's ID:", candidateDetails?.candidate_id ?? "-"
          ],
          [
            "Aadhaar No.:", candidateDetails?.aadhaar ?? "-",
            "Total Marks:", tabValue === 'result_sheet' ? candidateDetails?.total_marks ?? "-" : candidateDetails?.total_theory_marks ?? "-",
          ],
          [
            "Obtained Marks:", tabValue === 'result_sheet' ? candidateDetails?.obtained_marks ?? "-" : candidateDetails?.obtained_theory_marks ?? "-",
            "Result:", tabValue === 'result_sheet' ? candidateDetails?.result_status ?? "-" : candidateDetails?.theory_result_status ?? "-",
          ],
          [
            "Percentage (%):", tabValue === 'result_sheet' ? candidateDetails?.percentage ?? "-" : candidateDetails?.theory_percentage ?? "-"
          ],
        ],
      });

      // Question Wise Log Table and Question Wise Time Taken Table (same data, different column names)
      autoTable(pdf,{
        head:[tableColumn],

        body:tableRows.map(row => [
          row.sr_no,
          row.nos_name,
          row.pc_name,
          row.question,
          row.col1,
          row.col2,
          tabValue === 'question_wise_log' ? "" : row.col3,
        ]),

        // startY:20,
        startY: (pdf as any).lastAutoTable.finalY + 5,

        theme:'grid',
        headStyles:{
          fillColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0047AB",
          textColor: "#FFFFFF",
          fontStyle: 'bold'
        },

        styles:{
          fontSize:7,
          cellPadding:2,
          overflow:'linebreak'
        },

        columnStyles:{
          0:{cellWidth:14},   // Sr
          1:{cellWidth:28},  // NOS
          2:{cellWidth:28},  // PC
          3:{cellWidth:52},  // Question
          4:{cellWidth: tabValue === "question_wise_log" ? 32 : 30},  // Correct
          5:{cellWidth: tabValue === "question_wise_log" ? 32 : 30},  // Response
          6:{cellWidth: tabValue === "question_wise_log" ? 13 : 17},   // Status
        },

        margin:{left:5,right:5},

        // ✅ DRAW ICON HERE
        didDrawCell: function (data) {
          if (data.section === 'body' && data.column.index === 6 && tabValue === 'question_wise_log') {

            const item = tableRows?.[data.row.index];

            if (!item) {
              pdf.text('--', data.cell.x + 2, data.cell.y + 5);

              return;
            }

            const status = item.col3;

            let icon: string | null = null;

            if (status === 1) icon = passIconPng as string;
            else if (status === 0) icon = failIconPng as string;

            if (icon) {
              const size = 5;

              const x = data.cell.x + (data.cell.width - size) / 2;
              const y = data.cell.y + (data.cell.height - size) / 2;


              try {
                pdf.addImage(icon, 'PNG', x, y, size, size);
              } catch (e) {
                // fallback if SVG fails
                pdf.text(
                  status === 1 ? "✔" : "✖",
                  data.cell.x + 2,
                  data.cell.y + 5
                );
              }
            } else {
              pdf.text('--', data.cell.x + 2, data.cell.y + 5);
            }
          }
        },

        // didDrawPage:(data)=>{

        //   pdf.setFontSize(12);

        //   pdf.text(
        //     "Question Wise Log Report",
        //     data.settings.margin.left,
        //     10
        //   );

        // }

      });

    }

    let fileName = "Result_Sheet.pdf";

    if (tabValue === 'result_sheet') {
      fileName = `${selectedCandidate}_Result_Sheet.pdf`;
    }

    if (tabValue === 'question_wise_log') {
      fileName = `${selectedCandidate}_Question_Wise_Log_Detail.pdf`;
    } else if (tabValue === 'question_wise_time_taken') {
      fileName = `${selectedCandidate}_Question_Wise_Time_Taken_Detail.pdf`;
    }

    pdf.save(fileName);

    setLoading(false);

  };

  const getLogDetails = async (candidateId: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${candidateId}/log-detail`).then(res => res.json());

    console.log("log details: ", res);

    setLogDetail(res.report);
    setCandidateDetails(res.candidate)
    setPracticalReport(res?.practical_report);
    setVivaReport(res?.viva_report);
    setProjectReport(res?.project_report);

  }


  useEffect(() => {
    if (candidateId) {
      getLogDetails(candidateId);
    }
  }, [candidateId]);

  const handleTabChange = (event: SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      keepMounted
      maxWidth='xl'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-wrap justify-between text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Individual Candidate Report - {selectedCandidate}

        {/* <Button
          color='secondary'
          variant='tonal'
          startIcon={<i className='tabler-upload' />}
          className='is-full sm:is-auto'
          onClick={handleGenerateReport}
        >
          Export
        </Button> */}

        <Button
          color='primary'
          variant='tonal'
          startIcon={loading ? <CircularProgress size={18}/> : <i className='tabler-file' />}
          onClick={handleGeneratePDF}
          disabled={loading}
        >
          PDF
        </Button>
      </DialogTitle>
      <Divider className="mb-4" />
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <TabContext value={tabValue}>
          <CustomTabList pill='true' onChange={handleTabChange} variant="scrollable" aria-label="Candidate Report">
            <Tab value='result_sheet' label="Result Sheet" />
            <Tab value='question_wise_log' label="Question Wise Log" />
            <Tab value='question_wise_time_taken' label="Question Wise Time Taken" />
          </CustomTabList>
          <TabPanel value='result_sheet'>
            <div className='overflow-x-auto'>
              <CandidateDetail candidateDetails={candidateDetails} />
              {/* <QuestionWiseLogDetailTable logDetail={logDetail} /> */}
              <QuestionReportTable logDetail={logDetail} type="Theory" />
              <QuestionReportTable logDetail={practicalReport} type="Practical" />
              <QuestionReportTable logDetail={vivaReport} type="Viva" />
            </div>
          </TabPanel>
          <TabPanel value='question_wise_log'>
            <div className='overflow-x-auto'>
              <CandidateDetail candidateDetails={{...candidateDetails, total_marks: candidateDetails?.total_theory_marks, obtained_marks: candidateDetails?.obtained_theory_marks, percentage: candidateDetails?.theory_percentage, result_status: candidateDetails?.theory_result_status}} />
              <QuestionWiseLogDetailTable logDetail={logDetail} />
            </div>
          </TabPanel>
          <TabPanel value='question_wise_time_taken'>
            <div className='overflow-x-auto'>
              {candidateDetails && (
                <CandidateDetail candidateDetails={{...candidateDetails, total_marks: candidateDetails?.total_theory_marks, obtained_marks: candidateDetails?.obtained_theory_marks, percentage: candidateDetails?.theory_percentage, result_status: candidateDetails?.theory_result_status}} />
              )}
              {logDetail && (
                <QuestionWiseTimeTakenTable logDetail={logDetail} />
              )}
            </div>
          </TabPanel>
        </TabContext>
      </DialogContent>
    </Dialog>
  )
}

export default LogDetailDialog;
