'use client'

import React from 'react';

// React Imports
import { useEffect, useState,

  //  useMemo, Fragment

   } from 'react';

// MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';

// import Typography from '@mui/material/Typography';

// import Chip from '@mui/material/Chip';

// import IconButton from '@mui/material/IconButton';
// import TablePagination from '@mui/material/TablePagination';

// import type { TextFieldProps } from '@mui/material/TextField';

// import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
// import classnames from 'classnames'
// import { rankItem } from '@tanstack/match-sorter-utils'
// import {
//   createColumnHelper,
//   // flexRender,
//   // getCoreRowModel,
//   // useReactTable,
//   // getFilteredRowModel,
//   // getFacetedRowModel,
//   // getFacetedUniqueValues,
//   // getFacetedMinMaxValues,
//   // getPaginationRowModel,
//   // getSortedRowModel
// } from '@tanstack/react-table'

// import type { ColumnDef, FilterFn } from '@tanstack/react-table'

// import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { batches, exam_sets, nos, pc, schemes, students, users } from '@prisma/client';

// Type Imports
// import type { ThemeColor } from '@core/types'

import XLSX from 'xlsx';

import { format } from 'date-fns';

// Component Imports
import TableFilters from './TableFilters'

// import TablePaginationComponent from '@components/TablePaginationComponent'
// import CustomTextField from '@core/components/mui/TextField'

// Util Imports
// import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import type { QPType } from '@/types/qualification-pack/qpType';
import { agencyImagePath } from '@/configs/customDataConfig';

// import AddEditExamSetsDialog from '@/components/exam-sets/dialogs/AddEditExamSetsDialog';

// import CustomAvatar from '@/@core/components/mui/Avatar';
// import { ExamDurations, MenuProps, TableRowLimit } from '@/configs/customDataConfig';

// declare module '@tanstack/table-core' {
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo
//   }
// }

// type ExamSetsTypeWithAction = exam_sets & {
//   action?: string
//   serialNumber?: number
// }

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

// const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
//   // Rank the item
//   const itemRank = rankItem(row.getValue(columnId), value)

//   // Store the itemRank info
//   addMeta({
//     itemRank
//   })

//   // Return if the item should be filtered in/out
//   return itemRank.passed
// }

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
// const columnHelper = createColumnHelper<ExamSetsTypeWithAction>()

type nosWithPcs = nos & {
  pcs: pc[];
};

// sdfsd
// type PC = {
//   pc_id: string;
// };

type Question = {
  question_type: string;
  marks: number;
  pc_questions: {
    pc: pc & {
      nos: nos;
    };
  }[];
};

type ExamSetResult = {
  student_answer: number;
  correct_answer: number;
  question: Question;
};

type Student = {
  candidate_id: string;
  exam_set_results?: ExamSetResult[];
};

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


interface TheoryMarksResult {
  [candidateId: string]: { pcs: Record<string, number>; nos: Record<string, number> };
}

interface FinalResult {
  theoryMarks: TheoryMarksResult;
  totalTheoryMarks: Record<string, number>;
  absentStudents: string[];
  passedStudents: string[];
  failedStudents: string[];
  grossTotal: Record<string, number>;
  percentage: Record<string, number>;
}

