'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

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
import type { batches, schemes, students, users } from '@prisma/client'

import { toast } from 'react-toastify'

import { format } from 'date-fns'

import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports

import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import { formatDate } from '@/utils/formateDate'

import type { QPType } from '@/types/qualification-pack/qpType'

import ImportStudents from './ImportStudents'


// declare module '@tanstack/table-core' {
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo
//   }
// }

type BatchesTypeWithAction = batches & {
  action?: string
  qualification_pack: QPType
  training_partner: users
  training_center: users
  scheme: schemes
  sub_scheme: schemes
  students?: students[]
  assessor: users

  // role: role
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
//   'Assessor': { icon: 'tabler-chart-pie', color: 'success' },
//   subscriber: { icon: 'tabler-user', color: 'primary' }
// }
// const userRoleObj: UserRoleType = {
//   1: { icon: 'tabler-school', color: 'info' },
//   2: { icon: 'tabler-heart-handshake', color: 'warning' },
// }

// const userStatusObj: UserStatusType = {
//   1: 'success',
//   0: 'warning',
// }


// const userShowStatusObj: UserShowStatusType = {

//   1: 'Active',

//   0: 'Inactive'

// }


// Column Definitions
const columnHelper = createColumnHelper<BatchesTypeWithAction>()

const BatchesListTable = ({ tableData, updateBatchList }: { tableData?: batches[], updateBatchList: () => void }) => {

  // States
  // const [addUserOpen, setAddUserOpen] = useState(false)

  const router = useRouter();

  const [rowSelection, setRowSelection] = useState({})
  const [showImportStudents, setShowImportStudents] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(...[tableData])
  const [globalFilter, setGlobalFilter] = useState('')

  // Hooks
  const { lang: locale } = useParams()

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

  const handleViewStudentsClick = (row: BatchesTypeWithAction) => {
    localStorage.setItem("ssc_id", row.qualification_pack.ssc.id.toString());
    localStorage.setItem("qp_id", row.qualification_pack.id.toString());
    localStorage.setItem("batch_id", row.id.toString());

    router.push(getLocalizedUrl(`students`, locale as Locale))

  }

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
                {row.original.qualification_pack.ssc.ssc_code}
              </Typography>
              <Typography variant='body2'>{row.original.qualification_pack.qualification_pack_id}</Typography>
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
      columnHelper.accessor('students', {
        header: 'Students',
        cell: ({ row }) => {
          if(row.original.students?.length && row.original.students?.length > 0){
            return (
              <Button
                variant='tonal'
                size='small'
                startIcon={row.original.students?.length}

                // onClick={() => {
                //   localStorage.setItem("ssc_id", '1');
                //   localStorage.setItem("qp_id", '1');
                //   localStorage.setItem("batch_id", '1');
                // }}

                onClick={() => handleViewStudentsClick(row.original)}
                className='is-full sm:is-auto'
              >
                View
              </Button>
            );
          }
        }
      }),
      columnHelper.accessor('training_partner_id', {
        header: 'Training Partner',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.training_partner.first_name}
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
      columnHelper.accessor('assessor.first_name', {
        header: 'Assessor',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.assessor?.first_name} {row.original.assessor?.last_name}
          </Typography>
        )
      }),

      columnHelper.accessor('assessment_start_datetime', {
        header: 'Start Date Time',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {/* {row.original.assessment_start_datetime && formatDate(row.original.assessment_start_datetime)} */}
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
      columnHelper.accessor('sub_scheme', {
        header: 'Sub Scheme',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.sub_scheme.scheme_name}
          </Typography>
        )
      }),

      // columnHelper.accessor('email', {
      //   header: 'Email',
      //   cell: ({ row }) => (
      //     <Typography color='text.primary' className='font-medium'>
      //       {row.original.email}
      //     </Typography>
      //   )
      // }),
      // columnHelper.accessor('status', {
      //   header: 'Status',
      //   cell: ({ row }) => (
      //     <div className='flex items-center gap-3'>
      //       <Chip
      //         variant='tonal'
      //         className='capitalize'
      //         label={userShowStatusObj[row.original.status]}
      //         color={userStatusObj[row.original.status]}
      //         size='small'
      //       />
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('created_at', {
      //   header: 'Created On',
      //   cell: ({ row }) => (
      //     <Typography color='text.primary' className='font-medium'>
      //       {formatDate(row.original.created_at)}
      //     </Typography>
      //   )
      // }),

      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({row}) => (
          <div className='flex items-center'>
            <Link href={getLocalizedUrl(`batches/edit/${row.original.id}`, locale as Locale)} className='flex'>
              <IconButton>
                <i className='tabler-edit text-[22px] text-textSecondary' />
              </IconButton>
            </Link>
            {/* <IconButton>
              <Link href={getLocalizedUrl('apps/user/view', locale as Locale)} className='flex'>
                <i className='tabler-eye text-[22px] text-textSecondary' />
              </Link>
            </IconButton>
            <OptionMenu
              iconClassName='text-[22px] text-textSecondary'
              options={[
                {
                  text: 'Download',
                  icon: 'tabler-download text-[22px]',
                  menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
                },
                {
                  text: 'Edit',
                  icon: 'tabler-edit text-[22px]',
                  menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
                }
              ]}
            /> */}
          </div>
        ),
        enableSorting: false
      })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: data as batches[],
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

  if (showImportStudents) {
    return <ImportStudents onBack={() => {setShowImportStudents(false); updateBatchList()}} />;
  }

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
              placeholder='Search Batch'
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
              variant='tonal'
              startIcon={<i className='tabler-user-down' />}
              color='error'

              // onClick={() => setAddUserOpen(!addUserOpen)}

              onClick={() => setShowImportStudents(true)}
              className='is-full sm:is-auto'
            >
              Import Students
            </Button>
            <Link href={getLocalizedUrl('batches/create', locale as Locale)} className='flex'>
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}

                // onClick={() => setAddUserOpen(!addUserOpen)}
                className='is-full sm:is-auto'
              >
                Add New Batch
              </Button>
            </Link>
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
      {/* <AddUserDrawer open={addUserOpen} handleClose={() => setAddUserOpen(!addUserOpen)} /> */}
      {/* <AddUsersDialog open={addUserOpen} handleClose={() => setAddUserOpen(!addUserOpen)} /> */}
    </>
  )
}

export default BatchesListTable
