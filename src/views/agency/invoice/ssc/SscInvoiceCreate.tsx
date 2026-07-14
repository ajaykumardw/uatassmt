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

import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'
import { MenuProps } from '@/configs/customDataConfig'

type BatchOption = {
  id: number
  batch_name: string
  ssc_name?: string
  scheme_name?: string
  assessment_start_date?: string
  assessment_end_date?: string
}

const SscInvoiceCreate = () => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [batches, setBatches] = useState<BatchOption[]>([])

  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [sscName, setSscName] = useState('')
  const [schemeName, setSchemeName] = useState('')
  const [assessmentDate, setAssessmentDate] = useState('')
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [presentCandidates, setPresentCandidates] = useState('')
  const [amountPerCandidate, setAmountPerCandidate] = useState('')
  const [notes, setNotes] = useState('')

  const totalAmount = Number(presentCandidates) * Number(amountPerCandidate) || 0

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`)
      .then(res => res.json())
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || []

        setBatches(list)
      })
      .catch(() => {})
  }, [])

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId)
    const batch = batches.find(b => b.id === Number(batchId))

    if (batch) {
      setSscName(batch.ssc_name || '')
      setSchemeName(batch.scheme_name || '')
      setAssessmentDate(batch.assessment_start_date || batch.assessment_end_date || '')
      setTotalCandidates(0)
      setPresentCandidates('')
    } else {
      setSscName('')
      setSchemeName('')
      setAssessmentDate('')
      setTotalCandidates(0)
      setPresentCandidates('')
    }
  }

  const handleSave = async () => {
    if (!selectedBatchId || !presentCandidates || !amountPerCandidate) {
      toast.error('Please fill all required fields')

      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('batch_id', selectedBatchId)
      formData.append('present_candidates', presentCandidates)
      formData.append('amount_per_candidate', amountPerCandidate)
      formData.append('total_amount', totalAmount.toString())
      if (notes) formData.append('notes', notes)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/ssc`, {
        method: 'POST',
        body: formData
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        toast.success('Invoice created successfully')
        router.push('/invoice/ssc')
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
          <CardHeader title='Create SSC Invoice' subheader='Fill in the details to generate an SSC invoice' />
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
                <CustomTextField fullWidth label='Scheme' value={schemeName} InputProps={{ readOnly: true }} />
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
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={3}
                  label='Notes'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary' className='mb-2'>
                  Group Photo *
                </Typography>
                {/* TODO: Implement file upload to S3/local storage */}
                <input type='file' accept='image/*' />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary' className='mb-2'>
                  Attendance Sheet *
                </Typography>
                {/* TODO: Implement file upload to S3/local storage */}
                <input type='file' accept='image/*,.pdf' />
              </Grid>
              <Grid item xs={12} className='flex gap-4'>
                <Button variant='contained' onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-device-floppy' />}>
                  Save Invoice
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

export default SscInvoiceCreate
