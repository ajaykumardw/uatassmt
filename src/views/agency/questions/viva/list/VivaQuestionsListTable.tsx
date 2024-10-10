'use client'

// React Imports
import { useEffect, useState, useMemo, Fragment } from 'react';

// MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TablePagination from '@mui/material/TablePagination';

import type { TextFieldProps } from '@mui/material/TextField';

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

import type { questions } from '@prisma/client';

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import TableFilters from './TableFilters'

import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
// import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import AddEditVivaQuestionsDialog from '@/components/questions/dialogs/AddEditVivaQuestionsDialog';

import type { QuestionsType } from '@/types/questions/questionsType';

// declare module '@tanstack/table-core' {
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo
//   }
// }

type QuestionsTypeWithAction = QuestionsType & {
  action?: string
  serialNumber?: number
}

// type UserRoleType = {
//   [key: string]: { icon: string; color: string }
// }

type UserShowStatusType = {
  [key: string]: string
}

type UserStatusType = {
  [key: string]: ThemeColor
}

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

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Vars

const userShowStatusObj: UserShowStatusType = {

  1: 'Active',

  0: 'Inactive'

}

const userStatusObj: UserStatusType = {
  1: 'success',
  0: 'secondary'
}

// Column Definitions
const columnHelper = createColumnHelper<QuestionsTypeWithAction>()

const VivaQuestionsListTable = ({ tableData, updateQuestionsList }: { tableData?: questions[], updateQuestionsList: () => void }) => {

  // States

  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);

  // const [editQuestionData, setEditQuestionData] = useState({
  //   selectPC: [],
  //   questionType: '',
  //   questionLevel: '',
  //   questionName: '',
  //   questionMarks: '',
  //   questionExplanation: '',
  //   correctAnswer: '',
  //   option1: '',
  //   option2: '',
  //   option: ['','','']
  // });

  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState<QuestionsType[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [questionId, setQuestionId] = useState(0);

  const handleOnEditClick = async (id: number) => {


    setEditQuestionOpen(!editQuestionOpen);

    setQuestionId(id);
  }

  // Hooks
  const columns = useMemo<ColumnDef<QuestionsTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.id}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('question', {
        header: 'Question',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.question}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('marks', {
        header: 'Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              className='capitalize'
              label={userShowStatusObj[row.original.status]}
              color={userStatusObj[row.original.status]}
              size='small'
            />
          </div>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton onClick={() => handleOnEditClick(row.original.id) }>
              <i className='tabler-edit text-[22px] text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: data as QuestionsType[],
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
        pageSize: 10
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

  return (
    <>
      <Card>
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters setData={setData} tableData={tableData} />
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Question'
              className='is-full sm:is-auto'
            />
            <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='is-full sm:is-auto'
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
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => setAddQuestionOpen(!addQuestionOpen)}
                className='is-full sm:is-auto'
              >
                Add New Question
              </Button>
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
      <AddEditVivaQuestionsDialog open={addQuestionOpen} updateQuestionsList={updateQuestionsList} handleClose={() => setAddQuestionOpen(!addQuestionOpen)} />
      <AddEditVivaQuestionsDialog open={editQuestionOpen} questionId={questionId} updateQuestionsList={updateQuestionsList} handleClose={() => setEditQuestionOpen(!editQuestionOpen)} />
    </>
  )
}

export default VivaQuestionsListTable
