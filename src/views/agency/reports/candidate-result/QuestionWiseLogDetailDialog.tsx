import { useEffect, useState } from "react";

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Typography from "@mui/material/Typography";

// import XLSX from 'xlsx';

// import { format } from "date-fns";

// import type { batches, nos, pc, students } from "@prisma/client";

// import tableStyles from '@core/styles/table.module.css'

import DialogCloseButton from "@/components/dialogs/DialogCloseButton";

// import { agencyImagePath } from "@/configs/customDataConfig";



type QuestionWiseLogDetailDialogProps = {
  open: boolean
  handleClose: () => void
  selectedCandidate: string | null
  candidateId: number | null
}

const QuestionWiseLogDetailDialog = ({ open, handleClose, selectedCandidate, candidateId } : QuestionWiseLogDetailDialogProps) => {

  const [logDetail, setLogDetail] = useState<any>(null);
  const [candidateDetails, setCandidateDetails] = useState<any>(null);

  const handleGenerateReport = async () => {

    const XLSX = await import('xlsx');

    // Get the table element
    const table = document.querySelector('.table-pc-wise');

    // Check if the table exists
    if (table) {
      // Convert the HTML table to a worksheet
      const ws = XLSX.utils.table_to_sheet(table, { sheet: 'PC Wise Result' });

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Append the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'PC Wise Result');

      // Write and download the Excel file
      XLSX.writeFile(wb, `Question_wise_log_details.xlsx`);
    } else {
      console.error('Table not found!');
    }
  };

  const handleGeneratePDF = async () => {

    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

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
      "Correct Answer",
      "Candidate Response",
      "Status"
    ];

    const tableRows:any[] = [];

    logDetail?.forEach((item:any)=>{

      tableRows.push([
        item.sr_no,
        item.nos_name,
        item.pc_name,
        item.question,
        item.correct_answer,
        item.candidate_response,
        item.status === 1 ? "✔" : item.status === 0 ? "✘" : '--'
      ]);

    });

    autoTable(pdf,{
      head:[tableColumn],

      body:tableRows,

      startY:20,

      theme:'grid',

      styles:{
        fontSize:7,
        cellPadding:2,
        overflow:'linebreak'
      },

      columnStyles:{
        0:{cellWidth:8},   // Sr
        1:{cellWidth:28},  // NOS
        2:{cellWidth:28},  // PC
        3:{cellWidth:55},  // Question
        4:{cellWidth:32},  // Correct
        5:{cellWidth:32},  // Response
        6:{cellWidth:10}   // Status
      },

      margin:{left:5,right:5},

      didDrawPage:(data)=>{

        pdf.setFontSize(12);

        pdf.text(
          "Question Wise Log Report",
          data.settings.margin.left,
          10
        );

      }

    });

    pdf.save(`Question_Log_${selectedCandidate}.pdf`);

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
        Question Wise Log Details
        <Button
          color='secondary'
          variant='tonal'
          startIcon={<i className='tabler-upload' />}
          className='is-full sm:is-auto'
          onClick={handleGenerateReport}
        >
          Export
        </Button>
        <Button
          color='primary'
          variant='tonal'
          startIcon={<i className='tabler-file' />}
          onClick={handleGeneratePDF}
        >
          PDF
        </Button>
      </DialogTitle>
      {/* <form onSubmit={() => null}> */}
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <div className='overflow-x-auto'>
          <div>
            <Typography variant='h6' className='mb-4'>
              Candidate Details
            </Typography>
            <img src={candidateDetails?.ssc_image} alt="SSC Logo" width={200} height={200} />
            <Typography variant='body2' className='mb-2'>
              Batch : {candidateDetails?.batch}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Scheme : {candidateDetails?.scheme}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Sub- Scheme : {candidateDetails?.sub_scheme}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Assessment Date : {candidateDetails?.assessmentDate}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Job Role : {candidateDetails?.qp}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              TP/PIA{"'"}s Name : {candidateDetails?.partner}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Candidate{"'"}s Name : {candidateDetails?.name}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Candidate{"'"}s ID : {candidateDetails?.candidate_id}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Aadhaar No. : {candidateDetails?.aadhaar}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Total Marks : {candidateDetails?.total_marks}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Obtained Marks : {candidateDetails?.obtained_marks}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Result Status: {candidateDetails?.result_status}
            </Typography>
            <Typography variant='body2' className='mb-2'>
              Percentage (%): {candidateDetails?.percentage}
            </Typography>
          </div>

          <table className={` text-start text-xs m-0 table-pc-wise`}>
            <thead>
              <tr>
                <th>SR. No.</th>
                <th>NOS Name</th>
                <th>PC Name</th>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Candidate Response</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logDetail?.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.sr_no}</td>
                  <td>{item.nos_name}</td>
                  <td>{item.pc_name}</td>
                  <td>{item.question}</td>
                  <td>{item.correct_answer}</td>
                  <td>{item.candidate_response}</td>
                  <td>{item.status === 1 ? "✔" : item.status === 0 ? "✘" : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
      {/* </form> */}
    </Dialog>
  )
}

export default QuestionWiseLogDetailDialog;
