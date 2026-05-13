'use client'

import React from 'react';

// React Imports
import { useEffect, useState,

   useMemo, Fragment

   } from 'react';

// MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';

import Typography from '@mui/material/Typography';

import Chip from '@mui/material/Chip';

// import IconButton from '@mui/material/IconButton';

import TablePagination from '@mui/material/TablePagination';

// import type { TextFieldProps } from '@mui/material/TextField';

import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import type { ColumnDef, FilterFn } from '@tanstack/react-table'

// import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { students } from '@prisma/client';

// Type Imports
// import type { ThemeColor } from '@core/types'

// import XLSX from 'xlsx';

// import { format } from 'date-fns';

// Component Imports
import TableFilters from './TableFilters'

import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
// import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// import type { QPType } from '@/types/qualification-pack/qpType';

// import AddEditExamSetsDialog from '@/components/exam-sets/dialogs/AddEditExamSetsDialog';

// import CustomAvatar from '@/@core/components/mui/Avatar';

import { MenuProps, TableRowLimit } from '@/configs/customDataConfig';
import LogDetailDialog from './LogDetailDialog';
import ResultSheetAction from '@/components/zip/resultSheetAction';
import CertificateZipAction from '@/components/zip/CertficateZipAction';

// declare module '@tanstack/table-core' {
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo
//   }
// }

type StudentsTypeWithAction = students & {
  action?: string
  serialNumber?: number
  status?: string
  online_theory_exam_status?: number
}

// type UserRoleType = {
//   [key: string]: { icon: string; color: string }
// }

// type UserShowStatusType = {
//   [key: string]: string
// }

// type UserStatusType = {
//   [key: string]: ThemeColor
// }

// interface QuestionLevels {
//   E?: number;
//   M?: number;
//   H?: number;
// }

// Styled Components
// const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

// const DebouncedInput = ({
//   value: initialValue,
//   onChange,
//   debounce = 500,
//   ...props
// }: {
//   value: string | number
//   onChange: (value: string | number) => void
//   debounce?: number
// } & Omit<TextFieldProps, 'onChange'>) => {
//   // States
//   const [value, setValue] = useState(initialValue)

//   useEffect(() => {
//     setValue(initialValue)
//   }, [initialValue])

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       onChange(value)
//     }, debounce)

//     return () => clearTimeout(timeout)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [value])

//   return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
// }

// Vars

// const userShowStatusObj: UserShowStatusType = {

//   1: 'Active',

//   0: 'Inactive'

// }

// const userStatusObj: UserStatusType = {
//   1: 'success',
//   0: 'secondary'
// }

// Column Definitions
const columnHelper = createColumnHelper<StudentsTypeWithAction>()

// type nosWithPcs = nos & {
//   pcs: pc[];
// };

// sdfsd
// type PC = {
//   pc_id: string;
// };

// type Question = {
//   question_type: string;
//   marks: number;

//   pc_questions: {
//     pc: pc & {
//       nos: nos;
//     };
//   }[];

//   // pc: (pc & { nos: nos })[];
// };

// type ExamSetResult = {
//   student_answer: number;
//   correct_answer: number;
//   question: Question;
// };

// type Student = {
//   id: number;
//   candidate_id: string;
//   exam_set_results?: ExamSetResult[];
//   student_question_attempts?: (student_question_attempts & { question: Question })[];
// };

// type TheoryMarksResult = Record<string, Record<string, number>>;

// const getTheoryMarksPerStudent = (students: Student[]): TheoryMarksResult => {
//   const result: TheoryMarksResult = {};

//   students.forEach((student) => {
//     const name = student.candidate_id;
//     const pcMarks: Record<string, number> = {};

//     student.exam_set_results?.forEach((res) => {
//       const isCorrect = res.student_answer === res.correct_answer;
//       // const isCorrect = true;
//       const question = res.question;

//       if (question.question_type === "theory") {
//         question.pc.forEach((pc) => {
//           const pcId = pc.pc_id;
//           const theoryMark = parseFloat(pc.theory_marks.toString());

//           console.log("asfdafsa marks: ", pcId, theoryMark, pc);

//           if (!isNaN(theoryMark)) {
//             pcMarks[pcId] = (pcMarks[pcId] || 0) + (isCorrect ? theoryMark : 0);
//           }
//         });
//       }
//     });

//     result[name] = pcMarks;
//   });

//   return result;
// };


// interface TheoryMarksResult {
//   [candidateId: string]: { pcs: Record<string, number>; nos: Record<string, number> };
// }

