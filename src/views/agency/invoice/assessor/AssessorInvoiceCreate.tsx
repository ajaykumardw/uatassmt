'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import { MenuProps } from '@/configs/customDataConfig'

type BatchOption = {
  id: number
  batch_name: string
  ssc_name?: string
  assessor_name?: string
  assessment_start_date?: string
  assessment_end_date?: string
  total_assigned?: number
  present_candidates?: number
}

const AssessorInvoiceCreate = () => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [batches, setBatches] = useState<BatchOption[]>([])

  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [sscName, setSscName] = useState('')
  const [assessorName, setAssessorName] = useState('')
  const [assessmentDate, setAssessmentDate] = useState('')
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [presentCandidates, setPresentCandidates] = useState('')
  const [amountPerCandidate, setAmountPerCandidate] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`)
      .then(res => res.json())
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || []

        setBatches(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const total = Number(presentCandidates) * Number(amountPerCandidate)

    setTotalAmount(isNaN(total) ? 0 : total)
  }, [presentCandidates, amountPerCandidate])

  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId)
    const batch = batches.find(b => b.id === Number(batchId))

    if (batch) {
      setSscName(batch.ssc_name || '')
      setAssessorName(batch.assessor_name || '')
      setAssessmentDate(batch.assessment_start_date || batch.assessment_end_date || '')
      setTotalCandidates(batch.total_assigned || 0)
      setPresentCandidates(batch.present_candidates?.toString() || '')
      setAmountPerCandidate('')
      setTotalAmount(0)

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/assessor-amount`)

        if (res.ok) {
          const result = await res.json()

          if (result.data?.amount_per_candidate) {
            setAmountPerCandidate(result.data.amount_per_candidate.toString())
          }
        }
      } catch {
        // silently fail, user can enter manually
      }
    } else {
      setSscName('')
      setAssessorName('')
      setAssessmentDate('')
      setTotalCandidates(0)
      setPresentCandidates('')
      setAmountPerCandidate('')
      setTotalAmount(0)
    }
  }

  const handleSave = async () => {
    if (!selectedBatchId || !presentCandidates || !amountPerCandidate) {
      toast.error('Please fill all required fields')

      return
    }

    setSaving(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/assessor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: Number(selectedBatchId),
          present_candidates: Number(presentCandidates),
          amount_per_candidate: Number(amountPerCandidate),
          total_amount: totalAmount,
          invoice_status: 'draft'
        })
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Invoice saved as draft')
        router.push('/invoice/assessor')
      } else {
        toast.error(result.message || 'Failed to create invoice')
      }
    } catch {
      toast.error('Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Create Assessor Invoice' subheader='Fill in the details to generate an assessor invoice' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  select
                  fullWidth
                  label='Select Batch'
                  value={selectedBatchId}
                  onChange={e => handleBatchChange(e.target.value)}
                  SelectProps={{ MenuProps }}
                >
                  <MenuItem value=''>Select Batch</MenuItem>
                  {batches.map(b => (
                    <MenuItem key={b.id} value={b.id.toString()}>{b.batch_name}</MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='SSC Name' value={sscName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='Assessor Name' value={assessorName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='Assessment Date' type='date' value={assessmentDate} InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField fullWidth label='Total Candidates' type='number' value={totalCandidates} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Present Candidates *'
                  type='number'
                  value={presentCandidates}
                  onChange={e => setPresentCandidates(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Amount Per Candidate *'
                  type='number'
                  value={amountPerCandidate}
                  onChange={e => setAmountPerCandidate(e.target.value)}
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
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary' className='mb-2'>
                  Invoice PDF (optional)
                </Typography>
                {/* TODO: Implement file upload to S3/local storage */}
                <input type='file' accept='.pdf' />
              </Grid>
              <Grid item xs={12} className='flex gap-4'>
                <Button variant='contained' onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-device-floppy' />}>
                  Save as Draft
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

export default AssessorInvoiceCreate
