'use client'

import { useState, useRef } from 'react'
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

import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'

type AssessorInvoice = {
  id: number
  invoice_number: string
  batch_name: string
  ssc_name: string
  assessor_name: string
  scheme_name: string
  assessment_date: string
  total_candidates: number
  present_candidates: number
  amount_per_candidate: number
  total_amount: number
  invoice_status: string
  amount_status: string
  advance_amount: number
  tds_amount: number
  other_deduction: number
  net_amount: number
  transaction_no: string
  transaction_slip_path: string
  signed_copy_path: string
}

type Props = {
  data: AssessorInvoice | null
  updateData: () => void
}

const AssessorInvoiceDetail = ({ data, updateData }: Props) => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const signedCopyRef = useRef<HTMLInputElement>(null)
  const transactionSlipRef = useRef<HTMLInputElement>(null)

  const [advanceAmount, setAdvanceAmount] = useState(data?.advance_amount?.toString() || '')
  const [tdsAmount, setTdsAmount] = useState(data?.tds_amount?.toString() || '')
  const [otherDeduction, setOtherDeduction] = useState(data?.other_deduction?.toString() || '')
  const [transactionNo, setTransactionNo] = useState(data?.transaction_no || '')

  const netAmount = Number(data?.total_amount || 0) - Number(advanceAmount || 0) - Number(tdsAmount || 0) - Number(otherDeduction || 0)

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

  const handleApproveReject = async (newStatus: 'approved' | 'rejected') => {
    setSaving(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/assessor/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_status: newStatus })
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success(`Invoice ${newStatus} successfully`)
        updateData()
      } else {
        toast.error(result.message || `Failed to ${newStatus} invoice`)
      }
    } catch {
      toast.error(`Failed to ${newStatus} invoice`)
    } finally {
      setSaving(false)
    }
  }

  const handleUploadSignedCopy = async () => {
    if (!signedCopyRef.current?.files?.[0]) {
      toast.error('Please select a file')

      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('signed_copy', signedCopyRef.current.files[0])

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/assessor/${data.id}/upload-signed-copy`, {
        method: 'POST',
        body: formData
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Signed copy uploaded')
        updateData()
      } else {
        toast.error(result.message || 'Failed to upload signed copy')
      }
    } catch {
      toast.error('Failed to upload signed copy')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePayment = async () => {
    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('advance_amount', advanceAmount || '0')
      formData.append('tds_amount', tdsAmount || '0')
      formData.append('other_deduction', otherDeduction || '0')
      formData.append('net_amount', netAmount.toString())
      formData.append('transaction_no', transactionNo || '')
      formData.append('amount_status', 'paid')
      if (transactionSlipRef.current?.files?.[0]) {
        formData.append('transaction_slip', transactionSlipRef.current.files[0])
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/assessor/${data.id}`, {
        method: 'PUT',
        body: formData
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Payment details saved')
        updateData()
      } else {
        toast.error(result.message || 'Failed to save payment')
      }
    } catch {
      toast.error('Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

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
            title={`Invoice #${data.invoice_number}`}
            action={
              <Chip
                variant='tonal'
                label={data.invoice_status ? data.invoice_status.charAt(0).toUpperCase() + data.invoice_status.slice(1) : 'Draft'}
                color={
                  data.invoice_status === 'approved' ? 'success' :
                  data.invoice_status === 'rejected' ? 'error' :
                  data.invoice_status === 'draft' ? 'default' : 'warning'
                }
              />
            }
          />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Batch</Typography>
                <Typography variant='body2' className='font-medium'>{data.batch_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>SSC</Typography>
                <Typography variant='body2' className='font-medium'>{data.ssc_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Assessor</Typography>
                <Typography variant='body2' className='font-medium'>{data.assessor_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Scheme</Typography>
                <Typography variant='body2' className='font-medium'>{data.scheme_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Assessment Date</Typography>
                <Typography variant='body2' className='font-medium'>
                  {data.assessment_date ? new Date(data.assessment_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total / Present</Typography>
                <Typography variant='body2' className='font-medium'>{data.total_candidates} / {data.present_candidates}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Amount Per Candidate</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.amount_per_candidate).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total Amount</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.total_amount).toFixed(2)}</Typography>
              </Grid>
              {data.signed_copy_path && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Signed Copy</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={data.signed_copy_path} target='_blank'>
                    View Signed Copy
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        {data.invoice_status === 'draft' && (
          <Card className='mb-6'>
            <CardHeader title='Signed Copy' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  {/* TODO: Implement file upload to S3/local storage */}
                  <input type='file' ref={signedCopyRef} accept='.pdf,image/*' />
                </Grid>
                <Grid item xs={12} className='flex gap-4'>
                  <Button variant='contained' onClick={handleUploadSignedCopy} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-upload' />}>
                    Upload
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant='contained'
                    color='success'
                    onClick={() => handleApproveReject('approved')}
                    disabled={saving}
                  >
                    Approve
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant='contained'
                    color='error'
                    onClick={() => handleApproveReject('rejected')}
                    disabled={saving}
                  >
                    Reject
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        {data.invoice_status === 'approved' && (
          <Card>
            <CardHeader title='Payment' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    label='Advance Amount'
                    type='number'
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    label='TDS Amount'
                    type='number'
                    value={tdsAmount}
                    onChange={e => setTdsAmount(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    label='Other Deduction'
                    type='number'
                    value={otherDeduction}
                    onChange={e => setOtherDeduction(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Net Amount</Typography>
                  <Typography variant='h6' className='font-medium'>{netAmount.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    label='Transaction No'
                    value={transactionNo}
                    onChange={e => setTransactionNo(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='body2' color='text.secondary' className='mb-2'>
                    Transaction Slip
                  </Typography>
                  {/* TODO: Implement file upload to S3/local storage */}
                  <input type='file' ref={transactionSlipRef} accept='.pdf,image/*' />
                </Grid>
                {data.transaction_slip_path && (
                  <Grid item xs={12}>
                    <Button variant='text' size='small' component='a' href={data.transaction_slip_path} target='_blank'>
                      View Transaction Slip
                    </Button>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button variant='contained' fullWidth onClick={handleSavePayment} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-device-floppy' />}>
                    Save Payment
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  )
}

export default AssessorInvoiceDetail
