import fs from "fs/promises";
import path from "path";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"
import { getBrowser } from "@/libs/puppeteerBrowser";
import notoSansDevanagari from "@/fonts/noto-sans-devanagari-base64";

// ===============================
// URL / FILE PATH -> BASE64
// server-side safe
// ===============================
const urlToBase64 = async (
  url: string
): Promise<string | null> => {
  try {
    // Handle localhost/internal URLs as local files
    if (
      url.includes("localhost:3000") ||
      url.includes(process.env.NEXT_PUBLIC_APP_URL || "")
    ) {
      const relativePath = url
        .replace("http://localhost:3000/", "")
        .replace("https://localhost:3000/", "")
        .replace(
          (process.env.NEXT_PUBLIC_APP_URL || "") + "/",
          ""
        );

      const fullPath = path.join(
        process.cwd(),
        relativePath
      );

      const file = await fs.readFile(fullPath);

      const ext = fullPath
        .split(".")
        .pop()
        ?.toLowerCase();

      let mime = "image/png";

      if (ext === "jpg" || ext === "jpeg")
        mime = "image/jpeg";
      else if (ext === "svg")
        mime = "image/svg+xml";
      else if (ext === "webp")
        mime = "image/webp";

      return `data:${mime};base64,${file.toString(
        "base64"
      )}`;
    }

    // External remote URL
    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      const res = await fetch(url);

      if (!res.ok) return null;

      const arr = await res.arrayBuffer();

      const mime =
        res.headers.get("content-type") ||
        "image/png";

      return `data:${mime};base64,${Buffer.from(
        arr
      ).toString("base64")}`;
    }

    // Direct local path
    const file = await fs.readFile(url);

    const ext = url.split(".").pop()?.toLowerCase();

    let mime = "image/png";

    if (ext === "jpg" || ext === "jpeg")
      mime = "image/jpeg";
    else if (ext === "svg")
      mime = "image/svg+xml";
    else if (ext === "webp")
      mime = "image/webp";

    return `data:${mime};base64,${file.toString(
      "base64"
    )}`;
  } catch (e) {

    console.log("Image failed:", url, e);

    return null;
  }
};

