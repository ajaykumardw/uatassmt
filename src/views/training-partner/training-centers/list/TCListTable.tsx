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
import Chip from '@mui/material/Chip'
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

import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { state, city, role, users } from '@prisma/client'

import { toast } from 'react-toastify'

import type { ThemeColor } from '@core/types'


// Component Imports
import TableFilters from './TableFilters'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'


// Style Imports
import tableStyles from '@core/styles/table.module.css'

import { formatDate } from '@/utils/formateDate'


import AddEditTCForm from './AddEditTCForm'

import type { UsersType } from '@/types/users/usersType'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type UsersTypeWithAction = users & {
  action?: string
  role: role
}

// type UserRoleType = {
//   [key: string]: { icon: string; color: string }
// }

type UserStatusType = {
  [key: string]: ThemeColor
}

type UserShowStatusType = {
  [key: string]: string
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

const userStatusObj: UserStatusType = {
  1: 'success',
  0: 'warning',
}


const userShowStatusObj: UserShowStatusType = {

  1: 'Active',

  0: 'Inactive'

}


// Column Definitions
const columnHelper = createColumnHelper<UsersTypeWithAction>()

const TCListTable = ({ tableData, updateTCList }: { tableData?: users[], updateTCList: () => void }) => {
  // States
  const [addEditTCOpen, setAddEditTCOpen] = useState(false)
  const [editTCOpen, setEditTCOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(...[tableData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [tcId, setTCId] = useState(0);
  const [tcEditData, setEditTCData] = useState<UsersType>();
  const [stateData, setStateData] = useState<state[]>([]);
  const [cities, setCityData] = useState<city[]>([]);

  // Hooks
  // const { lang: locale } = useParams()

  useEffect(() => {

    // Check for a notification message from localStorage or other storage
    const message = localStorage.getItem('formSubmitMessage');

    if (message) {
      toast.success(message);
      localStorage.removeItem('formSubmitMessage');
    }

    getStateData();
  }, []);

  const getStateData = async () => {

    try {

      const states = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/state`, {method: 'POST', headers: {'Content-Type': 'application/json', }}).then(function (response) { return response.json() });

      if (states.length > 0) {

        setStateData(states)

      } else {

        setStateData([])

      }

    } catch (error) {

      console.error('Error fetching city data:', error);
    }

  }

  const handleOnEditClick = async (id: number) => {

    try {

      const tc = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tc/${id}`).then(function (response) { return response.json() });

      if (tc) {

        if (tc?.state_id) {
          try {

            const cities = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/${tc.state_id.toString()}`).then(function (response) { return response.json() });

            if (cities.length > 0) {

              setCityData(cities)

            } else {

              setCityData([])

            }

            setEditTCOpen(!editTCOpen);

            // console.log(cities)
            // return response;

          } catch (error) {
            console.error('Error fetching city data:', error);
          }
        } else {
          setCityData([])
        }

        setEditTCData(tc)

      } else {

        setEditTCData(undefined)

      }

    } catch (error) {

      console.error('Error fetching TC data:', error);
    }




    // alert("some");
    setTCId(id);
  }

  const columns = useMemo<ColumnDef<UsersTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('first_name', {
        header: 'Center',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: row.original.avatar ? `/uploads/agency/users/${row.original.id}/${row.original.avatar}` : '', first_name: row.original.company_name || '' })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.company_name}
              </Typography>
              <Typography variant='body2'>{row.original.first_name + " "+row.original.last_name}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('user_name', {
        header: 'TC ID',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.user_name}
          </Typography>
        )
      }),
      columnHelper.accessor('mobile_no', {
        header: 'Phone',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.mobile_no}
          </Typography>
        )
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.email}
          </Typography>
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
      columnHelper.accessor('created_at', {
        header: 'Created On',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {formatDate(row.original.created_at)}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            {/* <Link href={getLocalizedUrl(`tc/${row.original.id}`, locale as Locale)} className='flex'> */}
              <IconButton onClick={() => handleOnEditClick(row.original.id)}>
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
    data: data as users[],
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

  const getAvatar = (params: Pick<users, 'avatar' | 'first_name'>) => {
    const { avatar, first_name } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(first_name as string)}</CustomAvatar>
    }
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
              placeholder='Search Training Center'
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
              onClick={() => setAddEditTCOpen(!addEditTCOpen)}
              className='is-full sm:is-auto'
            >
              Add New Training Center
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
      <AddEditTCForm open={addEditTCOpen} stateData={stateData} updateTCList={updateTCList} handleClose={() => setAddEditTCOpen(!addEditTCOpen)} />
      {cities.length > 0 ?
        <AddEditTCForm tcId={tcId} open={editTCOpen} updateTCList={updateTCList} handleClose={() => setEditTCOpen(!editTCOpen)} data={tcEditData} stateData={stateData} cities={cities} />
        : ''
      }
      {/* <AddUserDrawer open={addEditTCOpen} handleClose={() => setAddEditTCOpen(!addEditTCOpen)} /> */}
      {/* <AddUsersDialog open={addEditTCOpen} handleClose={() => setAddEditTCOpen(!addEditTCOpen)} /> */}
    </>
  )
}

export default TCListTable
