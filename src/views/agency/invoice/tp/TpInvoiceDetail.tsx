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

import { toast } from 'react-toastify'

type TpInvoice = {
  id: number
  invoice_number: string
  batch_name: string
  tp_name: string
  scheme_name: string
  total_candidates: number
  amount_per_candidate: number
  total_amount: number
  gst_amount: number
  invoice_status: string
  payment_status: string
  invoice_pdf_path: string
  payment_receipt_path: string
}

type Props = {
  data: TpInvoice | null
  updateData: () => void
}

const TpInvoiceDetail = ({ data, updateData }: Props) => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const receiptRef = useRef<HTMLInputElement>(null)

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

  const handleMarkAsShared = async () => {
    setSaving(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/tp/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_status: 'shared' })
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Invoice marked as shared')
        updateData()
      } else {
        toast.error(result.message || 'Failed to update invoice')
      }
    } catch {
      toast.error('Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaymentReceived = async () => {
    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('payment_status', 'received')
      if (receiptRef.current?.files?.[0]) {
        formData.append('payment_receipt', receiptRef.current.files[0])
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/tp/${data.id}`, {
        method: 'PUT',
        body: formData
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Payment marked as received')
        updateData()
      } else {
        toast.error(result.message || 'Failed to update payment')
      }
    } catch {
      toast.error('Failed to update payment')
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
                color={data.invoice_status === 'shared' ? 'info' : 'default'}
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
                <Typography variant='caption' color='text.secondary'>Training Partner</Typography>
                <Typography variant='body2' className='font-medium'>{data.tp_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Scheme</Typography>
                <Typography variant='body2' className='font-medium'>{data.scheme_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total Candidates</Typography>
                <Typography variant='body2' className='font-medium'>{data.total_candidates}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Amount Per Candidate</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.amount_per_candidate).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total Amount</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.total_amount).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>GST Amount</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.gst_amount).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Payment Status</Typography>
                <br />
                <Chip
                  variant='tonal'
                  size='small'
                  label={data.payment_status ? data.payment_status.charAt(0).toUpperCase() + data.payment_status.slice(1) : 'Pending'}
                  color={data.payment_status === 'received' ? 'success' : 'warning'}
                />
              </Grid>
              {data.invoice_pdf_path && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Invoice PDF</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={data.invoice_pdf_path} target='_blank'>
                    View Invoice PDF
                  </Button>
                </Grid>
              )}
              {data.payment_receipt_path && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Payment Receipt</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={data.payment_receipt_path} target='_blank'>
                    View Receipt
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card className='mb-6'>
          <CardHeader title='Actions' />
          <CardContent>
            <Grid container spacing={4}>
              {data.invoice_status !== 'shared' && (
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant='contained'
                    color='info'
                    onClick={handleMarkAsShared}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-send' />}
                  >
                    Mark as Shared
                  </Button>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary' className='mb-2'>
                  Payment Receipt (uploaded by TP)
                </Typography>
                {/* TODO: Implement file upload to S3/local storage */}
                <input type='file' ref={receiptRef} accept='.pdf,image/*' />
              </Grid>
              {data.payment_status !== 'received' && (
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant='contained'
                    color='success'
                    onClick={handleMarkPaymentReceived}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-check' />}
                  >
                    Mark Payment Received
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TpInvoiceDetail
