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

type SscInvoice = {
  id: number
  invoice_number: string
  batch_name: string
  ssc_name: string
  scheme: string
  assessment_date: string
  total_candidate: number
  present_candidate: number
  amount_per_candidate: number
  total_amount: number
  received_amount: number | null
  deduction_amount: number | null
  actual_received_amount: number | null
  difference_amount: number | null
  payment_status: string
}

type Props = {
  data: SscInvoice[]
  updateData: () => void
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (v: string) => void
  sscId: string
  onSscIdChange: (v: string) => void
  sscOptions: { id: number; ssc_name: string }[]
  paymentStatus: string
  onPaymentStatusChange: (v: string) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
  onFilter: () => void
}

const paymentStatusColors: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  received: 'success',
  pending: 'warning',
  partial: 'info',
  cancelled: 'error'
}

const SscInvoiceList = ({
  data, total, page, limit, onPageChange,
  search, onSearchChange, sscId, onSscIdChange, sscOptions,
  paymentStatus, onPaymentStatusChange,
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
            title='SSC Invoices'
            subheader='Manage SSC-wise invoices'
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => router.push('/invoice/ssc/create')}>
                New Invoice
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={4} className='mb-4'>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  select
                  fullWidth
                  label='SSC'
                  value={sscId}
                  onChange={e => { onSscIdChange(e.target.value); onFilter() }}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value=''>All SSC</MenuItem>
                  {sscOptions.map(s => (
                    <MenuItem key={s.id} value={String(s.id)}>{s.ssc_name}</MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  fullWidth
                  label='Search (Batch / SSC)'
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  select
                  fullWidth
                  label='Payment Status'
                  value={paymentStatus}
                  onChange={e => { onPaymentStatusChange(e.target.value); onFilter() }}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='received'>Received</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  fullWidth
                  label='From Date'
                  type='date'
                  value={dateFrom}
                  onChange={e => onDateFromChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
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
                <Button variant='tonal' onClick={() => { onSearchChange(''); onSscIdChange(''); onPaymentStatusChange(''); onDateFromChange(''); onDateToChange(''); setTimeout(onFilter, 0) }}>Reset</Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Batch</TableCell>
                      <TableCell>SSC</TableCell>
                      <TableCell>Scheme</TableCell>
                      <TableCell>Assessment Date</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Present</TableCell>
                      <TableCell>Amount/Candidate</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Received</TableCell>
                      <TableCell>Deduction</TableCell>
                      <TableCell>Actual Received</TableCell>
                      <TableCell>Difference</TableCell>
                      <TableCell>Payment Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} align='center'>No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    data.map(row => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/invoice/ssc/${row.id}`)}
                      >
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>{row.invoice_number || `SSC-INV-${row.id}`}</Typography>
                        </TableCell>
                        <TableCell>{row.batch_name}</TableCell>
                        <TableCell>{row.ssc_name}</TableCell>
                        <TableCell>{row.scheme || '-'}</TableCell>
                        <TableCell>{row.assessment_date ? new Date(row.assessment_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{row.total_candidate}</TableCell>
                        <TableCell>{row.present_candidate}</TableCell>
                        <TableCell>{Number(row.amount_per_candidate).toFixed(2)}</TableCell>
                        <TableCell>{Number(row.total_amount).toFixed(2)}</TableCell>
                        <TableCell>{row.received_amount ? Number(row.received_amount).toFixed(2) : '-'}</TableCell>
                        <TableCell>{row.deduction_amount ? Number(row.deduction_amount).toFixed(2) : '-'}</TableCell>
                        <TableCell>{row.actual_received_amount ? Number(row.actual_received_amount).toFixed(2) : '-'}</TableCell>
                        <TableCell>{row.difference_amount !== null && row.difference_amount !== undefined ? Number(row.difference_amount).toFixed(2) : '-'}</TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={row.payment_status ? row.payment_status.charAt(0).toUpperCase() + row.payment_status.slice(1) : 'Pending'}
                            color={paymentStatusColors[row.payment_status] || 'warning'}
                          />
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

export default SscInvoiceList