// interface PracticalMarksResult {
//   [candidateId: string]: { pcs: Record<string, number>; nos: Record<string, number> };
// }

// interface VivaMarksResult {
//   [candidateId: string]: { pcs: Record<string, number>; nos: Record<string, number> };
// }

// interface FinalResult {
//   theoryMarks: TheoryMarksResult;
//   practicalMarks: PracticalMarksResult;
//   vivaMarks: VivaMarksResult;
//   totalTheoryMarks: Record<string, number>;
//   absentStudents: string[];
//   passedStudents: string[];
//   failedStudents: string[];
//   grossTotal: Record<string, number>;
//   percentage: Record<string, number>;
// }

// const PRECISION = 2;

// const roundMark = (value:number)=>{
//   return Number(value.toFixed(PRECISION));
// };

// const distributeMarksByPcWeight = (
//   question:any,
//   obtainedMarks:number,
//   markField:"practical_marks" | "viva_marks",
//   pcStore:Record<string,number>,
//   nosStore:Record<string,number>
// )=>{

//   const totalPcMarks = question.pc_questions.reduce((sum:any,pcq:any)=>{
//     return sum + Number(pcq.pc[markField] || 0);
//   },0);

//   if(totalPcMarks === 0) return;

//   let assignedTotal = 0;

//   question.pc_questions.forEach((pcQuestion:any,index:number)=>{

//     const pc = pcQuestion.pc;

//     const pcId = pc.id;

//     const nosId = pc?.nos?.nos_id;

//     const pcMax = Number(pc[markField] || 0);

//     let earnedMark =
//       (pcMax / totalPcMarks) * obtainedMarks;

//     if(index === question.pc_questions.length-1){

//       earnedMark =
//         roundMark(obtainedMarks - assignedTotal);

//     }
//     else{

//       earnedMark =
//         roundMark(earnedMark);

//       assignedTotal += earnedMark;

//     }

//     console.log("distributing ", markField, " for pcId: ", pcId, " nosId: ", nosId, " pcMax: ", pcMax, " obtainedMarks: ", obtainedMarks, " totalPcMarks: ", totalPcMarks, " earnedMark: ", earnedMark);

//     pcStore[pcId] =
//       roundMark((pcStore[pcId] || 0) + earnedMark);

//     if(nosId){

//       nosStore[nosId] =
//         roundMark((nosStore[nosId] || 0) + earnedMark);

//     }

//   });

// };

// const getTheoryMarksPerStudent = (
//   students: Student[],
//   qp: QPType | null
// ): FinalResult => {

//   const theoryMarks: TheoryMarksResult = {};
//   const practicalMarks: PracticalMarksResult = {};
//   const vivaMarks: VivaMarksResult = {};

//   const totalTheoryMarks: Record<string, number> = {};

//   const absentStudents: string[] = [];
//   const passedStudents: string[] = [];
//   const failedStudents: string[] = [];

//   const grossTotal: Record<string, number> = {};
//   const percentage: Record<string, number> = {};

//   students.forEach((student)=>{

//     const studentId = student.candidate_id;

//     if(!student.exam_set_results || student.exam_set_results.length===0){

//       absentStudents.push(studentId);

//       return;
//     }

//     const pcMarks: Record<string, number> = {};
//     const nosMarks: Record<string, number> = {};

//     const practicalPcMarks: Record<string, number> = {};
//     const practicalNosMarks: Record<string, number> = {};

//     const vivaPcMarks: Record<string, number> = {};
//     const vivaNosMarks: Record<string, number> = {};

//     const grossMax = qp?.total_marks ?? 0;

//     const overAllCutOff =
//       qp?.overall_cutoff_marks ?? 0;

//     // THEORY
//     student.exam_set_results.forEach((res)=>{

//       const isCorrect =
//         res.student_answer === res.correct_answer;

//       const question = res.question;

//       if(question.question_type==="theory"){

//         question.pc_questions.forEach((pcQuestion:any)=>{

//           const pcId = pcQuestion.pc.id;

//           const nosId =
//             pcQuestion.pc?.nos?.nos_id;

//           const theoryMark =
//             Number(pcQuestion.pc.theory_marks || 0);

//           const earnedMark =
//             isCorrect ? theoryMark : 0;

//           pcMarks[pcId] =
//             roundMark((pcMarks[pcId] || 0) + earnedMark);

//           if(nosId){

//             nosMarks[nosId] =
//               roundMark((nosMarks[nosId] || 0) + earnedMark);

