'use client'

// React Imports
import { useEffect, useState,

  //  useMemo, Fragment

   } from 'react';

// MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';

// import Typography from '@mui/material/Typography';

import Chip from '@mui/material/Chip';

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

import type { exam_sets } from '@prisma/client';

// Type Imports
// import type { ThemeColor } from '@core/types'

import XLSX from 'xlsx';

// Component Imports
import TableFilters from './TableFilters'

// import TablePaginationComponent from '@components/TablePaginationComponent'
// import CustomTextField from '@core/components/mui/TextField'

// Util Imports
// import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

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

const PCWiseReportTable = () => {

  // States

  // const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  // const [editQuestionOpen, setEditQuestionOpen] = useState(false);

  // const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState<exam_sets[]>([]);

  // const [globalFilter, setGlobalFilter] = useState('');
  // const [examSetId, setExamSetId] = useState(0);

  const [selectedBatch, setBatch] = useState<number | null>(null);

  console.log(data);

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
      const ws = XLSX.utils.table_to_sheet(table, { sheet: 'Sheet JS 1' });

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Append the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet JS 1');

      // Write and download the Excel file
      XLSX.writeFile(wb, 'result_sheet.xlsx');
    } else {
      console.error('Table not found!');
    }
  };

  const getBatchReport = async () => {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${selectedBatch}`).then(function (response) { return response.json() })

    console.log("data:", res);

  }

  useEffect(() => {
    if(selectedBatch) {

      getBatchReport();



      // setBatchData(res);
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
                <th colSpan={19} className='text-center light-gray'>Result Sheet</th>
                <th colSpan={3} className='text-center gold'>Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={3} colSpan={3} className='aliceblue'>Name of Assessing Body :</td>
                <td rowSpan={3} colSpan={4}>Dream Weavers</td>
                <td rowSpan={3} colSpan={4} className='aliceblue'>Name of Training Provider :</td>
                <td rowSpan={3} colSpan={8}>0</td>
                <td className='green'>Result</td>
                <td className='green'>Count</td>
                <td className='green'>%</td>
              </tr>
              <tr>
                <td className='green'>Pass</td>
                <td className='green'>30</td>
                <td className='green'>100</td>
              </tr>
              <tr>
                <td className='green'>Fail</td>
                <td className='green'>0</td>
                <td className='green'>0</td>
              </tr>
              <tr>
                <td colSpan={3} className='aliceblue'>Scheme Name :</td>
                <td colSpan={4}>0</td>
                <td colSpan={4} className='aliceblue'>Batch ID :</td>
                <td colSpan={8}>0</td>
                <td className='green'>Absent</td>
                <td className='green'>0</td>
                <td className='green'>0</td>
              </tr>
              <tr>
                <td colSpan={3} className='aliceblue'>Sub Scheme :</td>
                <td colSpan={4}>0</td>
                <td colSpan={4} className='aliceblue'>Assessment Date :</td>
                <td colSpan={8}>0-Jan-00</td>
                <td className='green'>Drop out</td>
                <td className='green'>0</td>
                <td className='green'>0</td>
              </tr>
              <tr>
                <td colSpan={3} className='aliceblue'>No. of Candidates present :</td>
                <td colSpan={4}>30</td>
                <td colSpan={4} className='aliceblue'>Job role, Level, Version :</td>
                <td colSpan={8}>0-Jan-00</td>
                <td colSpan={3} className='text-center gold'>30</td>
              </tr>
              <tr className='light-gray'>
                <td rowSpan={3}>S No.</td>
                <td rowSpan={3}>Student Unique Id</td>
                <td rowSpan={3}>Name of the<br/> Candidate (fullName)</td>
                <td colSpan={2}>
                  MES/N1801 Identify Hair & make up Requirements
                </td>
                <td colSpan={2}>
                  MES/N1801 Identify Hair & make up Requirements
                </td>
                <td colSpan={2}>
                  MES/N1801 Identify Hair & make up Requirements
                </td>
                <td colSpan={2}>
                  MES/N1801 Identify Hair & make up Requirements
                </td>
                <td colSpan={2}>
                  MES/N1801 Identify Hair & make up Requirements
                </td>
                <td colSpan={2}>
                  MES/N1801 Identify Hair & make up Requirements
                </td>
                <td colSpan={2}>
                  DGT/VSQ/N0102 Employability Skills
                </td>
                <td rowSpan={2}>Total Theory</td>
                <td rowSpan={2}>Total Practical</td>
                <td rowSpan={2}>Gross <br/> Total</td>
                <td colSpan={2}>Result</td>
              </tr>
              <tr className='light-gray'>
                <td>Theory</td>
                <td>Practical</td>
                <td>Theory</td>
                <td>Practical</td>
                <td>Theory</td>
                <td>Practical</td>
                <td>Theory</td>
                <td>Practical</td>
                <td>Theory</td>
                <td>Practical</td>
                <td>Theory</td>
                <td>Practical</td>
                <td>Theory</td>
                <td>Practical</td>
                <td>%</td>
                <td>Final</td>
              </tr>
              <tr className='light-gray'>
                <td>40</td>
                <td>60</td>
                <td>40</td>
                <td>60</td>
                <td>40</td>
                <td>60</td>
                <td>40</td>
                <td>60</td>
                <td>40</td>
                <td>60</td>
                <td>50</td>
                <td>50</td>
                <td>20</td>
                <td>30</td>
                <td>270</td>
                <td>380</td>
                <td>650</td>
                <td>650</td>
                <td></td>
              </tr>
              <tr>
                <td>1</td>
                <td>0</td>
                <td>0</td>
                <td>28</td>
                <td>49</td>
                <td>32</td>
                <td>45</td>
                <td>28</td>
                <td>47</td>
                <td>32</td>
                <td>46</td>
                <td>31</td>
                <td>47</td>
                <td>36</td>
                <td>41</td>
                <td>17</td>
                <td>23</td>
                <td>204</td>
                <td>298</td>
                <td>502</td>
                <td>77.23</td>
                <td><Chip color='success' variant='tonal' label="Pass" /></td>
              </tr>
            </tbody>
          </table>
          {/* <table className={tableStyles.table}>
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
          </table> */}
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

export default PCWiseReportTable
