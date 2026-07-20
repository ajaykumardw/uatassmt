'use client'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Pagination from '@mui/material/Pagination'
import MenuItem from '@mui/material/MenuItem'
import type { TextFieldProps } from '@mui/material/TextField'

import CustomTextField from '@core/components/mui/TextField'

import { MenuProps } from '@/configs/customDataConfig'

type InvoiceRow = {
  id: number
  invoice_number: string
  type: number
  batch_name: string
  ssc_name?: string
  assessor_name?: string
  tp_name?: string
  scheme?: string
  assessment_date?: string
  total_candidate?: number
  present_candidate?: number
  amount_per_candidate?: number
  total_amount: number
  status: number

}

type Props = {
  data: InvoiceRow[]
  updateData: () => void
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (v: string) => void
  type: string
  onTypeChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
  onFilter: () => void
}

const typeLabels: Record<number, string> = {
  1: 'SSC',
  2: 'Assessor',
  3: 'TP'
}

const statusLabels: Record<number, string> = {
  0: 'Draft',
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
  4: 'Paid'
}

const statusColors: Record<number, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  0: 'default',
  1: 'warning',
  2: 'info',
  3: 'error',
  4: 'success'
}

const InvoicesList = ({
  data, total, page, limit, onPageChange,
  search, onSearchChange, type, onTypeChange,
  status, onStatusChange,
  dateFrom, onDateFromChange, dateTo, onDateToChange, onFilter
}: Props) => {
  const router = useRouter()
  const totalPages = Math.ceil(total / limit)

  const handleKeyDown: TextFieldProps['onKeyDown'] = (e) => {
    if (e.key === 'Enter') onFilter()
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Invoices'
            subheader='Manage all invoices'
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => router.push('/invoice/invoices/create')}>
                New Invoice
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={4} className='mb-4'>
              <Grid item xs={12} sm={2}>
                <CustomTextField
                  select
                  fullWidth
                  label='Type'
                  value={type}
                  onChange={e => onTypeChange(e.target.value)}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='1'>SSC</MenuItem>
                  <MenuItem value='2'>Assessor</MenuItem>
                  <MenuItem value='3'>TP</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  fullWidth
                  label='Search (Invoice # / Batch)'
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <CustomTextField
                  select
                  fullWidth
                  label='Status'
                  value={status}
                  onChange={e => onStatusChange(e.target.value)}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='0'>Draft</MenuItem>
                  <MenuItem value='1'>Pending</MenuItem>
                  <MenuItem value='2'>Approved</MenuItem>
                  <MenuItem value='3'>Rejected</MenuItem>
                  <MenuItem value='4'>Paid</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={2}>
                <CustomTextField
                  fullWidth
                  label='From Date'
                  type='date'
                  value={dateFrom}
                  onChange={e => onDateFromChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <CustomTextField
                  fullWidth
                  label='To Date'
                  type='date'
                  value={dateTo}
                  onChange={e => onDateToChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} className='flex gap-2'>
                <Button variant='contained' onClick={onFilter}>Apply Filters</Button>
                <Button variant='tonal' onClick={() => { onSearchChange(''); onTypeChange(''); onStatusChange(''); onDateFromChange(''); onDateToChange(''); setTimeout(onFilter, 0) }}>Reset</Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>SSC / Assessor / TP</TableCell>
                    <TableCell>Scheme</TableCell>
                    <TableCell>Assessment Date</TableCell>
                    <TableCell>Candidates</TableCell>
                    <TableCell>Amount/Cand</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment Complete</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} align='center'>No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    data.map(row => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/invoice/invoices/${row.id}`)}
                      >
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>{row.invoice_number || `INV-${row.id}`}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip variant='tonal' size='small' label={typeLabels[row.type] || 'Unknown'} color='default' />
                        </TableCell>
                        <TableCell>{row.batch_name}</TableCell>
                        <TableCell>{row.ssc_name || row.assessor_name || row.tp_name || '-'}</TableCell>
                        <TableCell>{row.scheme || '-'}</TableCell>
                        <TableCell>{row.assessment_date ? new Date(row.assessment_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{row.total_candidate ?? '-'}{row.present_candidate != null ? ` / ${row.present_candidate}` : ''}</TableCell>
                        <TableCell>{row.amount_per_candidate ? Number(row.amount_per_candidate).toFixed(2) : '-'}</TableCell>
                        <TableCell>{Number(row.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={statusLabels[row.status] || 'Unknown'}
                            color={statusColors[row.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={row.status === 4 ? 'Yes' : 'No'}
                            color={row.status === 4 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={e => { e.stopPropagation(); router.push(`/invoice/invoices/${row.id}`) }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <div className='flex justify-center mt-4'>
                <Pagination
                  shape='rounded'
                  color='primary'
                  variant='tonal'
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => onPageChange(newPage)}
                  showFirstButton
                  showLastButton
                />
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default InvoicesList
