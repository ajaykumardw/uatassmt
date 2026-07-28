'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import { MenuProps, GST_OPTIONS } from '@/configs/customDataConfig'

type Props = {
  invoiceId: number
}

const InvoiceEdit = ({ invoiceId }: Props) => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [invoiceType, setInvoiceType] = useState(0)
  const [batchName, setBatchName] = useState('')
  const [entityName, setEntityName] = useState('')
  const [schemeName, setSchemeName] = useState('')
  const [assessmentDate, setAssessmentDate] = useState('')
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [presentCandidates, setPresentCandidates] = useState('')
  const [amountPerCandidate, setAmountPerCandidate] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [gstPercentage, setGstPercentage] = useState('')
  const [currentStatus, setCurrentStatus] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(result => {
        if (result.status === 'Success' && result.data) {
          const d = result.data

          setInvoiceType(d.type)
          setBatchName(d.batch_name || '')
          setEntityName(
            d.type === 1 ? d.ssc_name :
            d.type === 2 ? d.assessor_name :
            d.tp_name || ''
          )
          setSchemeName(d.scheme || '')
          setAssessmentDate(d.assessment_date ? d.assessment_date.split('T')[0] : '')
          setTotalCandidates(d.total_candidate || 0)
          setPresentCandidates(String(d.present_candidate || ''))
          setAmountPerCandidate(String(d.amount_per_candidate || ''))
          setTotalAmount(Number(d.total_amount) || 0)
          setGstPercentage(String(d.gst_percentage || ''))
          setCurrentStatus(d.status)
          setNotes(d.notes || '')
        } else {
          toast.error('Invoice not found')
          router.push('/invoice/invoices')
        }
      })
      .catch(() => {
        toast.error('Failed to load invoice')
        router.push('/invoice/invoices')
      })
      .finally(() => setLoading(false))
  }, [invoiceId, router])

  const handleSave = async () => {
    if (currentStatus === 0 && invoiceType === 2) {
      if (!amountPerCandidate || Number(amountPerCandidate) <= 0) {
        toast.error('Amount Per Candidate is required to submit the invoice')
        setSaving(false)
        
return
      }

      if (totalAmount <= 0) {
        toast.error('Total Amount must be greater than 0 to submit the invoice')
        setSaving(false)
        
return
      }
    }

    setSaving(true)

    try {
      const body: Record<string, any> = {
        present_candidate: Number(presentCandidates) || 0,
        amount_per_candidate: Number(amountPerCandidate) || 0,
        total_amount: totalAmount,
        notes: notes || null
      }

      if (invoiceType === 3 && gstPercentage) {
        body.gst_percentage = Number(gstPercentage)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Invoice updated successfully')
        router.push(`/invoice/invoices/${invoiceId}`)
      } else {
        toast.error(result.message || 'Failed to update invoice')
      }
    } catch {
      toast.error('Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent className='flex justify-center'>
              <CircularProgress />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Button variant='tonal' startIcon={<i className='tabler-arrow-left' />} onClick={() => router.back()} className='mb-4'>
          Back
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Edit Invoice' subheader={`Invoice #${invoiceId} — ${invoiceType === 1 ? 'SSC' : invoiceType === 2 ? 'Assessor' : 'TP'}`} />
          <CardContent>

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='Batch' value={batchName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label={
                  invoiceType === 1 ? 'SSC' : invoiceType === 2 ? 'Assessor' : 'Training Partner'
                } value={entityName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='Scheme' value={schemeName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='Assessment Date' type='date' value={assessmentDate} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='Total Candidates' type='number' value={totalCandidates} InputProps={{ readOnly: true }} />
              </Grid>
              {(invoiceType === 1 || invoiceType === 2) && (
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    fullWidth
                    label='Present Candidates'
                    type='number'
                    value={presentCandidates}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Amount Per Candidate'
                  type='number'
                  value={amountPerCandidate}
                  onChange={e => {
                    setAmountPerCandidate(e.target.value)
                    const count = Number(presentCandidates) || totalCandidates

                    setTotalAmount(Number(e.target.value) * count)
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Total Amount'
                  type='number'
                  value={totalAmount.toFixed(2)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              {invoiceType === 3 && (
                <>
                  <Grid item xs={12} sm={2}>
                    <CustomTextField
                      select
                      fullWidth
                      label='GST %'
                      value={gstPercentage}
                      onChange={e => setGstPercentage(e.target.value)}
                      SelectProps={{ MenuProps }}
                    >
                      {GST_OPTIONS.map(o => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <CustomTextField
                      fullWidth
                      label='GST Amount'
                      value={gstPercentage && totalAmount ? (totalAmount * Number(gstPercentage) / 100).toFixed(2) : '0.00'}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <CustomTextField
                      fullWidth
                      label='Grand Total (incl. GST)'
                      value={gstPercentage && totalAmount ? (totalAmount + totalAmount * Number(gstPercentage) / 100).toFixed(2) : totalAmount.toFixed(2)}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={3}
                  label='Notes'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} className='flex gap-4'>
                <Button variant='contained' onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-device-floppy' />}>
                  Update Invoice
                </Button>
                <Button variant='tonal' color='secondary' onClick={() => router.back()}>Cancel</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default InvoiceEdit
