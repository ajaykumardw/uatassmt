'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react';

// Next Imports

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

import type { exam_instructions } from '@prisma/client';

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import TableFilters from './TableFilters'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
// import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'


import type { SSCType } from '@/types/sectorskills/sscType'

import AddEditExamInstructionsDrawer from './AddEditExamInstructionsDrawer';


// declare module '@tanstack/table-core' {
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo
//   }
// }

type ExamInstructionTypeWithAction = exam_instructions & {
  ssc: SSCType
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
// const userRoleObj: UserRoleType = {
//   admin: { icon: 'tabler-crown', color: 'error' },
//   author: { icon: 'tabler-device-desktop', color: 'warning' },
//   editor: { icon: 'tabler-edit', color: 'info' },
//   maintainer: { icon: 'tabler-chart-pie', color: 'success' },
//   subscriber: { icon: 'tabler-user', color: 'primary' }
// }

const userShowStatusObj: UserShowStatusType = {

  1: 'Active',

  0: 'Inactive'

}

const userStatusObj: UserStatusType = {
  1: 'success',
  0: 'secondary'
}

// Column Definitions
const columnHelper = createColumnHelper<ExamInstructionTypeWithAction>()

const ExamInstructionsListTable = ({ tableData, updateExamInstructionsList }: { tableData?: exam_instructions[], updateExamInstructionsList: () => void }) => {
  // States
  const [addExamInstructionOpen, setAddExamInstructionOpen] = useState(false);
  const [editExamInstructionOpen, setEditExamInstructionOpen] = useState(false);

  // const [editUserOpen, setEditUserOpen] = useState(false);
  // const [sscId, setSSCId] = useState(0);

  // const [instructionId, setInstructionId] = useState(0);
  const [instructionData, setInstructionData] = useState<exam_instructions | null>(null);
  const [sscData, setSSCData] = useState<SSCType[]>([]);
  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(...[tableData]);
  const [globalFilter, setGlobalFilter] = useState('');

  const getSSCData = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const allSSC = await res.json();

    setSSCData(allSSC);
  }

  useEffect(()=>{
    getSSCData();
  }, []);

  const getInstructionData = async (id: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-instructions/${id}`);

    if (!res.ok) {
      throw new Error('Failed to fetch Instruction Data')
    }

    const instruction = await res.json();

    if(instruction) {
      setInstructionData(instruction);
      setEditExamInstructionOpen(!editExamInstructionOpen);
    }
  }

  // Hooks
  const columns = useMemo<ColumnDef<ExamInstructionTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('ssc.ssc_name', {
        header: 'SSC',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.ssc.ssc_name}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('instruction', {
        header: 'Instruction',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.instruction}
          </Typography>
        )
      }),

      // columnHelper.accessor('ssc_name', {
      //   header: 'Sector Skills Council Name',
      //   cell: ({ row }) => (
      //     <div className='flex items-center gap-2'>
      //       <Typography className='capitalize' color='text.primary'>
      //         {row.original.ssc_name}
      //       </Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('ssc_code', {
      //   header: 'Sector Skills Council Code',
      //   cell: ({ row }) => (
      //     <div className='flex items-center gap-2'>
      //       <Typography className='capitalize' color='text.primary'>
      //         {row.original.ssc_code}
      //       </Typography>
      //     </div>
      //   )
      // }),

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
            {/* <IconButton>
              <i className='tabler-eye text-[22px] text-textSecondary' />
            </IconButton> */}
            <IconButton onClick={() => { getInstructionData(row.original.id) }}>
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
    data: data as exam_instructions[],
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
        pageSize: 25
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

            // className='is-[80px]'

          >
            {/* <MenuItem value='10'>10</MenuItem> */}
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
            <MenuItem value='100'>100</MenuItem>
          </CustomTextField>
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Instruction'
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
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setAddExamInstructionOpen(!addExamInstructionOpen)}
              className='is-full sm:is-auto'
            >
              Add New Instruction
            </Button>
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
      <AddEditExamInstructionsDrawer open={addExamInstructionOpen} updateExamInstructionsList={updateExamInstructionsList} sscData={sscData} handleClose={() => setAddExamInstructionOpen(!addExamInstructionOpen)} />
      <AddEditExamInstructionsDrawer instructionData={instructionData} open={editExamInstructionOpen} updateExamInstructionsList={updateExamInstructionsList} sscData={sscData} handleClose={() => setEditExamInstructionOpen(!editExamInstructionOpen)} />
      {/* <EditUserDrawer sscId={sscId} open={editUserOpen} handleClose={() => setEditUserOpen(!editUserOpen)} updateSSCList={updateExamInstructionsList} sscName={sscName} sscCode={sscCode} username={username} sscStatus={sscStatus} /> */}
    </>
  )
}

export default ExamInstructionsListTable