//           }

//         });

//       }

//     });

//     // PRACTICAL + VIVA
//     student.student_question_attempts?.forEach((attempt)=>{

//       const question = attempt.question;

//       const obtainedMarks =
//         Number(attempt?.obtained_marks ?? 0);

//         console.log("question type: ", question.question_type, " for student: ", studentId, "attempt question: ", attempt.question);

//       if(question?.question_type==="practical"){

//         distributeMarksByPcWeight(
//           question,
//           obtainedMarks,
//           "practical_marks",
//           practicalPcMarks,
//           practicalNosMarks
//         );

//       }

//       if(question?.question_type==="viva"){

//         distributeMarksByPcWeight(
//           question,
//           obtainedMarks,
//           "viva_marks",
//           vivaPcMarks,
//           vivaNosMarks
//         );

//         console.log("viva marks distribution for student: ", studentId, " question: ", question, " vivaPcMarks: ", vivaPcMarks, " vivaNosMarks: ", vivaNosMarks);

//       }

//     });

//     const theoryTotal =
//       Object.values(pcMarks)
//         .reduce((sum,m)=>sum+m,0);

//     const practicalTotal =
//       Object.values(practicalPcMarks)
//         .reduce((sum,m)=>sum+m,0);

//     const vivaTotal =
//       Object.values(vivaPcMarks)
//         .reduce((sum,m)=>sum+m,0);

//     const gross =
//       roundMark(theoryTotal + practicalTotal + vivaTotal);

//     const percent =
//       grossMax>0
//         ? roundMark((gross/grossMax)*100)
//         : 0;

//     if(percent>=overAllCutOff){

//       passedStudents.push(studentId);

//     }
//     else{

//       failedStudents.push(studentId);

//     }

//     theoryMarks[studentId]={
//       pcs:pcMarks,
//       nos:nosMarks
//     };

//     practicalMarks[studentId]={
//       pcs:practicalPcMarks,
//       nos:practicalNosMarks
//     };

//     vivaMarks[studentId]={
//       pcs:vivaPcMarks,
//       nos:vivaNosMarks
//     };

//     totalTheoryMarks[studentId]=
//       roundMark(theoryTotal);

//     grossTotal[studentId]=gross;

//     percentage[studentId]=percent;

//   });

//   return {

//     theoryMarks,
//     practicalMarks,
//     vivaMarks,

//     totalTheoryMarks,

//     grossTotal,

//     passedStudents,
//     failedStudents,
//     absentStudents,

//     percentage

//   };

// };

// const getTheoryMarksPerStudent = (students: Student[], qp: QPType | null): FinalResult => {
//   const theoryMarks: TheoryMarksResult = {};
//   const practicalMarks: PracticalMarksResult = {};
//   const vivaMarks: VivaMarksResult = {};
//   const totalTheoryMarks: Record<string, number> = {};
//   const absentStudents: string[] = [];
//   const passedStudents: string[] = [];
//   const failedStudents: string[] = [];
//   const grossTotal: Record<string, number> = {};
//   const percentage: Record<string, number> = {};

//   students.forEach((student) => {
//     const studentId = student.candidate_id;
//     const candidateId = student.id;

//     if (!student.exam_set_results || student.exam_set_results.length === 0) {
//       absentStudents.push(studentId);

//       return;
//     }

//     const pcMarks: Record<string, number> = {};
//     const nosMarks: Record<string, number> = {};

//     const practicalPcMarks: Record<string, number> = {};
//     const practicalNosMarks: Record<string, number> = {};

//     const vivaPcMarks: Record<string, number> = {};
//     const vivaNosMarks: Record<string, number> = {};

//     const grossMax = qp?.total_marks ?? 0;
//     const overAllCutOff = qp?.overall_cutoff_marks ?? 0;

//     student.exam_set_results.forEach((res) => {
//       const isCorrect = res.student_answer === res.correct_answer;
//       const question = res.question;

//       if (question.question_type === "theory") {
//         question.pc_questions.forEach((pcQuestion) => {
//           const pcId = pcQuestion.pc.id;
//           const nosId = pcQuestion.pc?.nos?.nos_id;
//           const theoryMark = parseFloat(pcQuestion.pc.theory_marks.toString());

//           if (!isNaN(theoryMark)) {
//             const earnedMark = isCorrect ? theoryMark : 0;

//             pcMarks[pcId] = (pcMarks[pcId] || 0) + earnedMark;

//             // NOS-wise total 👇

