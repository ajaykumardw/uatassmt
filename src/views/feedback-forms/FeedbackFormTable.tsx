
// React Imports
import { useEffect, useState, useMemo } from 'react';

// Next Imports
import { useParams } from 'next/navigation';

import Link from 'next/link';

// MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
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

// Type Imports
import { format } from 'date-fns';

import type { feedback_responses, feedback_forms } from "@prisma/client";

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n';

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { FeedbackFormTypes, MenuProps, TableRowLimit } from '@/configs/customDataConfig';



import type { Locale } from '@/configs/i18n';

import ViewFeedbackForm from './ViewFeedbackForm';


type FeedbackFormTypeWithAction = feedback_forms & {
  feedback_responses?: feedback_responses[]
  action?: string
  serialNumber?: number
}

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
const columnHelper = createColumnHelper<FeedbackFormTypeWithAction>()

const FeedbackFormTable = ({ data }: { data: feedback_forms[] }) => {

  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('');
  const [openViewFeedbackForm, setOpenViewFeedbackForm] = useState(false);
  const [openViewFeedbackFormId, setOpenViewFeedbackFormId] = useState<number | null>(null);

  const handleOpenViewFeedbackForm = (id: number) => {
    setOpenViewFeedbackForm(true);
    setOpenViewFeedbackFormId(id);
  };

  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<FeedbackFormTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('form_name', {
        header: 'Form Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.form_name}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('form_type', {
        header: 'Form Type',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.form_type ? FeedbackFormTypes[row.original.form_type] : ''}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('feedback_responses', {
        header: 'Total Responses',
        cell: ({ row }) => (
          <Typography>
            {row.original.feedback_responses ? row.original.feedback_responses.length : 0}
          </Typography>
        )
      }),
      columnHelper.accessor('created_at', {
        header: 'Created At',
        cell: ({ row }) => (
          <Typography>
            {format(new Date(row.original.created_at), 'dd MMM, yyyy hh:mm a')}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            {/* <IconButton>
                <i className='tabler-eye text-[22px] text-textSecondary' />
              </IconButton> */}
            <IconButton onClick={() => handleOpenViewFeedbackForm(row.original.id)}>
              <i className='tabler-eye text-[22px] text-textSecondary' />
            </IconButton>
            <Link href={getLocalizedUrl(`feedback-forms/${row.original.id}/edit`, locale as Locale)} className='flex'>
              <IconButton>
                <i className='tabler-edit text-[22px] text-textSecondary' />
              </IconButton>
            </Link>
          </div>
        ),
        enableSorting: false
      })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: data as feedback_forms[],
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
      <CardHeader title='Feedback Forms' className='pbe-4' />
      {/* <TableFilters setData={setData} tableData={tableData} /> */}
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
          ))
          }
        </CustomTextField>
        <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Form'
            className='is-full sm:is-auto'
          />
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            component={Link}
            href="/feedback-forms/create"
            className='is-full sm:is-auto'
          >
            Add New Form
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
    <ViewFeedbackForm open={openViewFeedbackForm} handleClose={() => {setOpenViewFeedbackForm(false); setOpenViewFeedbackFormId(null);}} id={openViewFeedbackFormId} />
    </>
  );
}

export default FeedbackFormTable;
