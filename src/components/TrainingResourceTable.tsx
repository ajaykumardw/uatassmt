'use client'

import { useEffect, useState } from 'react'

import { format } from 'date-fns'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'

import { MenuProps, TableRowLimit } from '@/configs/customDataConfig'
import CustomTextField from '@/@core/components/mui/TextField'

type RowType = {
  is_read: number
  trainingResource: {
    id: number
    name: string
    file: string | null
    description: string | null
    created_at: string
  }
}

export default function TrainingResourceTable() {
  const [rows, setRows] = useState<RowType[]>([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [total, setTotal] = useState(0)

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/my/training-resource`;

  const getData = async () => {
    setLoading(true)

    try {
      const res = await fetch(
        `${apiUrl}?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${encodeURIComponent(search)}`,
        {
          cache: 'no-store'
        }
      )

      const json = await res.json()

      setRows(json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {

      await fetch(`${apiUrl}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingResourceId: id })
      })

      // update only that row locally
      setRows(prev =>
        prev.map(row =>
          row.trainingResource.id === id
            ? { ...row, is_read: 1 }
            : row
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getData()
  }, [page, rowsPerPage, search])

  const handleSearch = () => {
    setPage(0)
    setSearch(searchInput)
  }

  const handleDownload = (file: string | null) => {
    if (!file) return

    const link = document.createElement('a')

    link.href = file
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.download = ''

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Pagination values
  const pageCount = Math.ceil(total / rowsPerPage)

  const start = total === 0 ? 0 : page * rowsPerPage + 1

  const end = Math.min((page + 1) * rowsPerPage, total)

  return (
    <Card>
      <CardHeader
        title='Training Resources'
        action={
          <Tooltip title='Refresh'>
            <IconButton onClick={getData}>
              <i className='tabler-refresh' />
            </IconButton>
          </Tooltip>
        }
      />

        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={rowsPerPage}
            onChange={e => {
              setRowsPerPage(Number(e.target.value))
              setPage(0)
            }}
            className='is-[80px]'
            SelectProps={{ MenuProps }}
          >
            {TableRowLimit.rowLimit.map((limit, index) => (
              <MenuItem key={index} value={limit}>
                {limit}
              </MenuItem>
            ))}
          </CustomTextField>
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            <TextField
              fullWidth
              size='small'
              placeholder='Search Resources'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch()
              }}
            />

            <Button variant='contained' onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
      <CardContent>
        {/* Search + Limit */}
        {/* <div className='flex flex-col md:flex-row gap-4 mb-4'>
          <TextField
            fullWidth
            size='small'
            placeholder='Search resource name...'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch()
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton onClick={handleSearch}>
                    <i className='tabler-search' />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button variant='contained' onClick={handleSearch}>
            Search
          </Button>

          <CustomTextField
            select
            value={rowsPerPage}
            onChange={e => {
              setRowsPerPage(Number(e.target.value))
              setPage(0)
            }}
            className='is-[80px]'
            SelectProps={{ MenuProps }}
          >
            {TableRowLimit.rowLimit.map((limit, index) => (
              <MenuItem key={index} value={limit}>
                {limit}
              </MenuItem>
            ))}
          </CustomTextField>
        </div> */}

        {/* Table */}
        <TableContainer>
          <Table className='border border-rounded'>
            <TableHead>
              <TableRow>
                <TableCell width={80}>SR. No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell width={130}>Status</TableCell>
                <TableCell width={160}>Created</TableCell>
                <TableCell width={130}>File</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow hover key={row.trainingResource.id}>
                    <TableCell>
                      {page * rowsPerPage + index + 1}
                    </TableCell>

                    <TableCell>
                      <Typography color='text.primary' className='font-medium'>
                        {row.trainingResource.name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {row.trainingResource.description || '-'}
                    </TableCell>

                    <TableCell>
                      {row.is_read === 1 ? (
                        <Chip
                          label='Read'
                          color='success'
                          size='small'
                        />
                      ) : (
                        <Chip
                          label='Unread'
                          color='warning'
                          size='small'
                          variant='outlined'
                          onClick={() => markAsRead(row.trainingResource.id)}
                          clickable
                        />
                      )}
                    </TableCell>

                    <TableCell>
                      {format(
                        new Date(row.trainingResource.created_at),
                        'dd MMM yyyy'
                      )}
                    </TableCell>

                    <TableCell>
                      {row.trainingResource.file && (

                        <Tooltip title='Download File'>
                          <span>
                            <IconButton
                              disabled={!row.trainingResource.file}
                              onClick={() => {
                                handleDownload(
                                  row.trainingResource.file
                                );

                                markAsRead(row.trainingResource.id)
                              }}
                              color={row.trainingResource.file ? 'success' : 'error'}
                            >
                              <i className='tabler-download' />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Custom Pagination */}
        <div className='flex justify-between items-center flex-wrap gap-4 mt-4'>
          <Typography color='text.secondary'>
            {`Showing ${start} to ${end} of ${total} entries`}
          </Typography>

          <Pagination
            shape='rounded'
            color='primary'
            variant='tonal'
            count={pageCount}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            showFirstButton
            showLastButton
          />
        </div>
      </CardContent>
    </Card>
  )
}