//             if (nosId) {
//               nosMarks[nosId] = (nosMarks[nosId] || 0) + earnedMark;
//             }
//           }
//         });
//       }
//     });

//     student.student_question_attempts?.forEach((attempt) => {
//       const question = attempt.question;

//       console.log("question type: ", question.question_type, " for student: ", candidateId, "attempt question: ", attempt.question);

//       if (question?.question_type === "practical") {
//         question.pc_questions.forEach((pcQuestion) => {
//           const pc = pcQuestion.pc;
//           const pcId = pc.id;
//           const nosId = pc?.nos?.nos_id;
//           const practicalMark = parseFloat(attempt?.obtained_marks?.toString() ?? "0");

//           if (!isNaN(practicalMark)) {
//             const earnedMark = practicalMark / question.pc_questions.length; // Assuming equal distribution of marks among PCs

//             practicalPcMarks[pcId] = (practicalPcMarks[pcId] || 0) + earnedMark;

//             // NOS-wise total 👇

//             if (nosId) {
//               practicalNosMarks[nosId] = (practicalNosMarks[nosId] || 0) + earnedMark;
//             }
//           }
//         });
//       }

//       if (question?.question_type === "viva") {
//         question.pc_questions.forEach((pcQuestion) => {
//           const pc = pcQuestion.pc;
//           const pcId = pc.id;
//           const nosId = pc?.nos?.nos_id;
//           const vivaMark = parseFloat(attempt?.obtained_marks?.toString() ?? "0");

//           if (!isNaN(vivaMark)) {
//             const earnedMark = vivaMark / question.pc_questions.length; // Assuming equal distribution of marks among PCs

//             vivaPcMarks[pcId] = (vivaPcMarks[pcId] || 0) + earnedMark;

//             // NOS-wise total 👇
//             if (nosId) {
//               vivaNosMarks[nosId] = (vivaNosMarks[nosId] || 0) + earnedMark;
//             }
//           }
//         });
//       }
//     });

//     const theoryTotal = Object.values(pcMarks).reduce((sum, m) => sum + m, 0);

//     const practicalTotal = Object.values(practicalPcMarks).reduce((sum, m) => sum + m, 0);
//     const vivaTotal = Object.values(vivaPcMarks).reduce((sum, m) => sum + m, 0);

//     const gross = theoryTotal + practicalTotal + vivaTotal;
//     const percent = grossMax > 0 ? (gross / grossMax) * 100 : 0;

//     if (percent >= overAllCutOff) {
//       passedStudents.push(studentId);
//     } else {
//       failedStudents.push(studentId);
//     }

//     theoryMarks[studentId] = {
//       pcs: pcMarks,
//       nos: nosMarks
//     };
//     practicalMarks[studentId] = {
//       pcs: practicalPcMarks,
//       nos: practicalNosMarks
//     };
//     vivaMarks[studentId] = {
//       pcs: vivaPcMarks,
//       nos: vivaNosMarks
//     };
//     totalTheoryMarks[studentId] = theoryTotal;
//     grossTotal[studentId] = gross;
//     percentage[studentId] = parseFloat(percent.toFixed(2));
//   });

//   return {
//     theoryMarks,
//     practicalMarks,
//     vivaMarks,
//     totalTheoryMarks,
//     grossTotal,
//     passedStudents,
//     failedStudents,
//     absentStudents,
//     percentage
//   };
// };

// const getPracticalMarksPerStudent = (students: Student[]): Record<string, Record<string, number>> => {
//   const result: Record<string, Record<string, number>> = {};

//   students.forEach((student) => {
//     const name = student.candidate_id;
//     const pcMarks: Record<string, number> = {};

//     student?.student_question_attempts?.forEach((attempt) => {
//       const question = attempt.question;

//       if (question.question_type === "practical") {
//         question.pc.forEach((pc) => {
//           const pcId = pc.pc_id;
//           const practicalMark = parseFloat(attempt?.obtained_marks?.toString() ?? "0");

//           if (!isNaN(practicalMark)) {
//             pcMarks[pcId] = (pcMarks[pcId] || 0) + practicalMark;
//           }
//         });
//       }
//     });

//     result[name] = pcMarks;
//   });

//   return result;
// };