const getTheoryMarksPerStudent = (students: Student[], qp: QPType | null): FinalResult => {
  const theoryMarks: TheoryMarksResult = {};
  const totalTheoryMarks: Record<string, number> = {};
  const absentStudents: string[] = [];
  const passedStudents: string[] = [];
  const failedStudents: string[] = [];
  const grossTotal: Record<string, number> = {};
  const percentage: Record<string, number> = {};

  students.forEach((student) => {
    const studentId = student.candidate_id;

    if (!student.exam_set_results || student.exam_set_results.length === 0) {
      absentStudents.push(studentId);

      return;
    }

    const pcMarks: Record<string, number> = {};
    const nosMarks: Record<string, number> = {};
    const grossMax = qp?.total_marks ?? 0;
    const overAllCutOff = qp?.overall_cutoff_marks ?? 0;

    student.exam_set_results.forEach((res) => {
      const isCorrect = res.student_answer === res.correct_answer;
      const question = res.question;

      if (question.question_type === "theory") {
          question.pc_questions.forEach((pcQuestion) => {
            const pcId = pcQuestion.pc.pc_id;
            const nosId = pcQuestion.pc?.nos?.nos_id;
            const theoryMark = parseFloat(pcQuestion.pc.theory_marks.toString());

            if (!isNaN(theoryMark)) {
              const earnedMark = isCorrect ? theoryMark : 0;

              pcMarks[pcId] = (pcMarks[pcId] || 0) + earnedMark;

              if (nosId) {
                nosMarks[nosId] = (nosMarks[nosId] || 0) + earnedMark;
              }
            }
          });

        // question.pc_questions.forEach((pc: pc & { nos: nos }) => {
        //   const pcId = pc.pc_id;
        //   const nosId = pc?.nos?.nos_id;
        //   const theoryMark = parseFloat(pc.theory_marks.toString());

        //   if (!isNaN(theoryMark)) {
        //     const earnedMark = isCorrect ? theoryMark : 0;

        //     pcMarks[pcId] = (pcMarks[pcId] || 0) + earnedMark;

        //     // NOS-wise total 👇

        //     if (nosId) {
        //       nosMarks[nosId] = (nosMarks[nosId] || 0) + earnedMark;
        //     }
        //   }

        // });
      }
    });

    const theoryTotal = Object.values(pcMarks).reduce((sum, m) => sum + m, 0);

    const practicalTotal = 0;
    const vivaTotal = 0;

    const gross = theoryTotal + practicalTotal + vivaTotal;
    const percent = grossMax > 0 ? (gross / grossMax) * 100 : 0;

    if (percent >= overAllCutOff) {
      passedStudents.push(studentId);
    } else {
      failedStudents.push(studentId);
    }

    theoryMarks[studentId] = {
      pcs: pcMarks,
      nos: nosMarks
    };
    totalTheoryMarks[studentId] = theoryTotal;
    grossTotal[studentId] = gross;
    percentage[studentId] = parseFloat(percent.toFixed(2));
  });

  return {
    theoryMarks,
    totalTheoryMarks,
    grossTotal,
    passedStudents,
    failedStudents,
    absentStudents,
    percentage
  };
};

