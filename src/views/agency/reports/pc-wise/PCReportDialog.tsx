import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";

// import XLSX from 'xlsx';

import { format } from "date-fns";

import type { batches, nos, pc, schemes, students, users } from "@prisma/client";

import tableStyles from '@core/styles/table.module.css'

import type { QPType } from "@/types/qualification-pack/qpType";

import DialogCloseButton from "@/components/dialogs/DialogCloseButton";
import { agencyImagePath } from "@/configs/customDataConfig";
import { RESULT_CRITERIA } from "@/configs/resultCriteria";
import {
  evaluateResult,
  getEnabledObtained,
  getEnabledTotal,
  getPercentage,
} from "@/libs/resultCriteria";

type nosWithPcs = nos & {
  pcs: pc[];
};

type PCReportDialogProps = {
  open: boolean
  handleClose: () => void
  theoryMarks: any
  batchReportData: batches & {agency: users, qualification_pack: QPType, scheme: schemes, sub_scheme: schemes, students: students[], nos: nosWithPcs[]} | null
  selectedCandidate: string | null
  practicalMarks: any
  vivaMarks: any
}

const PCReportDialog = ({ open, handleClose, theoryMarks, practicalMarks, vivaMarks, batchReportData, selectedCandidate } : PCReportDialogProps) => {

  const hasSection = {
    theory: Boolean(batchReportData?.theory_exam_set_id),
    practical: Boolean(batchReportData?.practical_exam_set_id),
    viva: Boolean(batchReportData?.viva_exam_set_id),
  };

  const getEnabledNosTotal = (nosItem: any) => {
    return (nosItem.pcs || []).reduce((sum: number, pcItem: any) => {
      return sum +
        (RESULT_CRITERIA.theory && hasSection.theory ? Number(pcItem.theory_marks || 0) : 0) +
        (RESULT_CRITERIA.practical && hasSection.practical ? Number(pcItem.practical_marks || 0) : 0) +
        (RESULT_CRITERIA.viva && hasSection.viva ? Number(pcItem.viva_marks || 0) : 0);
    }, 0);
  };

  const getEnabledNosObtained = (nosItem: any) => {
    return (nosItem.pcs || []).reduce((sum: number, pcItem: any) => {
      return sum +
        (RESULT_CRITERIA.theory && hasSection.theory ? Number(theoryMarks?.pcs?.[pcItem.id] || 0) : 0) +
        (RESULT_CRITERIA.practical && hasSection.practical ? Number(practicalMarks?.pcs?.[pcItem.id] || 0) : 0) +
        (RESULT_CRITERIA.viva && hasSection.viva ? Number(vivaMarks?.pcs?.[pcItem.id] || 0) : 0);
    }, 0);
  };

  const sectionTotals = {
    theory: Number(batchReportData?.qualification_pack?.total_theory_marks || 0),
    practical: Number(batchReportData?.qualification_pack?.total_practical_marks || 0),
    viva: Number(batchReportData?.qualification_pack?.total_viva_marks || 0),
  };

  const sectionObtained = {
    theory: Object.values(theoryMarks?.pcs || {}).reduce(
      (sum: number, marks: any) => sum + Number(marks || 0),
      0
    ),
    practical: Object.values(practicalMarks?.pcs || {}).reduce(
      (sum: number, marks: any) => sum + Number(marks || 0),
      0
    ),
    viva: Object.values(vivaMarks?.pcs || {}).reduce(
      (sum: number, marks: any) => sum + Number(marks || 0),
      0
    ),
  };

  const overallPercentage = getPercentage(
    getEnabledObtained(sectionObtained, hasSection),
    getEnabledTotal(sectionTotals, hasSection)
  );

  const nosResults: Array<{ percentage: number; cutoff: number }> = [];

  for (const nosItem of batchReportData?.nos || []) {
    const totalMarks = getEnabledNosTotal(nosItem);

    if (totalMarks <= 0) continue;

    nosResults.push({
      percentage: getPercentage(getEnabledNosObtained(nosItem), totalMarks),
      cutoff: Number(batchReportData?.qualification_pack?.nos_cutoff_marks || 0),
    });
  }

  const finalEvaluation = evaluateResult({
    theory: {
      applicable: hasSection.theory,
      percentage: getPercentage(
        sectionObtained.theory,
        sectionTotals.theory
      ),
      cutoff: Number(batchReportData?.qualification_pack?.theory_cutoff_marks || 0),
    },
    practical: {
      applicable: hasSection.practical,
      percentage: getPercentage(
        sectionObtained.practical,
        sectionTotals.practical
      ),
      cutoff: Number(batchReportData?.qualification_pack?.practical_cutoff_marks || 0),
    },
    viva: {
      applicable: hasSection.viva,
      percentage: getPercentage(sectionObtained.viva, sectionTotals.viva),
      cutoff: Number(batchReportData?.qualification_pack?.viva_cutoff_marks || 0),
    },
    overall: {
      applicable: true,
      percentage: overallPercentage,
      cutoff: Number(batchReportData?.qualification_pack?.overall_cutoff_marks || 0),
    },
    nos: nosResults,
  });

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
      XLSX.writeFile(wb, `PC Wise Result Sheet ${batchReportData?.qualification_pack?.qualification_pack_name} (${batchReportData?.qualification_pack?.qualification_pack_id}) v${batchReportData?.qualification_pack?.version?.version_number} .xlsx`);
    } else {
      console.error('Table not found!');
    }
  };

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
        PC Wise Report
        <Button
          color='secondary'
          variant='tonal'
          startIcon={<i className='tabler-upload' />}
          className='is-full sm:is-auto'
          onClick={handleGenerateReport}
        >
          Export
        </Button>
      </DialogTitle>
      <form onSubmit={() => null}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <div className='overflow-x-auto'>
            <table className={`${tableStyles.table} text-center report-table text-xs m-0 table-pc-wise`}>
              <thead>
                <tr>
                  <th colSpan={11} className="text-center bs-[30px] p-1.5 text-[13px]">{batchReportData?.agency?.company_name} {batchReportData?.agency?.avatar ? <img src={agencyImagePath(batchReportData?.agency.id, batchReportData?.agency?.avatar)} alt="Agency Logo" className="w-14 h-14 object-contain" /> : null}</th>
                </tr>
                <tr>
                  <th colSpan={2} className="bs-[30px] p-1.5 text-[13px]">Batch ID</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">{batchReportData?.batch_name || ''}</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">Assessment Date</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">{batchReportData?.assessment_start_datetime ? format(batchReportData.assessment_start_datetime, 'd-MMM-y') : '0'}</th>
                </tr>
                <tr>
                  <th colSpan={2} className="bs-[30px] p-1.5 text-[13px]">Sector</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">{batchReportData?.qualification_pack?.ssc?.ssc_name}</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">Candidate ID</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">{selectedCandidate}</th>
                </tr>
                <tr>
                  <th colSpan={2} className="bs-[30px] p-1.5 text-[13px]">Job Role</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">{batchReportData?.qualification_pack ? batchReportData?.qualification_pack?.qualification_pack_name : ''}</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">Candidate Name</th>
                  <th colSpan={3} className="bs-[30px] p-1.5 text-[13px]">{batchReportData?.students?.find(student => student.candidate_id === selectedCandidate)?.candidate_name || ''}</th>
                </tr>
                <tr>
                  <th rowSpan={2} className="text-center bs-[30px] p-1.5 text-[13px]">Sr. No</th>
                  <th rowSpan={2} className="text-center bs-[30px] p-1.5 text-[13px]">NOS ID</th>
                  <th rowSpan={2} className="text-center bs-[30px] p-1.5 text-[13px]">PC ID</th>
                  <th colSpan={2} className="text-center bs-[30px] p-1.5 text-[13px]">Theory Marks</th>
                  <th colSpan={2} className="text-center bs-[30px] p-1.5 text-[13px]">Practical Marks</th>
                  <th colSpan={2} className="text-center bs-[30px] p-1.5 text-[13px]">Viva Marks</th>
                  <th colSpan={2} className="text-center bs-[30px] p-1.5 text-[13px]">Total Marks</th>
                </tr>
                <tr>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Out Of</th>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Obtained</th>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Out Of</th>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Obtained</th>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Out Of</th>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Obtained</th>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Out Of</th>
                  <th className="text-center bs-[30px] p-1.5 text-[13px]">Obtained</th>
                </tr>
              </thead>
              <tbody>
                {/* {batchReportData?.nos.map((nosItem, nosIndex) => (
                  nosItem.pcs.map((pcItem, pcIndex) => {
                    const theoryOutOf = parseFloat(pcItem.theory_marks.toString());
                    const practicalOutOf = parseFloat(pcItem.practical_marks.toString());
                    const vivaOutOf = parseFloat(pcItem.viva_marks.toString());

                    const obtainedTheoryMarks = theoryMarks?.pcs?.[pcItem.id] || 0;
                    // Assuming practical and viva marks are not calculated in this dialog
                    const obtainedPracticalMarks = 0;
                    const obtainedVivaMarks = 0;

                    const totalOutOf = theoryOutOf + practicalOutOf + vivaOutOf;
                    const totalObtained = obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks;

                    return (
                      <tr key={`${nosItem.nos_id}-${pcItem.pc_id}`}>
                        {pcIndex === 0 && (
                          <td rowSpan={nosItem.pcs.length}>{nosIndex + 1}</td>
                        )}
                        {pcIndex === 0 && (
                          <td rowSpan={nosItem.pcs.length}>{nosItem.nos_id}</td>
                        )}
                        <td>{pcItem.pc_id}</td>
                        <td>{theoryOutOf}</td>
                        <td>{obtainedTheoryMarks}</td>
                        <td>{practicalOutOf}</td>
                        <td>{obtainedPracticalMarks}</td>
                        <td>{vivaOutOf}</td>
                        <td>{obtainedVivaMarks}</td>
                        <td>{totalOutOf}</td>
                        <td>{totalObtained}</td>
                      </tr>
                    );
                  })
                ))} */}
                {(() => {
                  let srNo = 1; // ✅ initialize serial number counter

                  return batchReportData?.nos?.map((nosItem) =>
                    nosItem.pcs.map((pcItem) => {
                      const theoryOutOf = parseFloat(pcItem.theory_marks?.toString() || '0');
                      const practicalOutOf = parseFloat(pcItem.practical_marks?.toString() || '0');
                      const vivaOutOf = parseFloat(pcItem.viva_marks?.toString() || '0');

                      const obtainedTheoryMarks = theoryMarks?.pcs?.[pcItem.id] || 0;
                      const obtainedPracticalMarks = practicalMarks?.pcs?.[pcItem.id] || 0;
                      const obtainedVivaMarks = vivaMarks?.pcs?.[pcItem.id] || 0;

                      const totalOutOf = theoryOutOf + practicalOutOf + vivaOutOf;

                      const totalObtained =
                        obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks;

                      return (
                        <tr key={`${nosItem.nos_id}-${pcItem.pc_id}`}>
                          <td className="bs-[30px] p-1.5 text-[13px]">{srNo++}</td> {/* ✅ continuous serial number */}
                          <td className="bs-[30px] p-1.5 text-[13px]">{nosItem.nos_id}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{pcItem.pc_id}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{theoryOutOf}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{obtainedTheoryMarks}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{practicalOutOf}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{obtainedPracticalMarks}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{vivaOutOf}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{obtainedVivaMarks}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{totalOutOf}</td>
                          <td className="bs-[30px] p-1.5 text-[13px]">{totalObtained.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  );
                })()}
                <tr className="border-0">
                  <td colSpan={11} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                </tr>
                <tr className="border-0">
                  <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                  <td colSpan={5} className="bs-[30px] p-1.5 text-[13px]">Summary</td>
                  <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                </tr>
                <tr className="border-0">
                  <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                  <td className="bs-[30px] p-1.5 text-[13px]">NOS ID</td>
                  <td className="bs-[30px] p-1.5 text-[13px]">Total Marks</td>
                  <td className="bs-[30px] p-1.5 text-[13px]">Obtained</td>
                  <td className="bs-[30px] p-1.5 text-[13px]">Percentage (%)</td>
                  <td className="bs-[30px] p-1.5 text-[13px]">Status</td>
                  <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                </tr>
                {batchReportData?.nos.map((nosItem) => {
                  const totalMarks = getEnabledNosTotal(nosItem);

                  const obtainedMarks = getEnabledNosObtained(nosItem);

                  const percentage = getPercentage(obtainedMarks, totalMarks);

                  const status = RESULT_CRITERIA.nos
                    ? percentage >= (batchReportData?.qualification_pack?.nos_cutoff_marks || 0)
                      ? 'Pass'
                      : 'Fail'
                    : 'N/A';

                  return (
                    <tr key={`summary-${nosItem.nos_id}`} className="border-0">
                      <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                      <td className="bs-[30px] p-1.5 text-[13px]">{nosItem.nos_id}</td>
                      <td className="bs-[30px] p-1.5 text-[13px]">{totalMarks.toFixed(2)}</td>
                      <td className="bs-[30px] p-1.5 text-[13px]">{obtainedMarks.toFixed(2)}</td>
                      <td className="bs-[30px] p-1.5 text-[13px]">{(percentage % 1 ? percentage.toFixed(2) : percentage)}</td>
                      <td className={`bs-[30px] p-1.5 text-[13px] ${status.toLowerCase()}`}>{status}</td>
                      <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                    </tr>
                  );
                })}
                <tr className="border-0">
                  <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                  <td className="bs-[30px] p-1.5 text-[13px]">Total</td>
                  <td className="bs-[30px] p-1.5 text-[13px]">{getEnabledTotal(sectionTotals, hasSection).toFixed(2)}</td>
                  <td className="bs-[30px] p-1.5 text-[13px]">{getEnabledObtained(sectionObtained, hasSection).toFixed(2)}</td>
                  <td className="bs-[30px] p-1.5 text-[13px]">{overallPercentage % 1 ? overallPercentage.toFixed(2) : overallPercentage}</td>
                  {finalEvaluation.pass ? <td className="bs-[30px] p-1.5 text-[13px] pass">Pass</td> : <td className="bs-[30px] p-1.5 text-[13px] fail">Fail</td>}
                  <td colSpan={3} className="border-0 bs-[30px] p-1.5 text-[13px]"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default PCReportDialog;
