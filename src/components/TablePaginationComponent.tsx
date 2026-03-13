// MUI Imports
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

// Third Party Imports
import type { useReactTable } from '@tanstack/react-table'

type Props = {

  table: ReturnType<typeof useReactTable>

  total?: number   // only required for server mode

}

const TablePaginationComponent = ({
  table,
  total = 0
}: Props) => {

  const { pageIndex, pageSize } =
    table.getState().pagination

  // detect mode automatically
  const isServer = table.options.manualPagination

  // total rows
  const rowCount = isServer
    ? total
    : table.getFilteredRowModel().rows.length

  // total pages
  const pageCount = isServer
    ? Math.ceil(total / pageSize)
    : table.getPageCount()

  // showing range
  const start =
    rowCount === 0
      ? 0
      : pageIndex * pageSize + 1

  const end =
    Math.min(
      (pageIndex + 1) * pageSize,
      rowCount
    )

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>

        {`Showing ${start} to ${end} of ${rowCount} entries`}

      </Typography>
      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={pageCount}
        page={pageIndex + 1}
        onChange={(_, page) => {
          table.setPageIndex(page - 1)
        }}
        showFirstButton
        showLastButton
      />
    </div>
  )
}

export default TablePaginationComponent
