'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
// import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

// import { styled } from '@mui/material/styles'

import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
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

// Type Imports
import type { batches, exam_sets, schemes, students, users } from '@prisma/client'

import { toast } from 'react-toastify'

import { format } from 'date-fns'

import { Chip } from '@mui/material'

// import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports

// import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import { formatDate } from '@/utils/formateDate'

import type { QPType } from '@/types/qualification-pack/qpType'

import { MenuProps, TableRowLimit } from '@/configs/customDataConfig'

import type { UsersType } from '@/types/users/usersType'

// import { authFetch } from '@/components/AuthFetch'

import KitOptionMenu from './KitOptionMenu'

type BatchesTypeWithAction = batches & {
  action?: string
  qualification_pack: QPType
  training_partner: users
  training_center: users
  scheme: schemes
  sub_scheme: schemes
  students?: students[]
  assessor: UsersType
  theory_exam_set: exam_sets
  practical_exam_set: exam_sets
  viva_exam_set: exam_sets

  // role: role
}

type BatchesWithQP = batches & { qualification_pack: QPType }

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

// Column Definitions
const columnHelper = createColumnHelper<BatchesTypeWithAction>()

const BatchesListTable = ({ tableData }: { tableData?: BatchesWithQP[] }) => {

  // States
  // const [addUserOpen, setAddUserOpen] = useState(false)

  // const router = useRouter();

  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(...[tableData])
  const [globalFilter, setGlobalFilter] = useState('')

  // const [loadingIds, setLoadingIds] = useState<number[]>([]);
  // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  // const [selectedRowId, setSelectedRowId] = useState<number | null>(null)

  // const handleClick = (
  //   event: MouseEvent<HTMLButtonElement>,
  //   rowId: number
  // ) => {
  //   setAnchorEl(event.currentTarget)
  //   setSelectedRowId(rowId)
  // }

  // const handleClose = () => {
  //   setAnchorEl(null)
  //   setSelectedRowId(null)
  // }

  // Hooks
  // const { lang: locale } = useParams()

  useEffect(() => {

    // Check for a notification message from localStorage or other storage
    const message = localStorage.getItem('formSubmitMessage');

    if (message) {
      toast.success(message,{
        hideProgressBar: false
      });
      localStorage.removeItem('formSubmitMessage');
    }
  }, []);

  // const handleDownloadAssessmentKit = async (batchId: number) => {

  //   setLoadingIds(prev => [...prev, batchId]);

  //   try {
  //     await new Promise(resolve => setTimeout(resolve, 3000));

  //     const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor/batches/${batchId}/assessment-kit`, {
  //       method: 'GET',
  //     });

  //     if(res.ok) {
  //       const blob = await res.blob();

  //       const url = window.URL.createObjectURL(blob);
  //       const link = document.createElement('a');

  //       link.href = url;
  //       const name = res.headers.get('Content-Disposition')?.split('filename=')[1] || `assessment_kit_batch_${batchId}.zip`;

  //       link.setAttribute('download', name); //or any other extension
  //       document.body.appendChild(link);
  //       link.click();
  //       link.parentNode?.removeChild(link);
  //     } else {

  //       const errorData = await res.json();

  //       toast.error(errorData.message || "Failed to download assessment kit");

  //       console.error("Error downloading assessment kit:", errorData);
  //     }


  //   } catch (error) {

  //     console.error("Error downloading assessment kit:", error);

  //     toast.error("Failed to download assessment kit");

  //   } finally {

  //     setLoadingIds(prev => prev.filter(id => id !== batchId));
  //   }

  // }

  const columns = useMemo<ColumnDef<BatchesTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('qualification_pack.ssc.ssc_code', {
        header: () => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                SSC Code
              </Typography>
              <Typography variant='body2'>QP ID</Typography>
            </div>
          </div>
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/* {getAvatar({ avatar: row.original.avatar ? `/uploads/agency/users/${row.original.id}/${row.original.avatar}` : '', first_name: (row.original.first_name || '') + ' ' + (row.original.last_name || '') })} */}
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.qualification_pack?.ssc?.ssc_code}
              </Typography>
              <Typography variant='body2'>{row.original.qualification_pack?.qualification_pack_id}</Typography>
            </div>
          </div>
        )
      }),

      // columnHelper.accessor('role_id', {
      //   header: 'Role',
      //   cell: ({ row }) => (
      //     <div className='flex items-center gap-2'>
      //       <Icon
      //         className={userRoleObj[row.original.role.id].icon}
      //         sx={{ color: `var(--mui-palette-${userRoleObj[row.original.role.id].color}-main)` }}
      //       />
      //       <Typography className='capitalize' color='text.primary'>
      //         {row.original.role.name}
      //       </Typography>
      //     </div>
      //   )
      // }),

      columnHelper.accessor('batch_name', {
        header: 'Batch Name',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.batch_name}
          </Typography>
        )
      }),
      columnHelper.accessor('batch_size', {
        header: 'Batch Size',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.batch_size}
          </Typography>
        )
      }),
      columnHelper.accessor('training_partner_id', {
        header: 'Training Partner',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.training_partner.company_name}
          </Typography>
        )
      }),
      columnHelper.accessor('training_centre_id', {
        header: 'Center ID',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.training_center.user_name}
          </Typography>
        )
      }),
      columnHelper.accessor('assessment_start_datetime', {
        header: 'Start Date Time',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.assessment_start_datetime && format(row.original.assessment_start_datetime, 'd-MMM-y K:mm a')}
          </Typography>
        )
      }),

      columnHelper.accessor('assessment_end_datetime', {
        header: 'End Date Time',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.assessment_end_datetime && formatDate(row.original.assessment_end_datetime)}
          </Typography>
        )
      }),
      columnHelper.accessor('scheme', {
        header: 'Scheme',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.scheme.scheme_name}
          </Typography>
        )
      }),
      columnHelper.accessor('batch_completed', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip label={ row.original.batch_completed === 1 ? 'Completed' : 'Pending'} color={ row.original.batch_completed === 1 ? 'success' : 'warning'} variant='tonal' />
        ),
        enableSorting: false
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({row}) =>  {

          // const isLoading = loadingIds.includes(row.original.id);
          // const open = selectedRowId === row.original.id

          return <KitOptionMenu batchId={row.original.id} questionPaper={row.original.question_paper} omrSheet={row.original.omr_sheet} />
        },
        enableSorting: false
      })

      // columnHelper.accessor('action', {
      //   header: 'Action',
      //   cell: ({row}) =>  {

      //     const isLoading = loadingIds.includes(row.original.id);

      //     return (
      //       <div className='flex items-center'>
      //         <Tooltip title="Download Assessment Kit">
      //           <Button startIcon={isLoading ? <CircularProgress size={20} /> : <i className='tabler-download' />} onClick={() => handleDownloadAssessmentKit(row.original.id)} variant='outlined' size='small' disabled={isLoading}>
      //             Assessment Kit
      //           </Button>
      //         </Tooltip>
      //         {/* <ZipAction batchId={row.original.id} /> */}
      //       </div>
      //     )},
      //   enableSorting: false
      // })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: data as BatchesWithQP[],
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
            SelectProps={{ MenuProps }}
          >
            {TableRowLimit && TableRowLimit.rowLimit.length > 0 && TableRowLimit.rowLimit.map((limit, index) => (
              <MenuItem key={index} value={limit}>{limit}</MenuItem>
            ))}
          </CustomTextField>
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Batch'
              className='is-full sm:is-auto'
            />
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
    </>
  )
}

export default BatchesListTable
