'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import MenuItem from '@mui/material/MenuItem'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import { MenuProps } from '@/configs/customDataConfig'

type InvoiceData = {
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
  notes?: string
  group_photo?: string
  attendance_sheet?: string
  gst_amount?: number
  gst_percentage?: number
  invoice_pdf?: string
  signed_copy?: string
  payment_receipt?: string
}

type Payment = {
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

type Props = {
  data: InvoiceData | null
  updateData: () => void
  payments: Payment[]
  onRefreshPayments: () => void
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

const InvoiceDetail = ({ data, updateData, payments, onRefreshPayments, userRole = 'agency' }: Props) => {
  const router = useRouter()

  const [savingPayment, setSavingPayment] = useState(false)
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null)

  const [signedCopyFile, setSignedCopyFile] = useState<File | null>(null)
  const [uploadingSignedCopy, setUploadingSignedCopy] = useState(false)
  const [approving, setApproving] = useState(false)

  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null)
  const [uploadingPaymentReceipt, setUploadingPaymentReceipt] = useState(false)

  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payMode, setPayMode] = useState('')
  const [payTransactionNo, setPayTransactionNo] = useState('')
  const [payChequeDate, setPayChequeDate] = useState('')
  const [payBankName, setPayBankName] = useState('')
  const [paySlipFile, setPaySlipFile] = useState<File | null>(null)
  const [payRemarks, setPayRemarks] = useState('')
  const [payTdsAmount, setPayTdsAmount] = useState('')
  const [payAdvanceAmount, setPayAdvanceAmount] = useState('')
  const [payOtherDeduction, setPayOtherDeduction] = useState('')
  const [payAmountError, setPayAmountError] = useState('')

  if (!data) {
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography>Invoice not found</Typography>
              <Button variant='contained' onClick={() => router.back()} className='mt-4'>Go Back</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  const gstAmt = data.gst_percentage
    ? Number(data.total_amount) * Number(data.gst_percentage) / 100
    : (data.gst_amount ? Number(data.gst_amount) : 0)

  const netAmount = data.type === 3
    ? Number(data.total_amount) + gstAmt
    : Number(data.total_amount)

  const remainingAmount = netAmount - totalPaid

  const handleUploadSignedCopy = async () => {
    if (!signedCopyFile) {
      toast.error('Please select a file')

      return
    }

    setUploadingSignedCopy(true)

    try {
      const formData = new FormData()

      formData.append('invoice_id', String(data.id))
      formData.append('file_type', 'signed_copy')
      formData.append('file', signedCopyFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Signed copy uploaded')
        setSignedCopyFile(null)
        updateData()
      } else {
        toast.error(result.message || 'Failed to upload signed copy')
      }
    } catch {
      toast.error('Failed to upload signed copy')
    } finally {
      setUploadingSignedCopy(false)
    }
  }

  const handleAddPayment = async () => {
    if (!payAmount || !payDate || !payMode) {
      toast.error('Please enter amount, date and payment mode')

      return
    }

    if (payMode === 'cheque' && (!payTransactionNo || !payChequeDate || !payBankName)) {
      toast.error('Please fill all cheque details (cheque no, date, bank name)')

      return
    }

    if ((payMode === 'bank_transfer' || payMode === 'online') && !payTransactionNo) {
      toast.error('Please enter transaction number')

      return
    }

    if (Number(payAmount) > remainingAmount) {
      setPayAmountError(`Amount exceeds remaining balance of ${remainingAmount.toFixed(2)}`)

      return
    }

    setSavingPayment(true)

    try {
      let res: Response

      const commonData: Record<string, any> = {
        invoice_id: data.id,
        amount: Number(payAmount),
        payment_date: payDate,
        payment_mode: payMode || null,
        transaction_no: payTransactionNo || null,
        cheque_date: payChequeDate || null,
        bank_name: payBankName || null,
        remarks: payRemarks || null
      }

      commonData.tds_amount = Number(payTdsAmount) || 0
      commonData.other_deduction = Number(payOtherDeduction) || 0

      if (data.type === 2) {
        commonData.advance_amount = Number(payAdvanceAmount) || 0
      }

      if (paySlipFile) {
        const formData = new FormData()

        Object.entries(commonData).forEach(([key, val]) => formData.append(key, String(val)))
        formData.append('file', paySlipFile)

        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
          method: 'POST',
          body: formData
        })
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(commonData)
        })
      }

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Payment added')
        setPayAmount('')
        setPayAmountError('')
        setPayDate(new Date().toISOString().split('T')[0])
        setPayMode('')
        setPayTransactionNo('')
        setPayChequeDate('')
        setPayBankName('')
        setPaySlipFile(null)
        setPayRemarks('')
        setPayTdsAmount('')
        setPayAdvanceAmount('')
        setPayOtherDeduction('')
        onRefreshPayments()
        updateData()
      } else {
        toast.error(result.message || 'Failed to add payment')
      }
    } catch {
      toast.error('Failed to add payment')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDeletePayment = async (paymentId: number) => {
    setDeletingPaymentId(paymentId)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${paymentId}`, {
        method: 'DELETE'
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Payment deleted')
        onRefreshPayments()
        updateData()
      } else {
        toast.error(result.message || 'Failed to delete payment')
      }
    } catch {
      toast.error('Failed to delete payment')
    } finally {
      setDeletingPaymentId(null)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${data.id}`, {
        method: 'DELETE'
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Invoice deleted')
        router.push('/invoice/invoices')
      } else {
        toast.error(result.message || 'Failed to delete invoice')
      }
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const handleApproveReject = async (newStatus: number) => {
    setApproving(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success(newStatus === 2 ? 'Invoice approved' : 'Invoice rejected')
        updateData()
      } else {
        toast.error(result.message || 'Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setApproving(false)
    }
  }

  const handleUploadPaymentReceipt = async () => {
    if (!paymentReceiptFile) {
      toast.error('Please select a file')
      
return
    }

    setUploadingPaymentReceipt(true)

    try {
      const formData = new FormData()

      formData.append('invoice_id', String(data.id))
      formData.append('file_type', 'payment_receipt')
      formData.append('file', paymentReceiptFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Payment receipt uploaded')
        setPaymentReceiptFile(null)
        updateData()
      } else {
        toast.error(result.message || 'Failed to upload payment receipt')
      }
    } catch {
      toast.error('Failed to upload payment receipt')
    } finally {
      setUploadingPaymentReceipt(false)
    }
  }

  const entityName = data.type === 1
    ? data.ssc_name
    : data.type === 2
      ? data.assessor_name
      : data.tp_name

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Button variant='tonal' startIcon={<i className='tabler-arrow-left' />} onClick={() => router.back()} className='mb-4'>
          Back
        </Button>
      </Grid>
      <Grid item xs={12} md={7}>
        <Card>
          <CardHeader
            title={`Invoice #${data.invoice_number || `INV-${data.id}`}`}
            subheader={`Type: ${typeLabels[data.type] || 'Unknown'}`}
            action={
              <Chip
                variant='tonal'
                label={statusLabels[data.status] || 'Unknown'}
                color={statusColors[data.status] || 'default'}
              />
            }
          />
          <CardContent>
            {data.status === 4 && (
              <Typography variant='body2' color='success.main' className='mb-4 p-2' sx={{ bgcolor: 'success.light', borderRadius: 1 }}>
                Invoice is Paid — now read-only
              </Typography>
            )}
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Batch</Typography>
                <Typography variant='body2' className='font-medium'>{data.batch_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>
                  {data.type === 1 ? 'SSC' : data.type === 2 ? 'Assessor' : 'Training Partner'}
                </Typography>
                <Typography variant='body2' className='font-medium'>{entityName || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Scheme</Typography>
                <Typography variant='body2' className='font-medium'>{data.scheme || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Assessment Date</Typography>
                <Typography variant='body2' className='font-medium'>
                  {data.assessment_date ? new Date(data.assessment_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total Candidates</Typography>
                <Typography variant='body2' className='font-medium'>{data.total_candidate ?? '-'}</Typography>
              </Grid>
              {(data.type === 1 || data.type === 2) && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Present Candidates</Typography>
                  <Typography variant='body2' className='font-medium'>{data.present_candidate ?? '-'}</Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Amount Per Candidate</Typography>
                <Typography variant='body2' className='font-medium'>{data.amount_per_candidate ? Number(data.amount_per_candidate).toFixed(2) : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total Amount (Base)</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.total_amount).toFixed(2)}</Typography>
              </Grid>
              {data.type === 3 && gstAmt > 0 && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>GST ({data.gst_percentage || 0}%)</Typography>
                  <Typography variant='body2' className='font-medium'>{gstAmt.toFixed(2)}</Typography>
                </Grid>
              )}
              {data.type === 3 && gstAmt > 0 && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Actual Total (+GST)</Typography>
                  <Typography variant='body2' className='font-medium'>{(Number(data.total_amount) + gstAmt).toFixed(2)}</Typography>
                </Grid>
              )}
              {data.type === 3 && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Net Invoice Amount</Typography>
                  <Typography variant='body2' className='font-medium'>{(Number(data.total_amount) + gstAmt).toFixed(2)}</Typography>
                </Grid>
              )}
              {data.notes && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Notes</Typography>
                  <Typography variant='body2'>{data.notes}</Typography>
                </Grid>
              )}
              {data.type === 1 && data.group_photo && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Group Photo</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={'/' + data.group_photo} target='_blank'>
                    View Photo
                  </Button>
                </Grid>
              )}
              {data.type === 1 && data.attendance_sheet && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Attendance Sheet</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={'/' + data.attendance_sheet} target='_blank'>
                    View Sheet
                  </Button>
                </Grid>
              )}
              {data.type === 2 && data.invoice_pdf && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Invoice PDF</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={'/' + data.invoice_pdf} target='_blank'>
                    View Invoice
                  </Button>
                </Grid>
              )}
              {data.type === 2 && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Signed Copy</Typography>
                  <br />
                  {data.signed_copy && (
                    <Button variant='text' size='small' component='a' href={'/' + data.signed_copy} target='_blank' className='mr-2'>
                      View Signed Copy
                    </Button>
                  )}
                  {userRole === 'assessor' && (
                    <div className='flex items-center gap-2 mt-2'>
                      <input type='file' accept='.pdf,image/*' onChange={e => setSignedCopyFile(e.target.files?.[0] || null)} />
                      <Button
                        variant='contained'
                        size='small'
                        onClick={handleUploadSignedCopy}
                        disabled={!signedCopyFile || uploadingSignedCopy}
                        startIcon={uploadingSignedCopy ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-upload' />}
                      >
                        Upload
                      </Button>
                    </div>
                  )}
                  {signedCopyFile && <Typography variant='caption'>{signedCopyFile.name}</Typography>}
                </Grid>
              )}
              {data.type === 3 && data.invoice_pdf && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Invoice PDF</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={'/' + data.invoice_pdf} target='_blank'>
                    View Invoice
                  </Button>
                </Grid>
              )}
              {data.type === 3 && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Payment Receipt</Typography>
                  <br />
                  {data.payment_receipt && (
                    <Button variant='text' size='small' component='a' href={'/' + data.payment_receipt} target='_blank' className='mr-2'>
                      View Receipt
                    </Button>
                  )}
                  {userRole === 'tp' && (
                    <div className='flex items-center gap-2 mt-2'>
                      <input type='file' accept='.pdf,image/*' onChange={e => setPaymentReceiptFile(e.target.files?.[0] || null)} />
                      <Button
                        variant='contained'
                        size='small'
                        onClick={handleUploadPaymentReceipt}
                        disabled={!paymentReceiptFile || uploadingPaymentReceipt}
                        startIcon={uploadingPaymentReceipt ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-upload' />}
                      >
                        Upload
                      </Button>
                    </div>
                  )}
                  {paymentReceiptFile && <Typography variant='caption'>{paymentReceiptFile.name}</Typography>}
                </Grid>
              )}
            </Grid>
            <Divider className='my-4' />
            <Typography variant='caption' color='text.secondary'>System Generated Invoice</Typography>
            <br />
            <Button variant='outlined' size='small' component='a' href={`/api/invoices/${data.id}/pdf`} target='_blank' startIcon={<i className='tabler-download' />}>
              Download Invoice PDF
            </Button>
            {data.status !== 4 && userRole !== 'assessor' && (
              <Divider className='my-4' />
            )}
            {data.status !== 4 && userRole !== 'assessor' && (
              <div className='flex gap-4 flex-wrap'>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<i className='tabler-edit' />}
                  onClick={() => router.push(`/invoice/invoices/${data.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant='tonal'
                  color='error'
                  startIcon={<i className='tabler-trash' />}
                  onClick={handleDeleteInvoice}
                >
                  Delete
                </Button>
              </div>
            )}
            {userRole === 'agency' && data.type === 2 && (data.status === 1 || data.status === 5) && (
              <div className='flex gap-4 mt-4'>
                <Button
                  variant='contained'
                  color='success'
                  onClick={() => handleApproveReject(2)}
                  disabled={approving}
                  startIcon={approving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-check' />}
                >
                  Approve
                </Button>
                <Button
                  variant='tonal'
                  color='error'
                  onClick={() => handleApproveReject(3)}
                  disabled={approving}
                >
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card>
          <CardHeader title='Payment History' />
          <CardContent>
            <>
              <Grid container spacing={2} className='mb-4'>
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Invoice Total</Typography>
                  <Typography variant='body2' className='font-medium'>
                    {data.type === 3
                      ? (Number(data.total_amount) + gstAmt).toFixed(2)
                      : Number(data.total_amount).toFixed(2)}
                  </Typography>
                </Grid>
                {data.type === 3 && gstAmt > 0 && (
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>GST ({data.gst_percentage || 0}%)</Typography>
                    <Typography variant='body2' className='font-medium'>{gstAmt.toFixed(2)}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Net Invoice Amount</Typography>
                  <Typography variant='body2' className='font-medium'>{netAmount.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Received Amount</Typography>
                  <Typography variant='body2' className='font-medium' color='success.main'>{totalPaid.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Balance Due</Typography>
                  <Typography variant='body2' className='font-medium' color={remainingAmount > 0 ? 'error' : 'success'}>
                    {remainingAmount.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
              <Divider className='my-3' />
            </>

            <TableContainer component={Paper}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>TDS</TableCell>
                    {data.type === 2 && <TableCell>Advance</TableCell>}
                    <TableCell>Other Ded.</TableCell>
                    <TableCell>Net Paid</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Ref No</TableCell>
                    <TableCell>Bank</TableCell>
                    <TableCell>Slip</TableCell>
                    <TableCell>Remarks</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11 + (data.type === 2 ? 1 : 0)} align='center'>No payments recorded</TableCell>
                    </TableRow>
                  ) : (
                    payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</TableCell>
                        <TableCell>{Number(p.amount).toFixed(2)}</TableCell>
                        <TableCell>{Number(p.tds_amount || 0).toFixed(2)}</TableCell>
                        {data.type === 2 && <TableCell>{Number(p.advance_amount || 0).toFixed(2)}</TableCell>}
                        <TableCell>{Number(p.other_deduction || 0).toFixed(2)}</TableCell>
                        <TableCell>{Number(Number(p.amount) - Number(p.tds_amount || 0) - (data.type === 2 ? Number(p.advance_amount || 0) : 0) - Number(p.other_deduction || 0)).toFixed(2)}</TableCell>
                        <TableCell>{p.payment_mode || '-'}</TableCell>
                        <TableCell>
                          {p.payment_mode === 'cheque'
                            ? (p.transaction_no ? `Cheque #${p.transaction_no}` : '-')
                            : p.transaction_no || '-'}
                        </TableCell>
                        <TableCell>{p.bank_name || '-'}</TableCell>
                        <TableCell>
                          {p.transaction_slip ? (
                            <Button variant='text' size='small' component='a' href={'/' + p.transaction_slip} target='_blank'>
                              View
                            </Button>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{p.remarks || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size='small'
                            color='error'
                            variant='text'
                            disabled={deletingPaymentId === p.id}
                            startIcon={deletingPaymentId === p.id ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-trash' />}
                            onClick={() => handleDeletePayment(p.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {data.status !== 4 && userRole !== 'assessor' && (
              <>
                <Divider className='my-4' />
                <Typography variant='subtitle2' className='mb-3'>Add Payment</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <CustomTextField
                      fullWidth
                      label='Amount *'
                      type='number'
                      size='small'
                      value={payAmount}
                      error={!!payAmountError}
                      helperText={payAmountError || ' '}
                      onChange={e => {
                        setPayAmount(e.target.value)
                        setPayAmountError('')
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <CustomTextField
                      fullWidth
                      label='Date *'
                      type='date'
                      size='small'
                      value={payDate}
                      onChange={e => setPayDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: new Date().toISOString().split('T')[0] }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Payment Mode'
                      size='small'
                      value={payMode}
                      onChange={e => {
                        setPayMode(e.target.value)
                        setPayTransactionNo('')
                        setPayChequeDate('')
                        setPayBankName('')
                      }}
                      SelectProps={{ MenuProps, displayEmpty: true }}
                    >
                      <MenuItem value=''>Select</MenuItem>
                      <MenuItem value='cash'>Cash</MenuItem>
                      <MenuItem value='cheque'>Cheque</MenuItem>
                      <MenuItem value='bank_transfer'>Bank Transfer</MenuItem>
                      <MenuItem value='online'>Online</MenuItem>
                    </CustomTextField>
                  </Grid>
                  {payMode === 'cheque' && (
                    <Grid item xs={6}>
                      <CustomTextField
                        fullWidth
                        label='Cheque No. *'
                        size='small'
                        value={payTransactionNo}
                        onChange={e => setPayTransactionNo(e.target.value)}
                      />
                    </Grid>
                  )}
                  {payMode === 'cheque' && (
                    <Grid item xs={6}>
                      <CustomTextField
                        fullWidth
                        label='Cheque Date *'
                        type='date'
                        size='small'
                        value={payChequeDate}
                        onChange={e => setPayChequeDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  )}
                  {payMode === 'cheque' && (
                    <Grid item xs={6}>
                      <CustomTextField
                        fullWidth
                        label='Bank Name *'
                        size='small'
                        value={payBankName}
                        onChange={e => setPayBankName(e.target.value)}
                      />
                    </Grid>
                  )}
                  {(payMode === 'bank_transfer' || payMode === 'online') && (
                    <Grid item xs={6}>
                      <CustomTextField
                        fullWidth
                        label='Transaction No. *'
                        size='small'
                        value={payTransactionNo}
                        onChange={e => setPayTransactionNo(e.target.value)}
                      />
                    </Grid>
                  )}
                  {payMode === 'bank_transfer' && (
                    <Grid item xs={6}>
                      <CustomTextField
                        fullWidth
                        label='Bank Name'
                        size='small'
                        value={payBankName}
                        onChange={e => setPayBankName(e.target.value)}
                      />
                    </Grid>
                  )}
                  {(payMode === 'bank_transfer' || payMode === 'online') && (
                    <Grid item xs={12}>
                      <Typography variant='body2' color='text.secondary' className='mb-1'>
                        Transaction Slip (image/pdf)
                      </Typography>
                      <input type='file' accept='image/*,application/pdf' onChange={e => setPaySlipFile(e.target.files?.[0] || null)} />
                      {paySlipFile && <Typography variant='caption'>{paySlipFile.name}</Typography>}
                    </Grid>
                  )}
                  <Grid item xs={4}>
                    <CustomTextField
                      fullWidth
                      label='TDS Amount'
                      type='number'
                      size='small'
                      value={payTdsAmount}
                      onChange={e => setPayTdsAmount(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <CustomTextField
                      fullWidth
                      label='Other Deduction'
                      type='number'
                      size='small'
                      value={payOtherDeduction}
                      onChange={e => setPayOtherDeduction(e.target.value)}
                    />
                  </Grid>
                  {data.type === 2 && (
                    <Grid item xs={4}>
                      <CustomTextField
                        fullWidth
                        label='Advance Amount'
                        type='number'
                        size='small'
                        value={payAdvanceAmount}
                        onChange={e => setPayAdvanceAmount(e.target.value)}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <CustomTextField
                      fullWidth
                      label='Remarks'
                      size='small'
                      value={payRemarks}
                      onChange={e => setPayRemarks(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant='contained'
                      onClick={handleAddPayment}
                      disabled={savingPayment}
                      startIcon={savingPayment ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-plus' />}
                    >
                      Add Payment
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default InvoiceDetail
