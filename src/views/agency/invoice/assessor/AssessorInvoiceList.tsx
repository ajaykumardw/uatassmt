'use client'

import { useEffect, useState } from 'react'
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

type AssessorInvoice = {
  id: number
  invoice_number: string
  batch_name: string
  ssc_name: string
  assessor_name: string
  total_candidates: number
  present_candidates: number
  amount_per_candidate: number
  total_amount: number
  invoice_status: string
  amount_status: string
}

type Props = {
  data: AssessorInvoice[]
  updateData: () => void
}

const invoiceStatusColors: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
}

const amountStatusColors: Record<string, 'default' | 'success' | 'warning'> = {
  unpaid: 'default',
  paid: 'success',
  partial: 'warning'
}

const AssessorInvoiceList = ({ data, updateData }: Props) => {
  const router = useRouter()
  const [assessorFilter, setAssessorFilter] = useState('-1')
  const [statusFilter, setStatusFilter] = useState('-1')

  const assessorNames = [...new Set(data.map(d => d.assessor_name).filter(Boolean))]

  const filteredData = data.filter(item => {
    if (assessorFilter !== '-1' && item.assessor_name !== assessorFilter) return false
    if (statusFilter !== '-1' && item.invoice_status !== statusFilter) return false

    return true
  })

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Assessor Invoices'
            subheader='Manage assessor-wise invoices'
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => router.push('/invoice/assessor/create')}>
                New Invoice
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={4} className='mb-4'>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  select
                  fullWidth
                  label='Assessor'
                  value={assessorFilter}
                  onChange={e => setAssessorFilter(e.target.value)}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value='-1'>All Assessors</MenuItem>
                  {assessorNames.map(name => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  select
                  fullWidth
                  label='Invoice Status'
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  SelectProps={{ MenuProps, displayEmpty: true }}
                >
                  <MenuItem value='-1'>All Status</MenuItem>
                  <MenuItem value='draft'>Draft</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='approved'>Approved</MenuItem>
                  <MenuItem value='rejected'>Rejected</MenuItem>
                </CustomTextField>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>SSC</TableCell>
                    <TableCell>Assessor</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Present</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align='center'>No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map(row => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/invoice/assessor/${row.id}`)}
                      >
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>{row.invoice_number}</Typography>
                        </TableCell>
                        <TableCell>{row.batch_name}</TableCell>
                        <TableCell>{row.ssc_name}</TableCell>
                        <TableCell>{row.assessor_name}</TableCell>
                        <TableCell>{row.total_candidates}</TableCell>
                        <TableCell>{row.present_candidates}</TableCell>
                        <TableCell>{Number(row.amount_per_candidate).toFixed(2)}</TableCell>
                        <TableCell>{Number(row.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={row.invoice_status ? row.invoice_status.charAt(0).toUpperCase() + row.invoice_status.slice(1) : 'Draft'}
                            color={invoiceStatusColors[row.invoice_status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={row.amount_status ? row.amount_status.charAt(0).toUpperCase() + row.amount_status.slice(1) : 'Unpaid'}
                            color={amountStatusColors[row.amount_status] || 'default'}
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

export default AssessorInvoiceList
