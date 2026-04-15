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


// import { agencyImagePath } from "@/configs/customDataConfig";



type QuestionWiseLogDetailDialogProps = {
  open: boolean
  handleClose: () => void
  selectedCandidate: string | null
  candidateId: number | null
}

const LogDetailDialog = ({ open, handleClose, selectedCandidate, candidateId } : QuestionWiseLogDetailDialogProps) => {

  const [logDetail, setLogDetail] = useState<any>(null);
  const [candidateDetails, setCandidateDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState('1');

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
      tabValue === '1' ? "Correct Answer" : "Question open time (in hh:mm:ss)",
      tabValue === '1' ? "Candidate's Response" : "Question close time (in hh:mm:ss)",
      tabValue === '1' ? "Status" : "Duration"
    ];

    const tableRows:any[] = [];

    logDetail?.forEach((item:any)=>{

      tableRows.push({
        sr_no: item.sr_no ,
        nos_name: item.nos_name ,
        pc_name: item.pc_name ,
        question: item.question ,

        col1: tabValue === '1'
          ? item.correct_answer
          : item.open_time,

        col2: tabValue === '1'
          ? item.candidate_response
          : item.submit_time,

        col3: tabValue === '1'
          ? item.status
          : item.duration
      });

    });


    const passIconPng = await svgToPngBase64(passIcon);
    const failIconPng = await svgToPngBase64(failIcon);

    pdf.setFontSize(14);

    if (tabValue === '1') {

      pdf.text("Question Wise Log Detail", 105, 10, { align: "center" })

    } else if (tabValue === '2') {

      pdf.text("Question Wise Time Taken Detail", 105, 10, { align: "center" })

    }

    const rawLogos = [
      candidateDetails?.ssc_image,
      candidateDetails?.agency_image,
      candidateDetails?.tp_image,
    ].filter(Boolean);

    // 🔥 convert all to base64
    const logos: string[] = [];

    for (const logo of rawLogos) {
      if (logo.startsWith("data:image")) {
        logos.push(logo); // already base64
      } else {
        const base64 = await urlToBase64(logo);

        if (base64) logos.push(base64);
      }
    }

    const pageWidth = pdf.internal.pageSize.getWidth();

    const boxWidth = 50;
    const boxHeight = 50;
    const gap = 5;

    let x = 10;
    let y = 15;

    for (const logo of logos) {
      try {
        const img = new Image();

        img.src = logo;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const imgW = img.width;
        const imgH = img.height;

        // ✅ scale like object-fit: contain
        const scale = Math.min(boxWidth / imgW, boxHeight / imgH);

        const drawWidth = imgW * scale;
        const drawHeight = imgH * scale;

        // ✅ center inside box
        const offsetX = (boxWidth - drawWidth) / 2;
        const offsetY = (boxHeight - drawHeight) / 2;

        // 👉 wrap if needed
        if (x + boxWidth > pageWidth - 10) {
          x = 10;
          y += boxHeight + gap;
        }

        // (optional) draw box border for debugging
        // pdf.rect(x, y, boxWidth, boxHeight);

        pdf.addImage(
          logo,
          "PNG",
          x + offsetX,
          y + offsetY,
          drawWidth,
          drawHeight
        );

        x += boxWidth + gap;

      } catch {

        // ignore broken images

      }
    }

    // ✅ next section starts here
    const currentY = y + boxHeight + 5;

    // // ✅ Next content starts after logos
    // const currentY = y + logoHeight + 5;

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
          "Total Marks:", candidateDetails?.total_marks ?? "-",
        ],
        [
          "Obtained Marks:", candidateDetails?.obtained_marks ?? "-",
          "Result:", candidateDetails?.result_status ?? "-",
        ],
        [
          "Percentage (%):", candidateDetails?.percentage ?? "-"
        ],
      ],
    });

    autoTable(pdf,{
      head:[tableColumn],

      body:tableRows.map(row => [
        row.sr_no,
        row.nos_name,
        row.pc_name,
        row.question,
        row.col1,
        row.col2,
        tabValue === '1' ? "" : row.col3,
      ]),

      // startY:20,
      startY: (pdf as any).lastAutoTable.finalY + 5,

      theme:'grid',
      headStyles:{
        fillColor: "#0047AB",
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
        4:{cellWidth: tabValue === "1" ? 32 : 30},  // Correct
        5:{cellWidth: tabValue === "1" ? 32 : 30},  // Response
        6:{cellWidth: tabValue === "1" ? 13 : 17},   // Status
      },

      margin:{left:5,right:5},

      // ✅ DRAW ICON HERE
      didDrawCell: function (data) {
        if (data.section === 'body' && data.column.index === 6 && tabValue === '1') {

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

    let fileName = "";

    if (tabValue === '1') {
      fileName = `${selectedCandidate}_Question_Wise_Log_Detail.pdf`;
    } else if (tabValue === '2') {
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
            <Tab value='1' label="Question Wise Log" />
            <Tab value='2' label="Question Wise Time Taken" />
          </CustomTabList>
          <TabPanel value='1'>
            <div className='overflow-x-auto'>
              <CandidateDetail candidateDetails={candidateDetails} />
              <QuestionWiseLogDetailTable logDetail={logDetail} />
            </div>
          </TabPanel>
          <TabPanel value='2'>
            <div className='overflow-x-auto'>
              {candidateDetails && (
                <CandidateDetail candidateDetails={candidateDetails} />
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
