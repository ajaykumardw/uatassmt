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
import Chip from '@mui/material/Chip'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import { MenuProps } from '@/configs/customDataConfig'

type BatchOption = {
  id: number
  batch_name: string
  batch_size?: string
  ssc_name?: string
  tp_name?: string
  scheme_name?: string
  scheme?: { id: number; scheme_name: string; scheme_code: string }
  assessment_start_datetime?: string
  assessment_end_datetime?: string
  qualification_pack?: {
    ssc?: { id: number; ssc_code: string; ssc_name: string }
  }
  _count?: { students: number }
  total_candidates?: number
  total_assigned?: number
  present_candidates?: number
}

type TpOption = {
  id: number
  tp_name: string
}

const InvoiceCreate = () => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [selectedType, setSelectedType] = useState<number>(0)
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [sscOptions, setSscOptions] = useState<{ id: number; ssc_name: string }[]>([])
  const [tpList, setTpList] = useState<TpOption[]>([])

  const [selectedSscId, setSelectedSscId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [batchSscId, setBatchSscId] = useState<number>(0)
  const [sscName, setSscName] = useState('')
  const [tpName, setTpName] = useState('')
  const [schemeName, setSchemeName] = useState('')
  const [assessmentDate, setAssessmentDate] = useState('')
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [presentCandidates, setPresentCandidates] = useState('')
  const [amountPerCandidate, setAmountPerCandidate] = useState('')
  const [notes, setNotes] = useState('')
  const [tdsAmount, setTdsAmount] = useState('')
  const [otherDeduction, setOtherDeduction] = useState('')
  const [gstAmount, setGstAmount] = useState('')
  const [selectedTpId, setSelectedTpId] = useState('')

  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null)
  const [attendanceSheetFile, setAttendanceSheetFile] = useState<File | null>(null)
  const [invoicePdfTpFile, setInvoicePdfTpFile] = useState<File | null>(null)
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null)

  const filteredBatches = batches.filter(b => {
    if (!selectedSscId) return true

    return b.qualification_pack?.ssc?.id === Number(selectedSscId)
  })

  const totalAmount = Number(presentCandidates) * Number(amountPerCandidate) || 0

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`)
      .then(res => res.json())
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || []

        setBatches(list)
      })
      .catch(() => {})

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list)) {
          setSscOptions(list.map((s: any) => ({ id: s.id, ssc_name: s.ssc_name })))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedType === 3) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-partner`)
        .then(res => res.json())
        .then(res => {
          const raw = Array.isArray(res) ? res : res.data || []

          setTpList(raw.map((t: any) => ({ id: t.id, tp_name: t.company_name || [t.first_name, t.last_name].filter(Boolean).join(' ') })))
        })
        .catch(() => {})
    }
  }, [selectedType])

  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId)
    const batch = batches.find(b => b.id === Number(batchId))

    if (batch) {
      setBatchSscId(batch.qualification_pack?.ssc?.id || 0)
      setSscName(batch.qualification_pack?.ssc?.ssc_name || batch.ssc_name || '')
      setTpName(batch.tp_name || '')
      setSchemeName(batch.scheme?.scheme_name || batch.scheme_name || '')
      setAssessmentDate((batch.assessment_start_datetime || batch.assessment_end_datetime || '').split('T')[0])
      const tc = batch._count?.students || Number(batch.batch_size) || batch.total_candidates || batch.total_assigned || 0

      setTotalCandidates(tc)
      setPresentCandidates(String(batch.present_candidates || tc))
      setAmountPerCandidate('')
      setTdsAmount('')
      setOtherDeduction('')
      setGstAmount('')

      if (selectedType === 1) {
        const sscId = batch.qualification_pack?.ssc?.id
        const schemeId = batch.scheme?.id

        if (sscId && schemeId) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data?ssc_id=${sscId}`)
            const result = await res.json()

            if (result.status === 'Success' && Array.isArray(result.data)) {
              const match = result.data.find((m: any) => Number(m.scheme_id) === Number(schemeId))

              if (match) {
                setAmountPerCandidate(String(Number(match.amount_per_candidate)))
              }
            }
          } catch {
            // silently fail
          }
        }
      }
    } else {
      setBatchSscId(0)
      setSscName('')
      setTpName('')
      setSchemeName('')
      setAssessmentDate('')
      setTotalCandidates(0)
      setPresentCandidates('')
      setAmountPerCandidate('')
      setTdsAmount('')
      setOtherDeduction('')
      setGstAmount('')
    }
  }

  const entityName = selectedType === 1 ? sscName : tpName

  const handleSave = async () => {
    if (!selectedType) {
      toast.error('Please select invoice type')

      return
    }

    if (!selectedBatchId || !amountPerCandidate) {
      toast.error('Please fill all required fields')

      return
    }

    setSaving(true)

    try {
      const body: Record<string, any> = {
        type: selectedType,
        batch_id: Number(selectedBatchId),
        amount_per_candidate: Number(amountPerCandidate),
        total_amount: totalAmount,
        ssc_id: batchSscId || undefined,
        assessment_date: assessmentDate || null,
        scheme: schemeName,
        total_candidate: totalCandidates,
        notes: notes || null,
        tds_amount: Number(tdsAmount) || 0,
        other_deduction: Number(otherDeduction) || 0
      }

      if (selectedType === 1) {
        body.present_candidate = Number(presentCandidates)
      } else if (selectedType === 3) {
        body.tp_id = Number(selectedTpId)
        body.gst_amount = Number(gstAmount) || 0
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await res.json()

      if (res.ok && (result.status === 'Success' || result.status === 'success')) {
        const invoiceId = result.data?.id || result.id

        const filesToUpload: { file: File; fileType: string }[] = []

        if (selectedType === 1) {
          if (groupPhotoFile) filesToUpload.push({ file: groupPhotoFile, fileType: 'group_photo' })
          if (attendanceSheetFile) filesToUpload.push({ file: attendanceSheetFile, fileType: 'attendance_sheet' })
        } else if (selectedType === 3) {
          if (invoicePdfTpFile) filesToUpload.push({ file: invoicePdfTpFile, fileType: 'invoice_pdf' })
          if (paymentReceiptFile) filesToUpload.push({ file: paymentReceiptFile, fileType: 'payment_receipt' })
        }

        for (const item of filesToUpload) {
          const formData = new FormData()

          formData.append('invoice_id', String(invoiceId))
          formData.append('file_type', item.fileType)
          formData.append('file', item.file)

          toast.info(`Uploading ${item.file.name}...`)

          const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/upload`, {
            method: 'POST',
            body: formData
          })

          const uploadResult = await uploadRes.json()

          if (uploadRes.ok && (uploadResult.status === 'Success' || uploadResult.status === 'success')) {
            toast.success(`${item.file.name} uploaded`)
          } else {
            toast.error(`Failed to upload ${item.file.name}: ${uploadResult.message || 'Unknown error'}`)
          }
        }

        toast.success('Invoice created successfully')
        router.push('/invoice/invoices')
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
          <CardHeader title='Create Invoice' subheader='Select invoice type and fill details' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary' className='mb-2'>Invoice Type *</Typography>
                <div className='flex gap-4'>
                  {[
                    { value: 1, label: 'SSC' },
                    { value: 3, label: 'TP' }
                  ].map(t => (
                    <Chip
                      key={t.value}
                      variant={selectedType === t.value ? 'filled' : 'outlined'}
                      color='primary'
                      label={t.label}
                      onClick={() => {
                        setSelectedType(t.value)
                        setSelectedSscId('')
                        setSelectedBatchId('')
                        handleBatchChange('')
                      }}
                      sx={{ cursor: 'pointer', fontWeight: selectedType === t.value ? 600 : 400 }}
                    />
                  ))}
                </div>
              </Grid>
              {selectedType > 0 && (
                <>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Select SSC'
                      value={selectedSscId}
                      onChange={e => {
                        setSelectedSscId(e.target.value)
                        setSelectedBatchId('')
                        handleBatchChange('')
                      }}
                      SelectProps={{ MenuProps, displayEmpty: true }}
                    >
                      <MenuItem value=''>All SSC</MenuItem>
                      {sscOptions.map(s => (
                        <MenuItem key={s.id} value={s.id.toString()}>{s.ssc_name}</MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
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
                      {filteredBatches.map(b => (
                        <MenuItem key={b.id} value={b.id.toString()}>{b.batch_name}</MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                  {entityName && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField fullWidth label={selectedType === 1 ? 'SSC Name' : 'Training Partner'} value={entityName} InputProps={{ readOnly: true }} />
                    </Grid>
                  )}
                  {selectedType === 3 && selectedBatchId && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        select
                        fullWidth
                        label='Select TP *'
                        value={selectedTpId}
                        onChange={e => setSelectedTpId(e.target.value)}
                        SelectProps={{ MenuProps }}
                      >
                        <MenuItem value=''>Select TP</MenuItem>
                        {tpList.map(t => (
                          <MenuItem key={t.id} value={t.id.toString()}>{t.tp_name}</MenuItem>
                        ))}
                      </CustomTextField>
                    </Grid>
                  )}
                  {schemeName && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField fullWidth label='Scheme' value={schemeName} InputProps={{ readOnly: true }} />
                    </Grid>
                  )}
                  {assessmentDate && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField fullWidth label='Assessment Date' type='date' value={assessmentDate} InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} />
                    </Grid>
                  )}
                  {totalCandidates > 0 && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField fullWidth label='Total Candidates' type='number' value={totalCandidates} InputProps={{ readOnly: true }} />
                    </Grid>
                  )}
                  {selectedType === 1 && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        fullWidth
                        label='Present Candidates *'
                        type='number'
                        value={presentCandidates}
                        onChange={e => setPresentCandidates(e.target.value)}
                      />
                    </Grid>
                  )}
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
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='TDS Amount'
                      type='number'
                      value={tdsAmount}
                      onChange={e => setTdsAmount(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      label='Other Deduction'
                      type='number'
                      value={otherDeduction}
                      onChange={e => setOtherDeduction(e.target.value)}
                    />
                  </Grid>
                  {selectedType === 3 && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        fullWidth
                        label='GST Amount'
                        type='number'
                        value={gstAmount}
                        onChange={e => setGstAmount(e.target.value)}
                      />
                    </Grid>
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
                  {selectedType === 1 && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant='body2' color='text.secondary' className='mb-2'>
                          Group Photo *
                        </Typography>
                        <input type='file' accept='image/*' onChange={e => setGroupPhotoFile(e.target.files?.[0] || null)} />
                        {groupPhotoFile && <Typography variant='caption'>{groupPhotoFile.name}</Typography>}
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant='body2' color='text.secondary' className='mb-2'>
                          Attendance Sheet *
                        </Typography>
                        <input type='file' accept='image/*,.pdf' onChange={e => setAttendanceSheetFile(e.target.files?.[0] || null)} />
                        {attendanceSheetFile && <Typography variant='caption'>{attendanceSheetFile.name}</Typography>}
                      </Grid>
                    </>
                  )}
                  {selectedType === 3 && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant='body2' color='text.secondary' className='mb-2'>
                          Invoice PDF (Stamped)
                        </Typography>
                        <input type='file' accept='.pdf' onChange={e => setInvoicePdfTpFile(e.target.files?.[0] || null)} />
                        {invoicePdfTpFile && <Typography variant='caption'>{invoicePdfTpFile.name}</Typography>}
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant='body2' color='text.secondary' className='mb-2'>
                          Payment Receipt
                        </Typography>
                        <input type='file' accept='.pdf,image/*' onChange={e => setPaymentReceiptFile(e.target.files?.[0] || null)} />
                        {paymentReceiptFile && <Typography variant='caption'>{paymentReceiptFile.name}</Typography>}
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} className='flex gap-4'>
                    <Button variant='contained' onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-device-floppy' />}>
                      Save Invoice
                    </Button>
                    <Button variant='tonal' color='secondary' onClick={() => router.back()}>Cancel</Button>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default InvoiceCreate
