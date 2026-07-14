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
import MenuItem from '@mui/material/MenuItem'

import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'
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
  payment_status: string
  received_amount: number
  deduction_amount: number
  actual_received_amount: number
  difference_amount: number
  group_photo: string
  attendance_sheet: string
  notes: string
}

type Props = {
  data: SscInvoice | null
  updateData: () => void
}

const SscInvoiceDetail = ({ data, updateData }: Props) => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(data?.payment_status || 'pending')
  const [receivedAmount, setReceivedAmount] = useState(data?.received_amount?.toString() || '')
  const [deductionAmount, setDeductionAmount] = useState(data?.deduction_amount?.toString() || '')

  const actualReceived = Number(receivedAmount) - Number(deductionAmount) || 0
  const difference = data ? Number(data.total_amount) - actualReceived : 0

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

  const handleSavePayment = async () => {
    setSaving(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/ssc/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: paymentStatus,
          received_amount: Number(receivedAmount) || 0,
          deduction_amount: Number(deductionAmount) || 0,
          actual_received_amount: actualReceived,
          difference_amount: difference
        })
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Payment details updated')
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
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title={`Invoice #${data.invoice_number || `SSC-INV-${data.id}`}`} />
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
                <Typography variant='caption' color='text.secondary'>Scheme</Typography>
                <Typography variant='body2' className='font-medium'>{data.scheme}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Assessment Date</Typography>
                <Typography variant='body2' className='font-medium'>
                  {data.assessment_date ? new Date(data.assessment_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total Candidates</Typography>
                <Typography variant='body2' className='font-medium'>{data.total_candidate}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Present Candidates</Typography>
                <Typography variant='body2' className='font-medium'>{data.present_candidate}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Amount Per Candidate</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.amount_per_candidate).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>Total Amount</Typography>
                <Typography variant='body2' className='font-medium'>{Number(data.total_amount).toFixed(2)}</Typography>
              </Grid>
              {data.notes && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>Notes</Typography>
                  <Typography variant='body2'>{data.notes}</Typography>
                </Grid>
              )}
              {data.group_photo && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Group Photo</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={data.group_photo} target='_blank'>
                    View Photo
                  </Button>
                </Grid>
              )}
              {data.attendance_sheet && (
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>Attendance Sheet</Typography>
                  <br />
                  <Button variant='text' size='small' component='a' href={data.attendance_sheet} target='_blank'>
                    View Sheet
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Payment Details' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant='caption' color='text.secondary'>Current Status</Typography>
                <br />
                <Chip
                  variant='tonal'
                  size='small'
                  label={data.payment_status ? data.payment_status.charAt(0).toUpperCase() + data.payment_status.slice(1) : 'Pending'}
                  color={data.payment_status === 'received' ? 'success' : 'warning'}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  select
                  fullWidth
                  label='Payment Status'
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                  SelectProps={{ MenuProps }}
                >
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='received'>Received</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Received Amount'
                  type='number'
                  value={receivedAmount}
                  onChange={e => setReceivedAmount(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Deduction Amount'
                  type='number'
                  value={deductionAmount}
                  onChange={e => setDeductionAmount(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='caption' color='text.secondary'>Actual Received</Typography>
                <Typography variant='body1' className='font-medium'>{actualReceived.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='caption' color='text.secondary'>Difference</Typography>
                <Typography variant='body1' className='font-medium' color={difference < 0 ? 'error' : 'success'}>
                  {difference.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button variant='contained' fullWidth onClick={handleSavePayment} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}>
                  Save Payment
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default SscInvoiceDetail
