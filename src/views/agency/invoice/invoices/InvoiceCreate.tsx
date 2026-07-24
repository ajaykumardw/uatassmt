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
import Checkbox from '@mui/material/Checkbox'
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
  training_partner?: {
    id: number
    first_name?: string
    last_name?: string
    company_name?: string
  }
  _count?: { students: number }
  total_candidates?: number
  total_assigned?: number
  present_candidates?: number
}

const InvoiceCreate = () => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [selectedType, setSelectedType] = useState<number>(0)
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [sscOptions, setSscOptions] = useState<{ id: number; ssc_name: string }[]>([])
  const [schemeOptions, setSchemeOptions] = useState<{ id: number; scheme_name: string }[]>([])

  const [selectedSscId, setSelectedSscId] = useState('')
  const [selectedSchemeId, setSelectedSchemeId] = useState('')
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
  const [gstPercentage, setGstPercentage] = useState('')
  const [selectedTpId, setSelectedTpId] = useState('')

  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null)
  const [attendanceSheetFile, setAttendanceSheetFile] = useState<File | null>(null)

  const [existingMedia, setExistingMedia] = useState<Record<string, { id: number; fileName: string; path: string }[]>>({})
  const [useExistingGroupPhoto, setUseExistingGroupPhoto] = useState(false)
  const [useExistingAttendanceSheet, setUseExistingAttendanceSheet] = useState(false)
  const [selectedGroupPhotoPath, setSelectedGroupPhotoPath] = useState('')
  const [selectedAttendanceSheetPath, setSelectedAttendanceSheetPath] = useState('')

  const filteredBatches = batches.filter(b => {
    if (selectedType === 3) {
      if (selectedSchemeId && b.scheme?.id !== Number(selectedSchemeId)) return false

      return true
    }

    if (!selectedSscId) return true

    return b.qualification_pack?.ssc?.id === Number(selectedSscId)
  })

  const totalAmount = Number(presentCandidates) * Number(amountPerCandidate) || 0
  const hasGroupPhotoInMedia = 'group_photo_before_batch_start' in existingMedia && existingMedia.group_photo_before_batch_start.length > 0
  const hasAttendanceSheetInMedia = 'manual_attendance_register' in existingMedia && existingMedia.manual_attendance_register.length > 0

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

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes`)
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list)) {
          setSchemeOptions(list.map((s: any) => ({ id: s.id, scheme_name: s.scheme_name })))
        }
      })
      .catch(() => {})
  }, [])

  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId)
    const batch = batches.find(b => b.id === Number(batchId))

    if (batch) {
      setBatchSscId(batch.qualification_pack?.ssc?.id || 0)
      setSscName(batch.qualification_pack?.ssc?.ssc_name || batch.ssc_name || '')

      const tp = batch.training_partner

      setTpName(tp?.company_name || [tp?.first_name, tp?.last_name].filter(Boolean).join(' ') || batch.tp_name || '')

      if (selectedType === 3 && tp?.id) {
        setSelectedTpId(String(tp.id))
      }

      setSchemeName(batch.scheme?.scheme_name || batch.scheme_name || '')
      setAssessmentDate((batch.assessment_start_datetime || batch.assessment_end_datetime || '').split('T')[0])
      const tc = batch._count?.students || Number(batch.batch_size) || batch.total_candidates || batch.total_assigned || 0

      setTotalCandidates(tc)
      setPresentCandidates(String(batch.present_candidates || tc))
      setAmountPerCandidate('')
      setGstPercentage('')

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

        if (batchId) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/batch-media?batchId=${batchId}`)
            const result = await res.json()

            if (result.status === 'Success' && result.data) {
              setExistingMedia(result.data)
              setUseExistingGroupPhoto(false)
              setUseExistingAttendanceSheet(false)
              setSelectedGroupPhotoPath('')
              setSelectedAttendanceSheetPath('')
              setGroupPhotoFile(null)
              setAttendanceSheetFile(null)
            }
          } catch {
            // silently fail
          }
        }
      } else if (selectedType === 3) {
        const schemeId = batch.scheme?.id

        if (schemeId) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data?type=3&scheme_id=${schemeId}`)
            const result = await res.json()

            if (result.status === 'Success' && Array.isArray(result.data)) {
              if (result.data.length > 0) {
                setAmountPerCandidate(String(Number(result.data[0].amount_per_candidate)))
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
      setGstPercentage('')
      setExistingMedia({})
      setUseExistingGroupPhoto(false)
      setUseExistingAttendanceSheet(false)
      setSelectedGroupPhotoPath('')
      setSelectedAttendanceSheetPath('')
      setGroupPhotoFile(null)
      setAttendanceSheetFile(null)
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

    if (selectedType === 1) {
      const hasGroupPhoto = useExistingGroupPhoto ? !!selectedGroupPhotoPath : !!groupPhotoFile
      const hasAttendanceSheet = useExistingAttendanceSheet ? !!selectedAttendanceSheetPath : !!attendanceSheetFile

      if (!hasGroupPhoto || !hasAttendanceSheet) {
        toast.error('Please provide Group Photo and Attendance Sheet')

        return
      }
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
        notes: notes || null
      }

      if (selectedType === 1) {
        body.present_candidate = Number(presentCandidates)

        if (useExistingGroupPhoto && selectedGroupPhotoPath) {
          body.group_photo = selectedGroupPhotoPath
        }

        if (useExistingAttendanceSheet && selectedAttendanceSheetPath) {
          body.attendance_sheet = selectedAttendanceSheetPath
        }
      } else if (selectedType === 3) {
        body.tp_id = Number(selectedTpId)
        body.gst_percentage = Number(gstPercentage) || 0
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
          if (!useExistingGroupPhoto && groupPhotoFile) filesToUpload.push({ file: groupPhotoFile, fileType: 'group_photo' })
          if (!useExistingAttendanceSheet && attendanceSheetFile) filesToUpload.push({ file: attendanceSheetFile, fileType: 'attendance_sheet' })
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
                        setSelectedSchemeId('')
                        setSelectedTpId('')
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
                  {selectedType === 3 && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        select
                        fullWidth
                        label='Select Scheme'
                        value={selectedSchemeId}
                        onChange={e => {
                          setSelectedSchemeId(e.target.value)
                          setSelectedBatchId('')
                          handleBatchChange('')
                        }}
                        SelectProps={{ MenuProps, displayEmpty: true }}
                      >
                        <MenuItem value=''>All Schemes</MenuItem>
                        {schemeOptions.map(s => (
                          <MenuItem key={s.id} value={s.id.toString()}>{s.scheme_name}</MenuItem>
                        ))}
                      </CustomTextField>
                    </Grid>
                  )}
                  {selectedType === 1 && (
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
                  )}
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
                  {selectedType === 1 && entityName && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField fullWidth label='SSC Name' value={entityName} InputProps={{ readOnly: true }} />
                    </Grid>
                  )}
                  {selectedType === 3 && selectedBatchId && (
                    <Grid item xs={12} sm={6}>
                      <CustomTextField fullWidth label='Training Partner' value={tpName} InputProps={{ readOnly: true }} />
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

                  {selectedType === 3 && (
                    <>
                      <Grid item xs={12} sm={3}>
                        <CustomTextField
                          select
                          fullWidth
                          label='GST %'
                          value={gstPercentage}
                          onChange={e => setGstPercentage(e.target.value)}
                          SelectProps={{ MenuProps }}
                        >
                          <MenuItem value=''>Select</MenuItem>
                          <MenuItem value='0'>0%</MenuItem>
                          <MenuItem value='5'>5%</MenuItem>
                          <MenuItem value='12'>12%</MenuItem>
                          <MenuItem value='18'>18%</MenuItem>
                          <MenuItem value='28'>28%</MenuItem>
                        </CustomTextField>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <CustomTextField
                          fullWidth
                          label='GST Amount'
                          value={gstPercentage && totalAmount ? (totalAmount * Number(gstPercentage) / 100).toFixed(2) : '0.00'}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
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
                  {selectedType === 1 && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Checkbox
                          checked={useExistingGroupPhoto}
                          disabled={!hasGroupPhotoInMedia}
                          onChange={(e) => {
                            const checked = e.target.checked

                            setUseExistingGroupPhoto(checked)

                            if (checked) {
                              const firstPath = existingMedia.group_photo_before_batch_start?.[0]?.path || ''

                              setSelectedGroupPhotoPath(firstPath)
                              setGroupPhotoFile(null)
                            } else {
                              setSelectedGroupPhotoPath('')
                            }
                          }}
                        />
                        <Typography variant='body2' component='span'>
                          Use existing group photo from inspection media
                          {!hasGroupPhotoInMedia && ' (not available)'}
                        </Typography>
                      </Grid>
                      {useExistingGroupPhoto && hasGroupPhotoInMedia && (
                        <Grid item xs={12} sm={6}>
                          <CustomTextField
                            fullWidth
                            label='Selected Group Photo'
                            value={selectedGroupPhotoPath.split('/').pop() || ''}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      )}
                      {!useExistingGroupPhoto && (
                        <Grid item xs={12}>
                          <Typography variant='body2' color='text.secondary' className='mb-2'>
                            Group Photo *
                          </Typography>
                          <input type='file' accept='image/*' onChange={e => setGroupPhotoFile(e.target.files?.[0] || null)} />
                          {groupPhotoFile && <Typography variant='caption'>{groupPhotoFile.name}</Typography>}
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Checkbox
                          checked={useExistingAttendanceSheet}
                          disabled={!hasAttendanceSheetInMedia}
                          onChange={(e) => {
                            const checked = e.target.checked

                            setUseExistingAttendanceSheet(checked)

                            if (checked) {
                              const firstPath = (existingMedia.manual_attendance_register?.[0]?.path) || ''

                              setSelectedAttendanceSheetPath(firstPath)
                              setAttendanceSheetFile(null)
                            } else {
                              setSelectedAttendanceSheetPath('')
                            }
                          }}
                        />
                        <Typography variant='body2' component='span'>
                          Use existing attendance sheet from inspection media
                          {!hasAttendanceSheetInMedia && ' (not available)'}
                        </Typography>
                      </Grid>
                      {useExistingAttendanceSheet && hasAttendanceSheetInMedia && (
                        <Grid item xs={12} sm={6}>
                          <CustomTextField
                            fullWidth
                            label='Selected Attendance Sheet'
                            value={selectedAttendanceSheetPath.split('/').pop() || ''}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      )}
                      {!useExistingAttendanceSheet && (
                        <Grid item xs={12}>
                          <Typography variant='body2' color='text.secondary' className='mb-2'>
                            Attendance Sheet *
                          </Typography>
                          <input type='file' accept='image/*,.pdf' onChange={e => setAttendanceSheetFile(e.target.files?.[0] || null)} />
                          {attendanceSheetFile && <Typography variant='caption'>{attendanceSheetFile.name}</Typography>}
                        </Grid>
                      )}
                    </>
                  )}
                  {selectedType === 3 && (
                    <Grid item xs={12}>
                      <Typography variant='body2' color='text.secondary'>
                        No file uploads required for TP invoices
                      </Typography>
                    </Grid>
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
