'use client'

import { useEffect, useState, useMemo } from 'react'
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
import MenuItem from '@mui/material/MenuItem'

import CustomTextField from '@core/components/mui/TextField'
import { MenuProps } from '@/configs/customDataConfig'

type SscInvoice = {
  id: number
  invoice_number: string
  batch_name: string
  ssc_name: string
  assessment_date: string
  total_candidates: number
  present_candidates: number
  amount_per_candidate: number
  total_amount: number
  payment_status: string
}

type Props = {
  data: SscInvoice[]
  updateData: () => void
}

const paymentStatusColors: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  received: 'success',
  pending: 'warning',
  partial: 'info',
  cancelled: 'error'
}

const SscInvoiceList = ({ data, updateData }: Props) => {
  const router = useRouter()
  const [sscFilter, setSscFilter] = useState('-1')
  const [paymentFilter, setPaymentFilter] = useState('-1')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const sscNames = useMemo(() => {
    const names = new Set(data.map(d => d.ssc_name).filter(Boolean))

    return Array.from(names)
  }, [data])

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (sscFilter !== '-1' && item.ssc_name !== sscFilter) return false
      if (paymentFilter !== '-1' && item.payment_status !== paymentFilter) return false
      if (dateFrom && item.assessment_date && new Date(item.assessment_date) < new Date(dateFrom)) return false
      if (dateTo && item.assessment_date && new Date(item.assessment_date) > new Date(dateTo)) return false

      return true
    })
  }, [data, sscFilter, paymentFilter, dateFrom, dateTo])

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
                  value={sscFilter}
                  onChange={e => setSscFilter(e.target.value)}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value='-1'>All SSC</MenuItem>
                  {sscNames.map(name => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  select
                  fullWidth
                  label='Payment Status'
                  value={paymentFilter}
                  onChange={e => setPaymentFilter(e.target.value)}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value='-1'>All Status</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='received'>Received</MenuItem>
                  <MenuItem value='partial'>Partial</MenuItem>
                  <MenuItem value='cancelled'>Cancelled</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  fullWidth
                  label='From Date'
                  type='date'
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <CustomTextField
                  fullWidth
                  label='To Date'
                  type='date'
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>SSC</TableCell>
                    <TableCell>Assessment Date</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Present</TableCell>
                    <TableCell>Amount/Candidate</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align='center'>No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map(row => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/invoice/ssc/${row.id}`)}
                      >
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>{row.invoice_number}</Typography>
                        </TableCell>
                        <TableCell>{row.batch_name}</TableCell>
                        <TableCell>{row.ssc_name}</TableCell>
                        <TableCell>{row.assessment_date ? new Date(row.assessment_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{row.total_candidates}</TableCell>
                        <TableCell>{row.present_candidates}</TableCell>
                        <TableCell>{Number(row.amount_per_candidate).toFixed(2)}</TableCell>
                        <TableCell>{Number(row.total_amount).toFixed(2)}</TableCell>
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
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default SscInvoiceList