const CandidateWiseResultTable = () => {

  // States

  // const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  // const [editQuestionOpen, setEditQuestionOpen] = useState(false);

  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState<StudentsTypeWithAction[]>([]);

  // const [batchReportData, setBatchReportData] = useState<batches & {agency: users, qualification_pack: QPType, scheme: schemes, sub_scheme: schemes, students: students[], nos: nosWithPcs[]} | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');

  // const [examSetId, setExamSetId] = useState(0);

  const [selectedBatch, setBatch] = useState<number | null>(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  // console.log(data);

  // const handleOnEditClick = async (id: number) => {


  //   setEditQuestionOpen(!editQuestionOpen);

  //   setExamSetId(id);
  // }

  // const handleGenerateReport = () => {
  //   // Get the table element
  //   const table = document.querySelector('table');

  //   // Check if the table exists
  //   if (table) {
  //     // Convert the HTML table to a worksheet
  //     const ws = XLSX.utils.table_to_sheet(table, { sheet: 'Sheet JS 1' });

  //     // Create a new workbook
  //     const wb = XLSX.utils.book_new();

  //     // Append the worksheet to the workbook
  //     XLSX.utils.book_append_sheet(wb, ws, 'Sheet JS 1');

  //     // Write and download the Excel file
  //     XLSX.writeFile(wb, 'result_sheet.xlsx');
  //   } else {
  //     console.error('Table not found!');
  //   }
  // };

  // function transformTheoryExamSet(theory_exam_set: exam_sets & { exam_sets_questions: { questions: { pc: { nos_id: number; nos: { nos_id: string, nos_name: string } }[] } }[] }) {
  //   // Use a map to group pcs by nos_id
  //   const nosMap = new Map();

  //   theory_exam_set.exam_sets_questions.forEach((item) => {
  //     const pcs = item.questions.pc;

  //     pcs.forEach((pcItem) => {
  //       const nosId = pcItem.nos.nos_id;

  //       if (!nosMap.has(nosId)) {
  //         nosMap.set(nosId, {
  //           nos_id: nosId,
  //           nos_name: pcItem.nos.nos_name,
  //           pc: [],
  //         });
  //       }

  //       nosMap.get(nosId).pc.push(pcItem);
  //     });
  //   });

  //   // Convert map values to array
  //   const nosArray = Array.from(nosMap.values());

  //   // Return the new structured object
  //   return {
  //     ...theory_exam_set,
  //     nos: nosArray,
  //   };
  // }


  // const getBatchReport = async () => {

  //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${selectedBatch}/report`).then(function (response) { return response.json() })

  //   // console.log("data:", res);


  //   // Example usage
  //   // const newTheoryExamSet = transformTheoryExamSet(res.theory_exam_set);

  //   // console.log("newTheoryExamSet:",newTheoryExamSet);


  //   if (res) {
  //     setBatchReportData(res);
  //     // setData(res.students);
  //   } else {
  //     setBatchReportData(null);
  //   }

  // }

  const getCandidates = async (batchId: number) => {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students?batchId=${batchId}`);

    if (res.ok) {

      const data = await res.json();

      setData(data);

    } else {

      setData([]);

    }

  }

  useEffect(() => {
    if(selectedBatch) {

      // getBatchReport();
      getCandidates(selectedBatch);

      // setBatchData(res);
    } else {
      // setBatchReportData(null);
      setData([]);
    }
  }, [selectedBatch])

  const handleLogReportOpen = (candidate: string, id: number) => {
    setSelectedCandidate(candidate);
    setSelectedCandidateId(id);
    setLogDetailOpen(!logDetailOpen);
  }

  // const handleGenerateCertificate = async (candidateId: number) => {

  //   const res = await fetch(
  //     `${process.env.NEXT_PUBLIC_API_URL}/certificate/generate`,
  //     {
  //       method: "POST",

  //       headers: {
  //         "Content-Type": "application/json"
  //       },

  //       body: JSON.stringify({
  //         candidateId: candidateId,
  //       })
  //     }
  //   );

  //   const blob = await res.blob();

  //   const url =
  //     window.URL.createObjectURL(blob);

  //   window.open(url);

  // }

  const handleGenerateCertificate = async (
    candidateId: number
  ) => {

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/certificate/generate`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          candidateId
        })
      }
    );

    if (!res.ok) {

      const error =
        await res.json();

      alert(
        error.message ||
        "Failed to generate certificate"
      );

      return;
    }

    const blob =
      await res.blob();

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `certificate-${candidateId}.pdf`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);
  };

  // const studentPcTheoryMarks = getTheoryMarksPerStudent(batchReportData?.students || []);
  // const { theoryMarks, practicalMarks, vivaMarks, absentStudents } = getTheoryMarksPerStudent(batchReportData?.students || [], batchReportData?.qualification_pack || null);

  // Hooks
  const columns = useMemo<ColumnDef<StudentsTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('candidate_id', {
        header: 'Candidate ID',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.candidate_id}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('candidate_name', {
        header: 'Candidate Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.candidate_name}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) =>
          <>
        {/* {row.original.attendance} */}
        { row.original.attendance == 0 ? (
          <Chip
            variant='outlined'
            className='capitalize'
            label='Absent'
            color='error'
            size='small'
          />
        ) : (
          <Chip
            variant='outlined'
            className='capitalize'
            label='Present'
            color='success'
            size='small'
          />
        )}</>
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => {
          const isAbsent = row.original.attendance == 0;
          const isPass = row.original.result === "pass";

          return (
            <div className="flex items-center gap-3">
              {isAbsent ? null : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleLogReportOpen(row.original.candidate_id, row.original.id)}
                >
                  View Report
                </Button>
              )}
              {isPass && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleGenerateCertificate(row.original.id)}
                >
                  Generate Certificate
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false
      }),
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: data as StudentsTypeWithAction[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: TableRowLimit.pageSize
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // const getTheoryMarksPerStudent = (students:any) => {
  //   const result = {};

  //   students.forEach((student: any) => {
  //     const name = student.candidate_id; // You can also use `student.id` or `candidate_name`
  //     const pcMarks = {};

  //     student.exam_set_results?.forEach((result:any) => {
  //       const isCorrect = result.student_answer === result.correct_answer;
  //       const question = result.question;

  //       if (question.question_type === "theory") {
  //         const marks = isCorrect ? question.marks : 0;

  //         question.pc.forEach((pc:any) => {
  //           const pcId = pc.pc_id;
  //           if (!pcMarks[pcId]) pcMarks[pcId] = 0;
  //           pcMarks[pcId] += marks;
  //         });
  //       }
  //     });

  //     result[name] = pcMarks;
  //   });

  //   return result;
  // };


  // const activeExamCount =
  // (batchReportData?.theory_exam_set_id ? 1 : 0) +
  // (batchReportData?.practical_exam_set_id ? 1 : 0) +
  // (batchReportData?.viva_exam_set_id ? 1 : 0);

  // const dynamicNOSColumns = batchReportData?.nos?.reduce((acc, nos) => {
  //   return acc + ((nos?.pcs?.length || 0) * activeExamCount);
  // }, 0) ?? 0;

  // const fixedColumnsBeforeNOS = 3;

  // const fixedColumnsAfterNOS =
  //   (batchReportData?.theory_exam_set_id ? 1 : 0) +
  //   (batchReportData?.practical_exam_set_id ? 1 : 0) +
  //   (batchReportData?.viva_exam_set_id ? 1 : 0) +
  //   1 + // Gross Total
  //   2;

  // const totalColumns = fixedColumnsBeforeNOS + dynamicNOSColumns + fixedColumnsAfterNOS;



  return (
    <>
      <Card>
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters setData={setData} setBatch={setBatch} tableData={[]} />
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='is-[70px]'
            SelectProps={{ MenuProps }}
          >
            {TableRowLimit && TableRowLimit.rowLimit.length > 0 && TableRowLimit.rowLimit.map((limit, index) => (
              <MenuItem key={index} value={limit}>{limit}</MenuItem>
            ))}
          </CustomTextField>
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            {/* <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Question'
              className='is-full sm:is-auto'
            /> */}
            {/* <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='is-full sm:is-auto'
              onClick={handleGenerateReport}
            >
              Export
            </Button> */}
            {/* {pcID &&
            <>
              <Button
                variant='contained'
                startIcon={<i className='tabler-download' />}
                onClick={() => setBulkUploadQuestionsOpen(!bulkUploadQuestionsOpen)}
                className='is-full sm:is-auto'
              >
                Import Questions
              </Button> */}
              {selectedBatch &&
              <>
                <CertificateZipAction key={`cert-${selectedBatch}`} batchId={selectedBatch} />
                <ResultSheetAction key={`result-${selectedBatch}`} batchId={selectedBatch} />
              </>

              }
            {/* </>
            } */}
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        />
      </Card>
      <LogDetailDialog open={logDetailOpen} handleClose={() => {setLogDetailOpen(false); setSelectedCandidate(null); setSelectedCandidateId(null); }} selectedCandidate={selectedCandidate} candidateId={selectedCandidateId} />
    </>
  )
}

export default CandidateWiseResultTable
