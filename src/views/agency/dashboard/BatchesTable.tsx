'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

import { useParams } from 'next/navigation'
import Link from 'next/link'

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { format } from 'date-fns'

import type { Locale } from '@configs/i18n'
import { getLocalizedUrl } from '@/utils/i18n'
import TablePaginationComponent from '@components/TablePaginationComponent'

import { getBatchesByMonth } from './actions'

interface BatchRow {
  id: number
  batch_name: string
  scheme_name: string
  assessment_date: string | null
  totalStudents: number
  passedStudents: number
  failedStudents: number
  pendingStudents: number
  passRate: number
  isCompleted: boolean
  center_address: string
}

interface Props {
  todayBatches: BatchRow[]
  thisMonthBatches: BatchRow[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAGE_SIZE = 10

const BatchesTable = ({ todayBatches, thisMonthBatches }: Props) => {
  const { lang: locale } = useParams()
  const now = new Date()
  const [tab, setTab] = useState('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [page, setPage] = useState(0)
  const [monthData, setMonthData] = useState<BatchRow[]>(thisMonthBatches)
  const [total, setTotal] = useState(thisMonthBatches.length)
  const [loading, setLoading] = useState(false)

  const columnHelper = createColumnHelper<BatchRow>()

  const columns = useMemo<ColumnDef<BatchRow, any>[]>(
    () => [
      {
        id: 'srNo',
        header: '#',
        cell: ({ row }) => <Typography>{row.index + 1 + page * PAGE_SIZE}</Typography>,
      },
      columnHelper.accessor('batch_name', {
        header: 'Batch Name',
        cell: ({ row }) => (
          <Link
            href={getLocalizedUrl(`batches/edit/${row.original.id}`, locale as Locale)}
            className='text-[var(--mui-palette-primary-main)] no-underline hover:underline font-medium'
          >
            {row.original.batch_name}
          </Link>
        ),
      }),
      columnHelper.accessor('scheme_name', {
        header: 'Scheme',
        cell: ({ row }) => <Typography variant='body2'>{row.original.scheme_name}</Typography>,
      }),
      columnHelper.accessor('center_address', {
        header: 'Center / Address',
        cell: ({ row }) => (
          <Typography variant='body2' className='max-w-[200px] truncate' title={row.original.center_address}>
            {row.original.center_address || '—'}
          </Typography>
        ),
      }),
      columnHelper.accessor('assessment_date', {
        header: 'Date',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.assessment_date
              ? format(new Date(row.original.assessment_date), 'dd MMM yyyy hh:mm a')
              : '—'}
          </Typography>
        ),
      }),
      {
        id: 'students',
        header: 'Students (P/F/Pend)',
        cell: ({ row }) => (
          <Typography variant='body2'>
            <span className='text-[var(--mui-palette-success-main)]'>{row.original.passedStudents}</span>
            <span className='text-[var(--mui-palette-text-disabled)] mx-1'>/</span>
            <span className='text-[var(--mui-palette-error-main)]'>{row.original.failedStudents}</span>
            <span className='text-[var(--mui-palette-text-disabled)] mx-1'>/</span>
            <span className='text-[var(--mui-palette-warning-main)]'>{row.original.pendingStudents}</span>
            <span className='text-[var(--mui-palette-text-disabled)] ml-1'>({row.original.totalStudents})</span>
          </Typography>
        ),
      },
      {
        id: 'passRate',
        header: 'Pass Rate',
        cell: ({ row }) => (
          <div className='flex items-center gap-2' style={{ minWidth: 140 }}>
            <LinearProgress
              variant='determinate'
              value={row.original.passRate}
              color={row.original.passRate >= 60 ? 'success' : row.original.passRate >= 30 ? 'warning' : 'error'}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant='caption'>{row.original.passRate}%</Typography>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.isCompleted ? 'Completed' : 'Active'}
            color={row.original.isCompleted ? 'success' : 'info'}
            variant='tonal'
            size='small'
          />
        ),
      },
    ],
    [page]
  )

  const todayTable = useReactTable({
    data: todayBatches,
    columns,
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const monthTable = useReactTable({
    data: monthData,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(total / PAGE_SIZE),
    state: { pagination: { pageIndex: page, pageSize: PAGE_SIZE } },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function'
        ? updater({ pageIndex: page, pageSize: PAGE_SIZE })
        : updater

      setPage(next.pageIndex)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  const fetchMonthData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await getBatchesByMonth(year, month, page + 1, PAGE_SIZE)

      setMonthData(res.rows)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [year, month, page])

  useEffect(() => {
    if (tab === 'month') fetchMonthData()
  }, [tab, fetchMonthData])

  const handleTabChange = (_: any, v: string) => {
    setTab(v)
    setPage(0)
  }

  const handleMonthChange = (e: any) => {
    setMonth(Number(e.target.value))
    setPage(0)
  }

  const handleYearChange = (e: any) => {
    setYear(Number(e.target.value))
    setPage(0)
  }

  const renderTableContent = (table: ReturnType<typeof useReactTable<BatchRow>>, isLoading?: boolean) => (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableCell key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align='center'>
                  <Typography color='text.secondary'>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align='center'>
                  <Typography color='text.secondary'>No batches found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} sx={{ '&:last-child td': { border: 0 } }}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePaginationComponent table={table as any} total={total} />
    </>
  )

  return (
    <Card>
      <CardHeader
        title='Batches'
        subheader={tab === 'today' ? "Today's assessments" : `${MONTHS[month - 1]} ${year}`}
        action={
          tab === 'month' ? (
            <div className='flex items-center gap-2'>
              <Select size='small' value={month} onChange={handleMonthChange} sx={{ minWidth: 100 }}>
                {MONTHS.map((name, i) => (
                  <MenuItem key={i} value={i + 1}>{name}</MenuItem>
                ))}
              </Select>
              <Select size='small' value={year} onChange={handleYearChange} sx={{ minWidth: 90 }}>
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </div>
          ) : undefined
        }
      />
      <CardContent>
        <TabContext value={tab}>
          <TabList onChange={handleTabChange} variant='fullWidth' className='mbe-4'>
            <Tab label={`Today (${todayBatches.length})`} value='today' />
            <Tab label={`${MONTHS[month - 1]} ${year} (${total})`} value='month' />
          </TabList>
          <TabPanel value='today' className='p-0'>
            {renderTableContent(todayTable)}
          </TabPanel>
          <TabPanel value='month' className='p-0'>
            {renderTableContent(monthTable, loading)}
          </TabPanel>
        </TabContext>
      </CardContent>
    </Card>
  )
}

export default BatchesTable