const NOSWiseReportTable = () => {

  // States

  // const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  // const [editQuestionOpen, setEditQuestionOpen] = useState(false);

  // const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState<exam_sets[]>([]);
  const [batchReportData, setBatchReportData] = useState<batches & {agency: users, training_partner: users, qualification_pack: QPType, scheme: schemes, sub_scheme: schemes, students: students[], nos: nosWithPcs[]} | null>(null);

  // const [globalFilter, setGlobalFilter] = useState('');
  // const [examSetId, setExamSetId] = useState(0);

  const [selectedBatch, setBatch] = useState<number | null>(null);

  // console.log(data);

  // const handleOnEditClick = async (id: number) => {


  //   setEditQuestionOpen(!editQuestionOpen);

  //   setExamSetId(id);
  // }

  const handleGenerateReport = () => {
    // Get the table element
    const table = document.querySelector('table');

    // Check if the table exists
    if (table) {
      // Convert the HTML table to a worksheet
      const ws = XLSX.utils.table_to_sheet(table, { sheet: 'NOS Wise Result' });

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Append the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'NOS Wise Result');

      // Write and download the Excel file
      XLSX.writeFile(wb, `NOS Wise Result Sheet ${batchReportData?.qualification_pack?.qualification_pack_name} (${batchReportData?.qualification_pack?.qualification_pack_id}) v${batchReportData?.qualification_pack?.version?.version_number} .xlsx`);
    } else {
      console.error('Table not found!');
    }
  };

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


  const getBatchReport = async () => {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${selectedBatch}/report`).then(function (response) { return response.json() })

    // console.log("data:", res);


    // Example usage
    // const newTheoryExamSet = transformTheoryExamSet(res.theory_exam_set);

    // console.log("newTheoryExamSet:",newTheoryExamSet);


    if (res) {
      setBatchReportData(res);
    } else {
      setBatchReportData(null);
    }

  }

  useEffect(() => {
    if(selectedBatch) {

      getBatchReport();



      // setBatchData(res);
    } else {
      setBatchReportData(null);
    }
  }, [selectedBatch])


  // Hooks
  // const columns = useMemo<ColumnDef<ExamSetsTypeWithAction, any>[]>(
  //   () => [
  //     {
  //       id: 'serialNumber', // Serial number column
  //       header: 'S.No.',
  //       cell: ({ row }) => <Typography>{row.index + 1}</Typography>
  //     },

  //     // columnHelper.accessor('id', {
  //     //   header: 'ID',
  //     //   cell: ({ row }) => (
  //     //     <div className='flex items-center gap-4'>
  //     //       <div className='flex flex-col'>
  //     //         <Typography color='text.primary' className='font-medium'>
  //     //           {row.original.id}
  //     //         </Typography>
  //     //       </div>
  //     //     </div>
  //     //   )
  //     // }),

  //     columnHelper.accessor('set_name', {
  //       header: 'Set Name',
  //       cell: ({ row }) => (
  //         <div className='flex items-center gap-4'>
  //           <div className='flex flex-col'>
  //             <Typography color='text.primary' className='font-medium'>
  //               {row.original.set_name}
  //             </Typography>
  //           </div>
  //         </div>
  //       )
  //     }),
  //     columnHelper.accessor('mode', {
  //       header: 'Mode',
  //       cell: ({ row }) => (
  //         <div className='flex items-center gap-2'>
  //           <Typography className='capitalize' color='text.primary'>
  //             {row.original.mode}
  //           </Typography>
  //         </div>
  //       )
  //     }),
  //     columnHelper.accessor('question_random', {
  //       header: 'Question Random',
  //       cell: ({ row }) => (
  //         <div className='flex items-center gap-3'>
  //           {/* <Chip
  //             variant='tonal'
  //             className='capitalize'
  //             label='Question Random'
  //             color='success'
  //             size='small'
  //           /> */}
  //           <CustomAvatar skin='light' color={row.original.question_random === 1 ? 'success' : 'error'} size={28}>
  //             <i className={classnames('bs-4 is-4', row.original.question_random == 1 ? 'tabler-check' : 'tabler-x')} />
  //           </CustomAvatar>
  //         </div>
  //       )
  //     }),
  //     columnHelper.accessor('option_random', {
  //       header: 'Option Random',
  //       cell: ({ row }) => (
  //         <div className='flex items-center gap-3'>
  //           {/* <Chip
  //             variant='tonal'
  //             className='capitalize'
  //             label='Option Random'
  //             color='success'
  //             size='small'
  //           /> */}
  //           <CustomAvatar skin='light' color={row.original.option_random === 1 ? 'success' : 'error'} size={28}>
  //             <i className={classnames('bs-4 is-4', row.original.option_random === 1 ? 'tabler-check' : 'tabler-x')} />
  //           </CustomAvatar>
  //         </div>
  //       )
  //     }),
  //     columnHelper.accessor('total_questions', {
  //       header: 'Total Questions',
  //       cell: ({ row }) => (
  //         <div className='flex items-center gap-3'>
  //           <Chip
  //             variant='tonal'
  //             className='capitalize'
  //             label={row.original.total_questions}
  //             color='success'
  //             size='small'
  //           />
  //         </div>
  //       )
  //     }),
  //     columnHelper.accessor('exam_duration', {
  //       header: 'Exam Duration',
  //       cell: ({ row }) => (
  //         <div className='flex items-center gap-3'>
  //           <Chip
  //             variant='tonal'
  //             className='capitalize'
  //             label={ExamDurations[row.original.exam_duration]}
  //             color='success'
  //             size='small'
  //           />
  //         </div>
  //       )
  //     }),
  //     columnHelper.accessor('question_levels', {
  //       header: 'Question Levels',
  //       cell: ({ row }) => (
  //         <div className='flex items-center gap-2'>
  //           {row.original.question_levels && <>
  //           <Chip
  //             variant='tonal'
  //             className='capitalize'
  //             label={`Easy: ${(row.original.question_levels as QuestionLevels).E || 0}`}
  //             color='success'
  //             size='small'
  //           />
  //           <Chip
  //             variant='tonal'
  //             className='capitalize'
  //             label={`Medium: ${(row.original.question_levels as QuestionLevels).M || 0}`}
  //             color='warning'
  //             size='small'
  //           />
  //           <Chip
  //             variant='tonal'
  //             className='capitalize'
  //             label={`Hard: ${(row.original.question_levels as QuestionLevels).H || 0}`}
  //             color='error'
  //             size='small'
  //           /> </>}
  //         </div>
  //       )
  //     }),
  //     columnHelper.accessor('action', {
  //       header: 'Action',
  //       cell: ({ row }) => (
  //         <div className='flex items-center'>
  //           <IconButton onClick={() => handleOnEditClick(row.original.id)}>
  //             <i className='tabler-edit text-[22px] text-textSecondary' />
  //           </IconButton>
  //         </div>
  //       ),
  //       enableSorting: false
  //     })
  //   ],

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   []
  // )

  // const table = useReactTable({
  //   data: data as exam_sets[],
  //   columns,
  //   filterFns: {
  //     fuzzy: fuzzyFilter
  //   },
  //   state: {
  //     rowSelection,
  //     globalFilter
  //   },
  //   initialState: {
  //     pagination: {
  //       pageSize: TableRowLimit.pageSize
  //     }
  //   },
  //   enableRowSelection: true, //enable row selection for all rows
  //   // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
  //   globalFilterFn: fuzzyFilter,
  //   onRowSelectionChange: setRowSelection,
  //   getCoreRowModel: getCoreRowModel(),
  //   onGlobalFilterChange: setGlobalFilter,
  //   getFilteredRowModel: getFilteredRowModel(),
  //   getSortedRowModel: getSortedRowModel(),
  //   getPaginationRowModel: getPaginationRowModel(),
  //   getFacetedRowModel: getFacetedRowModel(),
  //   getFacetedUniqueValues: getFacetedUniqueValues(),
  //   getFacetedMinMaxValues: getFacetedMinMaxValues()
  // })

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

  // const studentPcTheoryMarks = getTheoryMarksPerStudent(batchReportData?.students || []);
  const { theoryMarks, totalTheoryMarks, grossTotal, absentStudents, passedStudents, failedStudents } = getTheoryMarksPerStudent(batchReportData?.students || [], batchReportData?.qualification_pack || null);

  const activeExamCount =
  (batchReportData?.theory_exam_set_id ? 1 : 0) +
  (batchReportData?.practical_exam_set_id ? 1 : 0) +
  (batchReportData?.viva_exam_set_id ? 1 : 0);

  console.log("theoryMarks:", theoryMarks);

  // const dynamicNOSColumns = batchReportData?.nos?.reduce((acc, nos) => {
  //   return acc + ((nos?.pcs?.length || 0) * activeExamCount);
  // }, 0) ?? 0;
  const dynamicNOSColumns = (batchReportData?.nos?.length || 0) * activeExamCount;

  const fixedColumnsBeforeNOS = 3;

  const fixedColumnsAfterNOS =
    (batchReportData?.theory_exam_set_id ? 1 : 0) +
    (batchReportData?.practical_exam_set_id ? 1 : 0) +
    (batchReportData?.viva_exam_set_id ? 1 : 0) +
    1 + // Gross Total
    2;

  const totalColumns = fixedColumnsBeforeNOS + dynamicNOSColumns + fixedColumnsAfterNOS;



  return (
    <>
      <Card>
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters setData={setData} setBatch={setBatch} tableData={[]} />
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          {/* <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='is-[70px]'
            SelectProps={{ MenuProps }}
          >
            {TableRowLimit && TableRowLimit.rowLimit.length > 0 && TableRowLimit.rowLimit.map((limit, index) => (
              <MenuItem key={index} value={limit}>{limit}</MenuItem>
            ))}
          </CustomTextField> */}
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            {/* <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Question'
              className='is-full sm:is-auto'
            /> */}
            <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='is-full sm:is-auto'
              onClick={handleGenerateReport}
            >
              Export
            </Button>
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
            {/* <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setAddQuestionOpen(!addQuestionOpen)}
              className='is-full sm:is-auto'
            >
              Add New Exam Set
            </Button> */}
            {/* </>
            } */}
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className={`${tableStyles.table} text-center report-table`}>
            <thead>
              <tr>
                <th colSpan={totalColumns - 3} className='text-center light-gray'>Result Sheet</th>
                <th colSpan={3} className='text-center gold'>Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={3} colSpan={3} className='aliceblue'>Name of Assessing Body :</td>
                <td rowSpan={3} colSpan={Math.floor((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData?.agency?.company_name || '0'} {batchReportData?.agency?.avatar && <img src={agencyImagePath(batchReportData?.agency.id, batchReportData?.agency?.avatar)} alt='Agency Avatar' className='w-14 h-14 object-contain' />}</td>
                <td rowSpan={3} colSpan={4} className='aliceblue'>Name of Training Provider :</td>
                <td rowSpan={3} colSpan={Math.round((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData?.training_partner?.company_name || '0'}</td>
                <td className='green'>Result</td>
                <td className='green'>Count</td>
                <td className='green'>%</td>
              </tr>
              <tr>
                <td className='green'>Pass</td>
                <td className='green'>{passedStudents.length ?? 0}</td>
                <td className='green'>{((passedStudents.length ?? 0) / (batchReportData?.students?.length ?? 0) * 100).toFixed(2) }</td>
              </tr>
              <tr>
                <td className='green'>Fail</td>
                <td className='green'>{failedStudents.length ?? 0}</td>
                <td className='green'>{((failedStudents.length ?? 0) / (batchReportData?.students?.length ?? 0) * 100).toFixed(2) }</td>
              </tr>
              <tr>
                <td colSpan={3} className='aliceblue'>Scheme Name :</td>
                <td colSpan={Math.floor((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData?.scheme ? batchReportData.scheme.scheme_name : '0'}</td>
                <td colSpan={4} className='aliceblue'>Batch Name :</td>
                <td colSpan={Math.round((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData ? batchReportData.batch_name : '0'}</td>
                <td className='green'>Absent</td>
                <td className='green'>{absentStudents.length ?? 0}</td>
                <td className='green'>{((absentStudents.length ?? 0) / (batchReportData?.students?.length ?? 0) * 100).toFixed(2) }</td>
              </tr>
              <tr>
                <td colSpan={3} className='aliceblue'>Sub Scheme :</td>
                <td colSpan={Math.floor((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData?.sub_scheme ? batchReportData.sub_scheme.scheme_name : '0'}</td>
                <td colSpan={4} className='aliceblue'>Assessment Date :</td>
                <td colSpan={Math.round((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData?.assessment_start_datetime ? format(batchReportData.assessment_start_datetime, 'd-MMM-y') : '0'}</td>
                <td className='green'>Drop out</td>
                <td className='green'>0</td>
                <td className='green'>0</td>
              </tr>
              <tr>
                <td colSpan={3} className='aliceblue'>No. of Candidates present :</td>
                <td colSpan={Math.floor((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData?.students?.length ?? 0}</td>
                <td colSpan={4} className='aliceblue'>Job role, Level, Version :</td>
                <td colSpan={Math.round((totalColumns - 3 - 4 - 3) / 2)}>{batchReportData && batchReportData.qualification_pack ? batchReportData.qualification_pack.qualification_pack_name + ', ' + batchReportData.qualification_pack.nsqf_level + ', ' + batchReportData.qualification_pack.version.version_number : '0'}</td>
                <td colSpan={3} className='text-center gold'>{batchReportData?.students?.length ?? 0}</td>
              </tr>
              <tr className='light-gray'>
                <td rowSpan={3}>S No.</td>
                <td rowSpan={3}>Student Unique Id</td>
                <td className='text-wrap' rowSpan={3}>Name of the Candidate (Full Name)</td>
                {batchReportData?.nos && batchReportData?.nos?.length > 0 ?
                  batchReportData?.nos?.map((n, index) => (
                  <td key={index} className='text-wrap' colSpan={ ((batchReportData?.theory_exam_set_id != null ? 1 : 0) + (batchReportData?.practical_exam_set_id != null ? 1 : 0) + (batchReportData?.viva_exam_set_id != null ? 1 : 0) )}>
                    {n?.nos_id}
                  </td>
                  ))
                 : null}
                {batchReportData?.theory_exam_set_id &&
                  <td rowSpan={2}>Total Theory</td>
                }
                {batchReportData?.practical_exam_set_id &&
                  <td rowSpan={2}>Total Practical</td>
                }
                {batchReportData?.viva_exam_set_id &&
                  <td rowSpan={2}>Total Viva</td>
                }
                <td rowSpan={2}>Gross <br/> Total</td>
                <td colSpan={2}>Result</td>
              </tr>
              {/* <tr className='light-gray'>
                {batchReportData?.nos && batchReportData.nos.length > 0 ? (
                  batchReportData.nos.map((n, index) =>
                    n?.pcs && n.pcs.length > 0 ? (
                      n.pcs.map((p, idx) => (
                        <td key={`${index}-${idx}`} colSpan={((batchReportData?.theory_exam_set_id != null ? 1 : 0) + (batchReportData?.practical_exam_set_id != null ? 1 : 0) + (batchReportData?.viva_exam_set_id != null ? 1 : 0) )}>{p?.pc_id}</td>
                      ))
                    ) : null
                  )
                ) : null} */}
              {/* </tr> */}
              <tr className='light-gray'>
                {batchReportData?.nos && batchReportData?.nos?.length > 0 ?
                  batchReportData?.nos?.map((n, idx) => (

                    // n?.pcs && n.pcs.length > 0 ? (
                    //   n.pcs.map((p, idx) => (

                        <React.Fragment key={idx}>
                          {batchReportData?.theory_exam_set_id &&
                            <td>Theory</td>
                          }
                          {batchReportData?.practical_exam_set_id &&
                            <td>Practical</td>
                          }
                          {batchReportData?.viva_exam_set_id &&
                            <td>Viva</td>
                          }
                        </React.Fragment>

                    //   ))
                    // ) : null

                  ))
                 : null}

                <td>%</td>
                <td>Final</td>
              </tr>
              <tr className='light-gray'>
                {/* {batchReportData?.nos && batchReportData?.nos?.length > 0 ?
                  batchReportData?.nos?.map((n, index) => (
                    n?.pcs && n.pcs.length > 0 ? (
                      n.pcs.map((p, idx) => (
                        <React.Fragment key={`${index} - ${idx}`}>
                          {batchReportData?.theory_exam_set_id &&
                            <td>{p.theory_marks.toString()}</td>
                          }
                          {batchReportData?.practical_exam_set_id &&
                            <td>{p.practical_marks.toString()}</td>
                          }
                          {batchReportData?.viva_exam_set_id &&
                            <td>{p.viva_marks.toString()}</td>
                          }
                        </React.Fragment>
                      ))
                    ) : null
                  ))
                 : null} */}
                {batchReportData?.nos && batchReportData?.nos?.length > 0
                ? batchReportData?.nos?.map((n, index) => {
                    const totalTheory = n?.pcs?.reduce(
                      (sum, p) => sum + (parseFloat(p.theory_marks.toString()) || 0),
                      0
                    );

                    const totalPractical = n?.pcs?.reduce(
                      (sum, p) => sum + (parseFloat(p.practical_marks.toString()) || 0),
                      0
                    );

                    const totalViva = n?.pcs?.reduce(
                      (sum, p) => sum + (parseFloat(p.viva_marks.toString()) || 0),
                      0
                    );

                    return (
                      <React.Fragment key={index}>
                        {batchReportData?.theory_exam_set_id && (
                          <td>{totalTheory}</td>
                        )}
                        {batchReportData?.practical_exam_set_id && (
                          <td>{totalPractical}</td>
                        )}
                        {batchReportData?.viva_exam_set_id && (
                          <td>{totalViva}</td>
                        )}
                      </React.Fragment>
                    );
                  })
                : null}

                {batchReportData?.theory_exam_set_id &&
                  <td>{batchReportData?.qualification_pack?.total_theory_marks}</td>
                }
                {batchReportData?.practical_exam_set_id &&
                  <td>{batchReportData?.qualification_pack?.total_practical_marks}</td>
                }
                {batchReportData?.viva_exam_set_id &&
                  <td>{batchReportData?.qualification_pack?.total_viva_marks}</td>
                }
                <td>{batchReportData?.qualification_pack?.total_marks}</td>
                <td>{batchReportData?.qualification_pack?.total_marks}</td>
                <td></td>
              </tr>
              { batchReportData && batchReportData.students && batchReportData.students.length > 0 ? batchReportData.students.map((student, index) => {
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{student.candidate_id}</td>
                    <td>{student.candidate_name}</td>
                    {batchReportData.nos.map((nos) =>

                      // nos.pcs.map((pc) => (
                      //   <React.Fragment key={`${student.candidate_id}-${pc.pc_id}`}>
                      //     {batchReportData.theory_exam_set_id && (
                      //       <td>{theoryMarks[student.candidate_id]?.pcs?.[pc.pc_id] ?? 0}</td>
                      //     )}
                      //     {batchReportData.practical_exam_set_id && (
                      //       <td>--</td> // Replace with practical logic if needed
                      //     )}
                      //     {batchReportData.viva_exam_set_id && (
                      //       <td>--</td> // Replace with viva logic if needed
                      //     )}
                      //   </React.Fragment>
                      // ))

                      <React.Fragment key={`${student.candidate_id}-${nos.nos_id}`}>
                        {batchReportData.theory_exam_set_id && (
                          <td>{theoryMarks[student.candidate_id]?.nos?.[nos.nos_id] ?? 0}</td>
                        )}
                        {batchReportData.practical_exam_set_id && (
                          <td>--</td> // Replace with practical logic if needed
                        )}
                        {batchReportData.viva_exam_set_id && (
                          <td>--</td> // Replace with viva logic if needed
                        )}
                      </React.Fragment>
                    )}
                    <td className='light-gray'>{totalTheoryMarks[student.candidate_id] ?? 0}</td>
                    {batchReportData?.practical_exam_set_id && <td className='light-gray'>0</td>}
                    {batchReportData?.viva_exam_set_id && <td className='light-gray'>0</td>}
                    <td className='light-gray'>{grossTotal[student.candidate_id] ?? 0}</td>
                    <td>
                      {
                        batchReportData?.qualification_pack?.total_marks
                          ? (
                              ((grossTotal[student.candidate_id] ?? 0) / batchReportData.qualification_pack.total_marks) * 100
                            ).toFixed(2)
                          : "0.00"
                      }
                    </td>
                    <td className={
                      absentStudents.includes(student.candidate_id)
                            ? 'absent'             // or 'warning' if you want it highlighted
                            : ( ( (grossTotal[student.candidate_id] ?? 0) / batchReportData.qualification_pack.total_marks ) * 100 ) >= (batchReportData?.qualification_pack?.overall_cutoff_marks ?? 0)
                              ? 'pass'
                              : 'fail'
                    }>
                      {
                        absentStudents.includes(student.candidate_id)
                          ? 'Absent'
                          : ( ( (grossTotal[student.candidate_id] ?? 0) / batchReportData.qualification_pack.total_marks ) * 100 ) >= (batchReportData?.qualification_pack?.overall_cutoff_marks ?? 0)
                            ? 'Pass'
                            : 'Fail'
                      }
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={100}>No Records Found!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        /> */}
      </Card>
      {/* <AddEditExamSetsDialog open={addQuestionOpen} updateExamSetsList={updateExamSetsList} handleClose={() => setAddQuestionOpen(!addQuestionOpen)} />
      <AddEditExamSetsDialog open={editQuestionOpen} examSetId={examSetId} updateExamSetsList={updateExamSetsList} handleClose={() => setEditQuestionOpen(!editQuestionOpen)} /> */}
    </>
  )
}

export default NOSWiseReportTable
