'use client'

import { useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import type { TextFieldProps } from '@mui/material/TextField'
import { toast } from 'react-toastify'

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
  hideCreate?: boolean
  detailPath?: string
  userRole?: string
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
  4: 'Paid',
  5: 'Partial Paid'
}

const statusColors: Record<number, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  0: 'default',
  1: 'warning',
  2: 'info',
  3: 'error',
  4: 'success',
  5: 'info'
}

type PaymentRecord = {
  id: number
  amount: number
  tds_amount?: number
  advance_amount?: number
  other_deduction?: number
  payment_date: string
  payment_mode: string
  transaction_no: string
  cheque_date?: string
  bank_name?: string
  transaction_slip?: string
  remarks: string
}

const InvoicesList = ({
  data, total, page, limit, onPageChange,
  search, onSearchChange, type, onTypeChange,
  status, onStatusChange,
  dateFrom, onDateFromChange, dateTo, onDateToChange, onFilter,
  updateData,
  hideCreate = false,
  detailPath = '/invoice/invoices/',
  userRole
}: Props) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const totalPages = Math.ceil(total / limit)

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedInvoiceForPayments, setSelectedInvoiceForPayments] = useState<InvoiceRow | null>(null)
  const [paymentsData, setPaymentsData] = useState<PaymentRecord[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  const openPaymentDialog = async (row: InvoiceRow) => {
    setSelectedInvoiceForPayments(row)
    setPaymentDialogOpen(true)
    setLoadingPayments(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments?invoice_id=${row.id}`)
      const result = await res.json()

      if (result.status === 'Success') {
        setPaymentsData(result.data || [])
      } else {
        setPaymentsData([])
      }
    } catch {
      setPaymentsData([])
    } finally {
      setLoadingPayments(false)
    }
  }

  const [signedUploadDialogOpen, setSignedUploadDialogOpen] = useState(false)
  const [selectedRowForUpload, setSelectedRowForUpload] = useState<InvoiceRow | null>(null)
  const [signedUploadFile, setSignedUploadFile] = useState<File | null>(null)
  const [signedUploadLoading, setSignedUploadLoading] = useState(false)

  const openSignedUploadDialog = (row: InvoiceRow) => {
    setSelectedRowForUpload(row)
    setSignedUploadFile(null)
    setSignedUploadDialogOpen(true)
  }

  const handleSignedUpload = async () => {
    if (!signedUploadFile || !selectedRowForUpload) {
      toast.error('Please select a file')

      return
    }

    setSignedUploadLoading(true)

    try {
      const formData = new FormData()

      formData.append('invoice_id', String(selectedRowForUpload.id))
      formData.append('file_type', 'signed_copy')
      formData.append('file', signedUploadFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Signed copy uploaded')
        setSignedUploadDialogOpen(false)
        setSignedUploadFile(null)
        updateData()
      } else {
        toast.error(result.message || 'Failed to upload signed copy')
      }
    } catch {
      toast.error('Failed to upload signed copy')
    } finally {
      setSignedUploadLoading(false)
    }
  }

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
            action={!hideCreate && (
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => router.push('/invoice/invoices/create')}>
                New Invoice
              </Button>
            )}
          />
          <CardContent>
            <Grid container spacing={4} className='mb-4'>
              {userRole !== 'assessor' && (
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
              )}
              <Grid item xs={12} sm={userRole === 'assessor' ? 4 : 3}>
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
                      <TableRow key={row.id} hover sx={{ cursor: userRole === 'assessor' ? 'default' : 'pointer' }}>
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
                          {userRole === 'assessor' ? (
                            <div className='flex gap-2'>
                              <Button
                                size='small'
                                variant='outlined'
                                component='a'
                                href={`/api/invoices/${row.id}/pdf`}
                                target='_blank'
                                startIcon={<i className='tabler-download' />}
                              >
                                Download
                              </Button>
                              <Button
                                size='small'
                                variant='tonal'
                                color='warning'
                                onClick={() => openSignedUploadDialog(row)}
                                startIcon={<i className='tabler-upload' />}
                              >
                                Upload Signed
                              </Button>
                              <Button
                                size='small'
                                variant='tonal'
                                color='info'
                                onClick={() => openPaymentDialog(row)}
                                startIcon={<i className='tabler-coin' />}
                              >
                                Payments
                              </Button>
                            </div>
                          ) : (
                            <div className='flex gap-2'>
                              <Button
                                size='small'
                                variant='outlined'
                                onClick={e => { e.stopPropagation(); router.push(`/${locale}${detailPath}${row.id}`) }}
                              >
                                View
                              </Button>
                              <Button
                                size='small'
                                variant='tonal'
                                color='info'
                                onClick={e => { e.stopPropagation(); openPaymentDialog(row) }}
                                startIcon={<i className='tabler-coin' />}
                              >
                                Payments
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {total > 0 && (
              <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
                <Typography color='text.disabled'>
                  Showing {data.length === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
                </Typography>
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

      <Dialog open={signedUploadDialogOpen} onClose={() => setSignedUploadDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          Upload Signed Copy — {selectedRowForUpload?.invoice_number || `INV-${selectedRowForUpload?.id}`}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' className='mb-3'>
            Upload a signed copy of this invoice (PDF or image).
          </Typography>
          <input type='file' accept='.pdf,image/*' onChange={e => setSignedUploadFile(e.target.files?.[0] || null)} />
          {signedUploadFile && <Typography variant='caption' className='ml-2'>{signedUploadFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button variant='tonal' onClick={() => setSignedUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleSignedUpload}
            disabled={!signedUploadFile || signedUploadLoading}
            startIcon={signedUploadLoading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-upload' />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>Payments — {selectedInvoiceForPayments?.invoice_number || `INV-${selectedInvoiceForPayments?.id}`}</span>
          <IconButton onClick={() => setPaymentDialogOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingPayments ? (
            <div className='flex justify-center py-8'><CircularProgress /></div>
          ) : paymentsData.length === 0 ? (
            <Typography color='text.secondary' className='py-4 text-center'>No payments recorded</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>TDS</TableCell>
                    {selectedInvoiceForPayments?.type === 2 && <TableCell>Advance</TableCell>}
                    <TableCell>Other Ded.</TableCell>
                    <TableCell>Net Paid</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Ref No</TableCell>
                    <TableCell>Bank</TableCell>
                    <TableCell>Slip</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentsData.map(p => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</TableCell>
                      <TableCell>{Number(p.amount).toFixed(2)}</TableCell>
                      <TableCell>{Number(p.tds_amount || 0).toFixed(2)}</TableCell>
                      {selectedInvoiceForPayments?.type === 2 && <TableCell>{Number(p.advance_amount || 0).toFixed(2)}</TableCell>}
                      <TableCell>{Number(p.other_deduction || 0).toFixed(2)}</TableCell>
                      <TableCell>{Number(Number(p.amount) - Number(p.tds_amount || 0) - (selectedInvoiceForPayments?.type === 2 ? Number(p.advance_amount || 0) : 0) - Number(p.other_deduction || 0)).toFixed(2)}</TableCell>
                      <TableCell>{p.payment_mode || '-'}</TableCell>
                      <TableCell>
                        {p.payment_mode === 'cheque'
                          ? (p.transaction_no ? `Cheque #${p.transaction_no}` : '-')
                          : p.transaction_no || '-'}
                      </TableCell>
                      <TableCell>{p.bank_name || '-'}</TableCell>
                      <TableCell>
                        {p.transaction_slip ? (
                          <Button variant='text' size='small' component='a' href={'/' + p.transaction_slip} target='_blank'>View</Button>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{p.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  )
}

export default InvoicesList
