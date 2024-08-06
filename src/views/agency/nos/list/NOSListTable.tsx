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

import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import TableFilters from './TableFilters'

// import AddQPDrawer from './AddQPDrawer'

import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
// import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// import AddQPDialog from '@/components/qualification-packs/dialogs/AddQPDialog';

import AddEditNOSDialog from '@/components/nos/dialogs/AddEditNOSDialog';
import AddEditPCDialog from '@/components/pc/dialogs/AddEditPCDialog';

import type { NOSType } from '@/types/nos/nosType';
import type { PCType } from '@/types/pc/pcType';

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type NOSTypeWithAction = NOSType & {
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

// const qualificationPackShowLevelObj: UserShowStatusType = {

//   'E': 'Easy',

//   'M': 'Medium',

//   'H': 'Hard'

// }

// const qualificationPackLevelObj: UserStatusType = {
//   'E': 'success',
//   'M': 'warning',
//   'H': 'error'
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
const columnHelper = createColumnHelper<NOSTypeWithAction>()

const NOSListTable = ({ tableData, updateNOSList }: { tableData?: NOSType[], updateNOSList: () => void }) => {
  // States
  const [addNOSOpen, setAddNOSOpen] = useState(false);
  const [editNOSOpen, setEditNOSOpen] = useState(false);
  const [addPCOpen, setAddPCOpen] = useState(false);
  const [editPCOpen, setEditPCOpen] = useState(false);
  const [nosId, setNOSId] = useState(0);
  const [pcId, setPCId] = useState(0);

  const [nosEditData, setNOSEditData] = useState({
    sscId: '',
    nosId: '',
    nosName: ''
  });

  const [pcAddData, setPCAddData] = useState({

    pcId: '',

    pcName: '',
  });

  const [pcEditData, setPCEditData] = useState({

    pcId: '',

    pcName: '',
  });

  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(...[tableData]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleOnEditClick = async (id: number) => {

    if (id) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos/${id}`)

      if (!res.ok) {
        throw new Error('Failed to fetch NOS')
      }

      const nosData = await res.json();

      if (nosData) {
        const editData = {
          sscId: nosData.ssc_id.toString(),
          nosId: nosData.nos_id,
          nosName: nosData.nos_name,
        }

        setNOSEditData(editData);
        setEditNOSOpen(!editNOSOpen);
      }
    }

    // alert("some");
    setNOSId(id);
  }

  const handleOnAddPCClick = async (nos_id: number, nos_unique_id?: string, pc?: PCType[]) => {

    const pc_id = (nos_unique_id + '_PC' + ((pc?.length ?? 0) + 1));

    setPCAddData({
      pcId: pc_id,
      pcName: ''
    });

    setAddPCOpen(!addPCOpen)
    setNOSId(nos_id)
  }

  const handleOnEditPCClick = async (id: number) => {

    if (id) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pc/${id}`)

      if (!res.ok) {
        throw new Error('Failed to fetch PC')
      }

      const pcData = await res.json();

      if (pcData) {
        const editData = {
          pcId: pcData.pc_id,
          pcName: pcData.pc_name,
        }

        setPCEditData(editData);
        console.log("from-table list: ", editData);
        setEditPCOpen(!editPCOpen);
      }
    }

    setPCId(id);
  }

  // Hooks
  const columns = useMemo<ColumnDef<NOSTypeWithAction, any>[]>(
    () => [
      {
        id: 'extender', // Serial number column
        header: '',
        cell: ({ row }) => <div className='flex items-center gap-4'>
          {row.getCanExpand() ? (
            <IconButton onClick={row.getToggleExpandedHandler()}>
              <i className={`${row.getIsExpanded() ? 'tabler-minus' : 'tabler-plus'} tabler-edit text-[22px] text-textSecondary`} />
            </IconButton>
          ) : (
            ''
          )}
        </div>
      },
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('ssc.ssc_name', {
        header: 'Sector Skill Council',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.ssc.ssc_name}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('nos_id', {
        header: 'NOS ID',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.nos_id}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('nos_name', {
        header: 'Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.nos_name}
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
            <IconButton onClick={() => handleOnEditClick(row.original.id)}>
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
    data: data as NOSType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    getRowCanExpand: () => true,
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
              placeholder='Search NOS'
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
              onClick={() => setAddNOSOpen(!addNOSOpen)}
              className='is-full sm:is-auto'
            >
              Add New NOS
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
                      <Fragment key={row.id}>
                        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                        {row.getIsExpanded() && (
                          <tr key={`${row.id}-extended`} className={classnames({ selected: row.getIsSelected() })}>
                            {/* 2nd row is a custom 1 cell row */}
                            <td colSpan={row.getVisibleCells().length}>
                              <div className='flex justify-end flex-col items-start md:flex-row md:items-center p-4 pb-6 gap-4'>
                                <div className='flex flex-col sm:flex-row sm:is-auto items-start sm:items-center gap-4'>
                                  <Button
                                    variant='tonal'
                                    size='small'
                                    startIcon={<i className='tabler-plus' />}
                                    onClick={() => handleOnAddPCClick(row.original.id, row.original.nos_id, row.original.pc)}
                                    className='is-full sm:is-auto'
                                  >
                                    Add New PC
                                  </Button>
                                </div>
                              </div>
                              <div className="pr-2 pb-4">
                                <Card variant='outlined'>
                                  <table className={tableStyles.table}>
                                    <thead style={{ borderTop: '0' }}>
                                      <tr style={{ borderTop: '0' }}>
                                        <th>
                                          <div>S.No.</div>
                                        </th>
                                        <th>
                                          <div>PC ID</div>
                                        </th>
                                        <th>
                                          <div>PC Name</div>
                                        </th>
                                        <th>
                                          <div>Action</div>
                                        </th>
                                      </tr>
                                    </thead>
                                    {row.original.pc.length === 0 ? (
                                      <tbody>
                                        <tr>
                                          <td colSpan={4} className='text-center'>
                                            No data available
                                          </td>
                                        </tr>
                                      </tbody>
                                    ) : (
                                      <tbody>
                                        {row.original.pc.map((pc: PCType, index: number) => (
                                          <tr key={index + 1}>
                                            <td>{index + 1}</td>
                                            <td>{pc.pc_id}</td>
                                            <td>{pc.pc_name}</td>
                                            <td>
                                              <div className='flex items-center'>
                                                <IconButton onClick={() => handleOnEditPCClick(pc.id)}>
                                                  <i className='tabler-edit text-[22px] text-textSecondary' />
                                                </IconButton>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    )}
                                  </table>
                                </Card>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
      <AddEditNOSDialog open={addNOSOpen} updateNOSList={updateNOSList} handleClose={() => setAddNOSOpen(!addNOSOpen)} />
      <AddEditNOSDialog open={editNOSOpen} nosId={nosId} updateNOSList={updateNOSList} handleClose={() => setEditNOSOpen(!editNOSOpen)} data={nosEditData} />
      <AddEditPCDialog open={addPCOpen} nosId={nosId} data={pcAddData} updatePCList={updateNOSList} handleClose={() => setAddPCOpen(!addPCOpen)} />
      <AddEditPCDialog open={editPCOpen} pcId={pcId} updatePCList={updateNOSList} handleClose={() => setEditPCOpen(!editPCOpen)} data={pcEditData} />
    </>
  )
}

export default NOSListTable
