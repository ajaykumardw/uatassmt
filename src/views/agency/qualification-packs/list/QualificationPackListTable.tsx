'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react';

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

import AddQPDialog from '@/components/qualification-packs/dialogs/AddQPDialog';

import type { QPType } from '@/types/qualification-pack/qpType';

import type { NOSType } from '@/types/nos/nosType';

import AssignNOSDialog from '@/components/qualification-packs/dialogs/AssignNOSDialog';

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type QPTypeWithAction = QPType & {
  nos?: number
  action?: string
  serialNumber?: number
}

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
const columnHelper = createColumnHelper<QPTypeWithAction>()

const QualificationPackListTable = ({ tableData, updateQPList }: { tableData?: QPType[], updateQPList: () => void }) => {
  // States
  const [addQPOpen, setAddQPOpen] = useState(false);
  const [editQPOpen, setEditQPOpen] = useState(false);
  const [assignNOSOpen, setAssignNosOpen] = useState(false);
  const [qPId, setQPId] = useState(0);
  const [qPack, setQP] = useState<QPType>();


  const [qpEditData, setQPEditData] = useState({
    sscId: '',
    qualificationPackId: '',
    qualificationPackName: '',
    nQRCode: '',
    nSQFLevel: '',
    version: '',
    totalTheoryMarks: '',
    totalVivaMarks: '',
    totalPracticalMarks: '',
    totalMarks: '',
    isTheoryCutoff: false,
    isVivaCutoff: false,
    isPracticalCutoff: false,
    isOverallCutoff: false,
    isNOSCutoff: false,
    isWeightedAvailable: false,
    theoryCutoffMarks: '',
    vivaCutoffMarks: '',
    practicalCutoffMarks: '',
    overallCutoffMarks: '',
    nosCutoffMarks: '',
    weightedAvailable: ''
  });

  const [addNosData, setAddNosData] = useState<NOSType[]>([]);
  const [addAssignedNOS, setAssignedNOS] = useState<number[]>([]);

  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(...[tableData]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleOnEditClick = async (id: number) => {

    if (id) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL

      }/qualification-packs/${id}`)

      if (!res.ok) {
        throw new Error('Failed to fetch Qualification pack')
      }

      const qpData = await res.json();

      if (qpData) {
        const editData = {
          sscId: qpData.ssc_id.toString(),
          qualificationPackId: qpData.qualification_pack_id,
          qualificationPackName: qpData.qualification_pack_name,
          nQRCode: qpData.nqr_code,
          nSQFLevel: qpData.nsqf_level.toString(),
          version: qpData.version_id.toString(),
          totalTheoryMarks: qpData.total_theory_marks,
          totalVivaMarks: qpData.total_viva_marks,
          totalPracticalMarks: qpData.total_practical_marks,
          totalMarks: qpData.total_marks,
          isTheoryCutoff: qpData.theory_cutoff_marks !== "0",
          isVivaCutoff: qpData.viva_cutoff_marks !== "0",
          isPracticalCutoff: qpData.practical_cutoff_marks !== "0",
          isOverallCutoff: qpData.overall_cutoff_marks !== "0",
          isNOSCutoff: qpData.nos_cutoff_marks !== "0",
          isWeightedAvailable: qpData.weighted_available !== "0",
          theoryCutoffMarks: qpData.theory_cutoff_marks !== "0" ? qpData.theory_cutoff_marks : '',
          vivaCutoffMarks: qpData.viva_cutoff_marks !== "0" ? qpData.viva_cutoff_marks : '',
          practicalCutoffMarks: qpData.practical_cutoff_marks !== "0" ? qpData.practical_cutoff_marks : '',
          overallCutoffMarks: qpData.overall_cutoff_marks !== "0" ? qpData.overall_cutoff_marks : '',
          nosCutoffMarks: qpData.nos_cutoff_marks !== "0" ? qpData.nos_cutoff_marks : '',
          weightedAvailable: qpData.weighted_available !== "0" ? qpData.weighted_available : ''
        }

        setQPEditData(editData);
        setEditQPOpen(!editQPOpen);
      }
    }

    setQPId(id);
  }

  const handleAddNos = async (pack: QPType) => {

    const nos: NOSType[] = pack.nos;

    const noses: number[] = nos?.map(nos => nos.id) || [];

    setQP(pack);

    setAssignedNOS(noses);

    if (pack.ssc.id) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills/${pack.ssc.id}`)

      if (!res.ok) {
        throw new Error('Failed to fetch Sector skills council pack')
      }

      const sscData = await res.json();


      setAddNosData(sscData.nos);

      setAssignNosOpen(!assignNOSOpen)

    }
  }

  // Hooks
  const columns = useMemo<ColumnDef<QPTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('ssc.ssc_name', {
        header: 'Sector Skill Council',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/* {getAvatar({ qualification_pack_name: row.original.qualification_pack_name })} */}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.ssc.ssc_name}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('qualification_pack_id', {
        header: 'Pack ID',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/* {getAvatar({ qualification_pack_name: row.original.qualification_pack_name })} */}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.qualification_pack_id}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('qualification_pack_name', {
        header: 'Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.qualification_pack_name}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('nqr_code', {
        header: 'NQR Code',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/* {getAvatar({ qualification_pack_name: row.original.qualification_pack_name })} */}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.nqr_code}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('nsqf_level', {
        header: 'NSQF Level',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              className='capitalize'
              label={row.original.nsqf_level}
              size='small'
            />
          </div>
        )
      }),
      columnHelper.accessor('total_marks', {
        header: 'Total Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.total_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('total_theory_marks', {
        header: 'Total Theory Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.total_theory_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('total_practical_marks', {
        header: 'Total Practical Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.total_practical_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('total_viva_marks', {
        header: 'Total Viva Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.total_viva_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('theory_cutoff_marks', {
        header: 'Theory Cutoff',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.theory_cutoff_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('practical_cutoff_marks', {
        header: 'Practical Cutoff',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.practical_cutoff_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('viva_cutoff_marks', {
        header: 'Viva Cutoff',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.viva_cutoff_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('overall_cutoff_marks', {
        header: 'Overall Cutoff',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.overall_cutoff_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('nos_cutoff_marks', {
        header: 'NOS Cutoff',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.nos_cutoff_marks}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('weighted_available', {
        header: 'Weighted',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.weighted_available}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('nos', {
        header: 'NOS',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              className='capitalize'
              label={row.original.nos.length}
              color={row.original.nos.length > 0 ? 'success' : 'secondary'}
              size='small'
            />
            <Button
              variant='tonal'
              size='small'
              startIcon={<i className='tabler-plus' />}
              onClick={() => handleAddNos(row.original)}
              className='is-full sm:is-auto'
            >
              Assign
            </Button>
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
    data: data as QPType[],
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
              placeholder='Search Qualification Pack'
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
              onClick={() => setAddQPOpen(!addQPOpen)}
              className='is-full sm:is-auto'
            >
              Add New QP
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
      <AddQPDialog open={addQPOpen} updateQPList={updateQPList} handleClose={() => setAddQPOpen(!addQPOpen)} />
      <AddQPDialog open={editQPOpen} qpId={qPId} updateQPList={updateQPList} handleClose={() => setEditQPOpen(!editQPOpen)} data={qpEditData} />
      <AssignNOSDialog open={assignNOSOpen} qPack={qPack} updateQPList={updateQPList} handleClose={() => setAssignNosOpen(!assignNOSOpen)} data={addNosData} assigned={addAssignedNOS} />
    </>
  )
}

export default QualificationPackListTable
