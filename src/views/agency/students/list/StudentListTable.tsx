'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
// import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
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
import type { students } from '@prisma/client'

import { toast } from 'react-toastify'

import { format } from 'date-fns'

// import type { ThemeColor } from '@core/types'


// Component Imports
import TableFilters from './TableFilters'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports


// Style Imports
import tableStyles from '@core/styles/table.module.css'

import AddUsersDialog from '@/components/users/dialogs/AddUsersDialog'

// import { formatDate } from '@/utils/formateDate'


import { GenderMap } from '@/configs/customDataConfig'

import EditStudentDrawer from './EditStudentDrawer'

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
}

// type UserRoleType = {
//   [key: string]: { icon: string; color: string }
// }

// type UserStatusType = {
//   [key: string]: ThemeColor
// }

// type UserShowStatusType = {
//   [key: string]: string
// }

// Styled Components

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





// Column Definitions
const columnHelper = createColumnHelper<StudentsTypeWithAction>()

const StudentListTable = () => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [studentId, setStudentId] = useState<number | null>(null)
  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState<students[]>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [updateStudentList, setUpdateStudentList] = useState(false);


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
          <Typography color='text.primary' className='font-medium'>
            {row.original.candidate_id}
          </Typography>
        )
      }),
      columnHelper.accessor('user_name', {
        header: 'User Name',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.user_name}
          </Typography>
        )
      }),
      columnHelper.accessor('candidate_name', {
        header: 'Student Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/* {getAvatar({ avatar: row.original.avatar ? `/uploads/agency/users/${row.original.id}/${row.original.avatar}` : '', first_name: (row.original.first_name || '') + ' ' + (row.original.last_name || '') })} */}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.candidate_name}
              </Typography>
              {/* <Typography variant='body2'>{row.original.user_name}</Typography> */}
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

      columnHelper.accessor('mobile_no', {
        header: 'Phone',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.mobile_no}
          </Typography>
        )
      }),
      columnHelper.accessor('date_of_birth', {
        header: 'Date Of Birth',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.date_of_birth && format(row.original.date_of_birth, 'dd-MMM-yyyy')}
          </Typography>
        )
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.gender && GenderMap[row.original.gender]}
          </Typography>
        )
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.category}
          </Typography>
        )
      }),
      columnHelper.accessor('state', {
        header: 'State',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.state}
          </Typography>
        )
      }),
      columnHelper.accessor('city', {
        header: 'City',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.city}
          </Typography>
        )
      }),
      columnHelper.accessor('address', {
        header: 'Address',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.address}
          </Typography>
        )
      }),

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
        cell: ({ row }) => (
          <div className='flex items-center'>
            {/* <Link href={getLocalizedUrl(`students/edit/${row.original.id}`, locale as Locale)} className='flex'> */}
              <IconButton
              onClick={() => {setEditStudentOpen(true); setStudentId(row.original.id)}}
              >
                <i className='tabler-edit text-[22px] text-textSecondary' />
              </IconButton>
            {/* </Link> */}
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
    data: data as students[],
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
        <TableFilters setData={setData} onUpdateStudent={updateStudentList}/>
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
              placeholder='Search Student'
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
            {/* <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setAddUserOpen(!addUserOpen)}
              className='is-full sm:is-auto'
            >
              Add New User
            </Button> */}
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
                      <tr key={row.id} className={classnames( { selected: row.getIsSelected() })}>
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
      <EditStudentDrawer open={editStudentOpen} id={studentId} handleClose={() => setEditStudentOpen(!editStudentOpen)} updateStudentList={setUpdateStudentList} />
      <AddUsersDialog open={addUserOpen} handleClose={() => setAddUserOpen(!addUserOpen)} />
    </>
  )
}

export default StudentListTable
