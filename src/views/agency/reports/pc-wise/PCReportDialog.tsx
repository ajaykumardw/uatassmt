import { useEffect } from "react";

import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";

import XLSX from 'xlsx';

import { format } from "date-fns";

import type { batches, nos, pc, schemes, students } from "@prisma/client";

import tableStyles from '@core/styles/table.module.css'

import type { QPType } from "@/types/qualification-pack/qpType";

import DialogCloseButton from "@/components/dialogs/DialogCloseButton";

type nosWithPcs = nos & {
  pcs: pc[];
};

type PCReportDialogProps = {
  open: boolean
  handleClose: () => void
  theoryMarks: any
  batchReportData: batches & {qualification_pack: QPType, scheme: schemes, sub_scheme: schemes, students: students[], nos: nosWithPcs[]} | null
  selectedCandidate: string | null
}

const PCReportDialog = ({ open, handleClose, theoryMarks, batchReportData, selectedCandidate } : PCReportDialogProps) => {


  useEffect(() => {

    if (theoryMarks && open) {
      console.log('theoryMarks in dialog:', theoryMarks);
    }
  }, [theoryMarks, open]);

  const handleGenerateReport = () => {
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
                  <th colSpan={11} className="text-center">{batchReportData?.qualification_pack?.ssc?.agency?.company_name}</th>
                </tr>
                <tr>
                  <th colSpan={2}>Batch ID</th>
                  <th colSpan={3}>{batchReportData?.batch_name || ''}</th>
                  <th colSpan={3}>Assessment Date</th>
                  <th colSpan={3}>{batchReportData?.assessment_start_datetime ? format(batchReportData.assessment_start_datetime, 'd-MMM-y') : '0'}</th>
                </tr>
                <tr>
                  <th colSpan={2}>Sector</th>
                  <th colSpan={3}>{batchReportData?.qualification_pack?.ssc?.ssc_name}</th>
                  <th colSpan={3}>Candidate ID</th>
                  <th colSpan={3}>{selectedCandidate}</th>
                </tr>
                <tr>
                  <th colSpan={2}>Job Role</th>
                  <th colSpan={3}>{batchReportData?.qualification_pack ? batchReportData?.qualification_pack?.qualification_pack_name : ''}</th>
                  <th colSpan={3}>Candidate Name</th>
                  <th colSpan={3}>{batchReportData?.students?.find(student => student.candidate_id === selectedCandidate)?.candidate_name || ''}</th>
                </tr>
                <tr>
                  <th rowSpan={2} className="text-center">Sr. No</th>
                  <th rowSpan={2} className="text-center">NOS ID</th>
                  <th rowSpan={2} className="text-center">PC ID</th>
                  <th colSpan={2} className="text-center">Theory Marks</th>
                  <th colSpan={2} className="text-center">Practical Marks</th>
                  <th colSpan={2} className="text-center">Viva Marks</th>
                  <th colSpan={2} className="text-center">Total Marks</th>
                </tr>
                <tr>
                  <th className="text-center">Out Of</th>
                  <th className="text-center">Obtained</th>
                  <th className="text-center">Out Of</th>
                  <th className="text-center">Obtained</th>
                  <th className="text-center">Out Of</th>
                  <th className="text-center">Obtained</th>
                  <th className="text-center">Out Of</th>
                  <th className="text-center">Obtained</th>
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
                      const obtainedPracticalMarks = 0;
                      const obtainedVivaMarks = 0;

                      const totalOutOf = theoryOutOf + practicalOutOf + vivaOutOf;

                      const totalObtained =
                        obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks;

                      return (
                        <tr key={`${nosItem.nos_id}-${pcItem.pc_id}`}>
                          <td>{srNo++}</td> {/* ✅ continuous serial number */}
                          <td>{nosItem.nos_id}</td>
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
                  );
                })()}
                <tr className="border-0">
                  <td colSpan={11} className="border-0"></td>
                </tr>
                <tr className="border-0">
                  <td colSpan={3} className="border-0"></td>
                  <td colSpan={5}>Summary</td>
                  <td colSpan={3} className="border-0"></td>
                </tr>
                <tr className="border-0">
                  <td colSpan={3} className="border-0"></td>
                  <td>NOS ID</td>
                  <td>Total Marks</td>
                  <td>Obtained</td>
                  <td>Percentage (%)</td>
                  <td>Status</td>
                  <td colSpan={3} className="border-0"></td>
                </tr>
                {batchReportData?.nos.map((nosItem) => {
                  const totalMarks = nosItem.pcs.reduce((sum, pcItem) => {
                    return sum + parseFloat(pcItem.theory_marks?.toString() || '0') +
                      parseFloat(pcItem.practical_marks?.toString() || '0') +
                      parseFloat(pcItem.viva_marks?.toString() || '0');
                  }, 0);

                  const obtainedMarks = nosItem.pcs.reduce((sum, pcItem) => {
                    const obtainedTheoryMarks = theoryMarks?.pcs?.[pcItem.id] || 0;
                    const obtainedPracticalMarks = 0;
                    const obtainedVivaMarks = 0;

                    return sum + obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks;
                  }, 0);

                  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
                  const status = percentage >= (batchReportData?.qualification_pack?.nos_cutoff_marks || 0) ? 'Pass' : 'Fail';

                  return (
                    <tr key={`summary-${nosItem.nos_id}`} className="border-0">
                      <td colSpan={3} className="border-0"></td>
                      <td>{nosItem.nos_id}</td>
                      <td>{totalMarks.toFixed(2)}</td>
                      <td>{obtainedMarks.toFixed(2)}</td>
                      <td>{(percentage % 1 ? percentage.toFixed(2) : percentage)}</td>
                      <td>{status}</td>
                      <td colSpan={3} className="border-0"></td>
                    </tr>
                  );
                })}
                <tr className="border-0">
                  <td colSpan={3} className="border-0"></td>
                  <td>Total</td>
                  <td>{batchReportData?.nos.reduce((sum, nosItem) => {
                    return sum + nosItem.pcs.reduce((pcSum, pcItem) => {
                      return pcSum + parseFloat(pcItem.theory_marks?.toString() || '0') +
                        parseFloat(pcItem.practical_marks?.toString() || '0') +
                        parseFloat(pcItem.viva_marks?.toString() || '0');
                    }, 0);
                  }, 0).toFixed(2)}</td>
                  <td>{batchReportData?.nos.reduce((sum, nosItem) => {
                    return sum + nosItem.pcs.reduce((pcSum, pcItem) => {
                      const obtainedTheoryMarks = theoryMarks?.pcs?.[pcItem.id] || 0;
                      const obtainedPracticalMarks = 0;
                      const obtainedVivaMarks = 0;

                      return pcSum + obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks;
                    }, 0);
                  }, 0).toFixed(2)}</td>
                  <td>
                    {(() => {
                      const totalMarks = batchReportData?.nos.reduce((sum, nosItem) => {
                        return sum + nosItem.pcs.reduce((pcSum, pcItem) => {
                          return pcSum + parseFloat(pcItem.theory_marks?.toString() || '0') +
                            parseFloat(pcItem.practical_marks?.toString() || '0') +
                            parseFloat(pcItem.viva_marks?.toString() || '0');
                        }, 0);
                      }, 0) || 0;

                      const obtainedMarks = batchReportData?.nos.reduce((sum, nosItem) => {
                        return sum + nosItem.pcs.reduce((pcSum, pcItem) => {
                          const obtainedTheoryMarks = theoryMarks?.pcs?.[pcItem.id] || 0;
                          const obtainedPracticalMarks = 0;
                          const obtainedVivaMarks = 0;

                          return pcSum + obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks;
                        }, 0);
                      }, 0) || 0;

                      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

                      return percentage % 1 ? percentage.toFixed(2) : percentage;
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const totalMarks = batchReportData?.nos.reduce((sum, nosItem) => {
                        return sum + nosItem.pcs.reduce((pcSum, pcItem) => {
                          return pcSum + parseFloat(pcItem.theory_marks?.toString() || '0') +
                            parseFloat(pcItem.practical_marks?.toString() || '0') +
                            parseFloat(pcItem.viva_marks?.toString() || '0');
                        }, 0);
                      }, 0) || 0;

                      const obtainedMarks = batchReportData?.nos.reduce((sum, nosItem) => {
                        return sum + nosItem.pcs.reduce((pcSum, pcItem) => {
                          const obtainedTheoryMarks = theoryMarks?.pcs?.[pcItem.id] || 0;
                          const obtainedPracticalMarks = 0;
                          const obtainedVivaMarks = 0;

                          return pcSum + obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks;
                        }, 0);
                      }, 0) || 0;

                      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

                      return percentage >= (batchReportData?.qualification_pack?.overall_cutoff_marks || 0) ? 'Pass' : 'Fail';
                    })()}
                  </td>
                  <td colSpan={3} className="border-0"></td>
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