export const generateCandidatePdf_OLD = async (data: any, assets: any, type: string = 'result_sheet') => {

  const practicalReport = data?.practical_report || [];
  const vivaReport = data?.viva_report || [];
  const projectReport = data?.project_report || [];
  const candidateDetails = data?.candidate || {};

  console.log("assests on bulk pdf generation:", assets);

  const passIcon = "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#16a34a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12l5 5L20 7"/></svg>`).toString("base64");

    const failIcon = "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#dc2626" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg>`).toString("base64");


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
      type === 'question_wise_log' ? "Correct Answer" : "Question open time (in hh:mm:ss)",
      type === 'question_wise_log' ? "Candidate's Response" : "Question close time (in hh:mm:ss)",
      type === 'question_wise_log' ? "Status" : "Duration"
    ];

    const tableRows:any[] = [];

    data?.report?.forEach((item:any)=>{

      tableRows.push({
        sr_no: item.sr_no ,
        nos_name: item.nos_name ,
        pc_name: item.pc_name ,
        question: item.question ,

        col1: type === 'question_wise_log'
          ? item.correct_answer
          : item.open_time,

        col2: type === 'question_wise_log'
          ? item.candidate_response
          : item.submit_time,

        col3: type === 'question_wise_log'
          ? item.status
          : item.duration
      });

    });


    const passIconPng = passIcon;
    const failIconPng = failIcon;

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

    data?.report?.forEach((item:any)=>{

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

   const pageWidth = pdf.internal.pageSize.getWidth();

    const boxWidth = 30;
    const boxHeight = 30;
    const y = 0;

    // fixed slots
    const leftX = 10;
    const centerX = (pageWidth / 2) - (boxWidth / 2);
    const rightX = pageWidth - boxWidth - 10;

    const headerLogos = [
      { src: assets?.agency_image, x: leftX },
      { src: assets?.ssc_image, x: centerX },
      { src: assets?.tp_image, x: rightX }
    ];

    // for (const item of headerLogos) {
    //   try {
    //     // always reserve space
    //     const slotX = item.x;
    //     const slotY = y;

    //     // optional debug / placeholder border
    //     // pdf.rect(slotX, slotY, boxWidth, boxHeight);

    //     if (!item.src) continue;

    //     const logo = item.src.startsWith("data:image")
    //       ? item.src
    //       : await urlToBase64(item.src);

    //     if (!logo) continue;

    //     const img = new Image();

    //     img.src = logo;

    //     await new Promise((resolve, reject) => {
    //       img.onload = resolve;
    //       img.onerror = reject;
    //     });

    //     const imgW = img.width;
    //     const imgH = img.height;

    //     const scale = Math.min(
    //       boxWidth / imgW,
    //       boxHeight / imgH
    //     );

    //     const drawWidth = imgW * scale;
    //     const drawHeight = imgH * scale;

    //     const offsetX = (boxWidth - drawWidth) / 2;
    //     const offsetY = (boxHeight - drawHeight) / 2;

    //     pdf.addImage(
    //       logo,
    //       "PNG",
    //       slotX + offsetX,
    //       slotY + offsetY,
    //       drawWidth,
    //       drawHeight
    //     );

    //   } catch {

    //     // broken image => keep empty slot

    //   }
    // }

    // for (const item of headerLogos) {
    //   try {
    //     console.log("Loading image:", item.src);
    //     if (!item.src) continue;

    //     const logo = item.src.startsWith("data:image")
    //       ? item.src
    //       : await urlToBase64(item.src);

    //     if (!logo) continue;

    //     pdf.addImage(
    //       logo,
    //       "PNG",
    //       item.x,
    //       y,
    //       boxWidth,
    //       boxHeight
    //     );

    //   } catch (error){
    //     console.log("failed to add image in pdf:", error)
    //   }
    // }

    for (const item of headerLogos) {
      try {
        if (!item.src) continue;

        const logo = item.src.startsWith("data:image")
          ? item.src
          : await urlToBase64(item.src);

        if (!logo) continue;

        // Detect image format
        const format = logo.includes("image/jpeg")
          ? "JPEG"
          : logo.includes("image/webp")
          ? "WEBP"
          : "PNG";

        // Get real dimensions
        const props = pdf.getImageProperties(logo);

        const imgW = props.width;
        const imgH = props.height;

        // contain scale
        const scale = Math.min(
          boxWidth / imgW,
          boxHeight / imgH
        );

        const drawWidth = imgW * scale;
        const drawHeight = imgH * scale;

        // center inside box
        const drawX =
          item.x + (boxWidth - drawWidth) / 2;

        const drawY =
          y + (boxHeight - drawHeight) / 2;

        pdf.addImage(
          logo,
          format,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );

      } catch (error) {
        console.log("failed to add image:", error);
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

    if (type === 'result_sheet') {

      pdf.text("Result Sheet", 105, titleY, { align: "center" })

    }

    if (type === 'question_wise_log') {

      pdf.text("Question Wise Log Detail", 105, titleY, { align: "center" })

    } else if (type === 'question_wise_time_taken') {

      pdf.text("Question Wise Time Taken Detail", 105, titleY, { align: "center" })

    }

    // ✅ next section starts here
    // const currentY = y + logos.length > 0 ? boxHeight : 0 + 5;
    const currentY = titleY + 10;

    // // ✅ Next content starts after logos
    // const currentY = y + logoHeight + 5;

    if (type === 'result_sheet') {

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
            halign: "center"
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak',
            halign: "center",
            textColor: "#000000"
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
            halign: "center"
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak',
            halign: "center",
            textColor: "#000000"
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
            halign: "center"
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak',
            halign: "center",
            textColor: "#000000"
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
            lineWidth: 0.1,
            halign: "center"
          },
          styles:{
            fontSize:7,
            cellPadding:2,
            lineWidth: 0.1,
            overflow:'linebreak',
            halign: "center",
            textColor: "#000000"
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
        const img = assets?.agency_sign
          ? await urlToBase64(assets?.agency_sign)
          : null;

        if (img) {
          const format = img.includes("image/jpeg")
            ? "JPEG"
            : img.includes("image/webp")
            ? "WEBP"
            : "PNG";

          const props = pdf.getImageProperties(img);

          const imgW = props.width;
          const imgH = props.height;

          const scale = Math.min(
            boxSize / imgW,
            boxSize / imgH
          );

          const drawW = imgW * scale;
          const drawH = imgH * scale;

          const drawX =
            (leftBoxX - 10) + (boxSize - drawW) / 2;

          const drawY =
            (leftBoxY - 3) + (boxSize - drawH) / 2;

          pdf.addImage(
            img,
            format,
            drawX,
            drawY,
            drawW,
            drawH
          );
        }
      } catch {}

      // =========================
      // RIGHT SIDE IMAGE (STAMP)
      // =========================
      try {
        const img = assets?.tc_sign
          ? await urlToBase64(assets?.tc_sign)
          : null;

        if (img) {
          const format = img.includes("image/jpeg")
            ? "JPEG"
            : img.includes("image/webp")
            ? "WEBP"
            : "PNG";

          const props = pdf.getImageProperties(img);

          const imgW = props.width;
          const imgH = props.height;

          const scale = Math.min(
            boxSize / imgW,
            boxSize / imgH
          );

          const drawW = imgW * scale;
          const drawH = imgH * scale;

          const drawX =
            (rightBoxX - 10) + (boxSize - drawW) / 2;

          const drawY =
            (rightBoxY - 3) + (boxSize - drawH) / 2;

          pdf.addImage(
            img,
            format,
            drawX,
            drawY,
            drawW,
            drawH
          );
        }
      } catch {}

      // // ==========================
      // // LEFT SIDE IMAGE (STAMP)
      // // ==========================
      // try {
      //   const img = assets?.agency_sign ? await urlToBase64(assets?.agency_sign) : null;

      //   if (img) {
      //     pdf.addImage(
      //       img,
      //       "PNG",
      //       leftBoxX - 10,
      //       leftBoxY - 3,
      //       boxSize,
      //       boxSize
      //     );
      //   }
      // } catch {}

      // // =========================
      // // RIGHT SIDE IMAGE (STAMP)
      // // =========================
      // try {
      //   const img = assets?.tc_sign ? await urlToBase64(assets?.tc_sign) : null;

      //   if (img) {
      //     pdf.addImage(
      //       img,
      //       "PNG",
      //       rightBoxX - 10,
      //       rightBoxY - 3,
      //       boxSize,
      //       boxSize
      //     );
      //   }
      // } catch {}

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
            "Total Marks:", type === 'result_sheet' ? candidateDetails?.total_marks ?? "-" : candidateDetails?.total_theory_marks ?? "-",
          ],
          [
            "Obtained Marks:", type === 'result_sheet' ? candidateDetails?.obtained_marks ?? "-" : candidateDetails?.obtained_theory_marks ?? "-",
            "Result:", type === 'result_sheet' ? candidateDetails?.result_status ?? "-" : candidateDetails?.theory_result_status ?? "-",
          ],
          [
            "Percentage (%):", type === 'result_sheet' ? candidateDetails?.percentage ?? "-" : candidateDetails?.theory_percentage ?? "-"
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
          type === 'question_wise_log' ? "" : row.col3,
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
          4:{cellWidth: type === "question_wise_log" ? 32 : 30},  // Correct
          5:{cellWidth: type === "question_wise_log" ? 32 : 30},  // Response
          6:{cellWidth: type === "question_wise_log" ? 13 : 17},   // Status
        },

        margin:{left:5,right:5},

        // ✅ DRAW ICON HERE
        didDrawCell: function (data) {
          if (data.section === 'body' && data.column.index === 6 && type === 'question_wise_log') {

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

    if (type === 'result_sheet') {
      fileName = `${candidateDetails?.candidate_id}_Result_Sheet.pdf`;
    }

    if (type === 'question_wise_log') {
      fileName = `${candidateDetails?.candidate_id}_Question_Wise_Log_Detail.pdf`;
    } else if (type === 'question_wise_time_taken') {
      fileName = `${candidateDetails?.candidate_id}_Question_Wise_Time_Taken_Detail.pdf`;
    }

    // pdf.save(fileName);

    // return buffer for zip worker
    const pdfBuffer = Buffer.from(
      pdf.output("arraybuffer")
    );

    return {
      fileName,
      buffer: pdfBuffer
    };
}

// ===============================
// NEW PUPPETEER-BASED VERSION
// ===============================

function buildHtml(data: any, logos: (string | null)[], signDataUri: (string | null)[]): string {
  const candidateDetails = data?.candidate || {};
  const isResultSheet = data?.type === "result_sheet";
  const practicalReport = data?.practical_report || [];
  const vivaReport = data?.viva_report || [];
  const projectReport = data?.project_report || [];

  const passIcon = "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#16a34a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12l5 5L20 7"/></svg>`).toString("base64");

  const failIcon = "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#dc2626" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg>`).toString("base64");

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

  const reportData = data?.report || [];
  const theoryRows = (isResultSheet ? reportData : []).map((item: any) => `
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

  const isQuestionLog = data?.type === "question_wise_log";
  const isQuestionTime = data?.type === "question_wise_time_taken";

  const questionCol1Label = isQuestionLog ? "Correct Answer" : "Question open time (in hh:mm:ss)";
  const questionCol2Label = isQuestionLog ? "Candidate's Response" : "Question close time (in hh:mm:ss)";
  const questionCol3Label = isQuestionLog ? "Status" : "Duration";

  const questionCol1Width = isQuestionLog ? "32mm" : "30mm";
  const questionCol2Width = isQuestionLog ? "32mm" : "30mm";
  const questionCol3Width = isQuestionLog ? "13mm" : "17mm";

  const questionRows = (isQuestionLog || isQuestionTime ? reportData : []).map((item: any) => `
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

  const practicalRows = (data?.practical_report || []).map((item: any) => `
    <tr>
      <td style="${tdC}">${item.sr_no}</td>
      <td style="${tdC}">${item.nos_name}</td>
      <td style="${tdC}">${item.pc_name}</td>
      <td style="${tdL}">${item.question}</td>
      <td style="${tdC}">${item.max_marks}</td>
      <td style="${tdC}">${item.obtained_marks}</td>
    </tr>
  `).join("") || "";

  const vivaRows = (data.viva_report || []).map((item: any) => `
    <tr>
      <td style="${tdC}">${item.sr_no}</td>
      <td style="${tdC}">${item.nos_name}</td>
      <td style="${tdC}">${item.pc_name}</td>
      <td style="${tdL}">${item.question}</td>
      <td style="${tdC}">${item.max_marks}</td>
      <td style="${tdC}">${item.obtained_marks}</td>
    </tr>
  `).join("") || "";

  const projectRows = (data.project_report || []).map((item: any) => `
    <tr>
      <td style="${tdC}">${item.sr_no}</td>
      <td style="${tdC}">${item.nos_name}</td>
      <td style="${tdC}">${item.pc_name}</td>
      <td style="${tdC}">${item.max_marks}</td>
      <td style="${tdC}">${item.obtained_marks}</td>
    </tr>
  `).join("") || "";

  const [agencyLogo, sscLogo, tpLogo] = logos || [];

  const logosHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
      <div style="width:30mm;height:30mm;display:flex;align-items:center;justify-content:center">${agencyLogo ? `<img src="${agencyLogo}" style="max-width:30mm;max-height:30mm;object-fit:contain" />` : ""}</div>
      <div style="width:30mm;height:30mm;display:flex;align-items:center;justify-content:center">${sscLogo ? `<img src="${sscLogo}" style="max-width:30mm;max-height:30mm;object-fit:contain" />` : ""}</div>
      <div style="width:30mm;height:30mm;display:flex;align-items:center;justify-content:center">${tpLogo ? `<img src="${tpLogo}" style="max-width:30mm;max-height:30mm;object-fit:contain" />` : ""}</div>
    </div>
  `;

  const title = isResultSheet ? "Result Sheet" : data?.type === "question_wise_log" ? "Question Wise Log Detail" : "Question Wise Time Taken Detail";

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

  const theoryHtml = isResultSheet && reportData?.length ? `
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
        ${signDataUri[0] ? `<img src="${signDataUri[0]}" style="height:30mm;width:30mm;margin-top:0px;margin-left:40px;object-fit:contain;">` : ``}
      </div>
      <div style="max-width: 50%;">
        <div style="text-align:start;">TP Name - ${candidateDetails?.partner ?? ""}</div>
        <div style="margin-top:8px;text-align:start">Center Manager's Name - ${candidateDetails?.center_manager_name ?? ""}</div>
        <div style="margin-top:8px">Seal & Sign</div>
        ${signDataUri[1] ? `<img src="${signDataUri[1]}" style="height:30mm;width:30mm;margin-top:0px;margin-left:40px;object-fit:contain;">` : ``}
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

export const generateCandidatePdf = async (data: any, assets: any, type: string = 'result_sheet') => {
  const candidateDetails = data?.candidate || {};

  const [logos, agencySign, tcSign] = await Promise.all([
    Promise.all([
      assets?.agency_image ? urlToBase64(assets.agency_image) : null,
      assets?.ssc_image ? urlToBase64(assets.ssc_image) : null,
      assets?.tp_image ? urlToBase64(assets.tp_image) : null,
    ]),
    assets?.agency_sign ? urlToBase64(assets.agency_sign) : null,
    assets?.tc_sign ? urlToBase64(assets.tc_sign) : null,
  ]);

  data.type = type;
  const html = buildHtml(data, logos, [agencySign, tcSign]);

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "10mm", bottom: "10mm", left: "5mm", right: "5mm" } });
  await page.close();

  let fileName = "Result_Sheet.pdf";
  if (type === 'result_sheet') {
    fileName = `${candidateDetails?.candidate_id}_Result_Sheet.pdf`;
  } else if (type === 'question_wise_log') {
    fileName = `${candidateDetails?.candidate_id}_Question_Wise_Log_Detail.pdf`;
  } else if (type === 'question_wise_time_taken') {
    fileName = `${candidateDetails?.candidate_id}_Question_Wise_Time_Taken_Detail.pdf`;
  }

  return { fileName, buffer: Buffer.from(pdf) };
};
