'use client'

import { useEffect, useState } from 'react'

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
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import { MenuProps } from '@/configs/customDataConfig'

import type { SSCType } from '@/types/sectorskills/sscType'
import type { SchemesType } from '@/types/schemes/schemesType'

type SscItem = {
  id: number
  ssc_id: number
  ssc_name: string
  scheme_id: number
  scheme_name: string
  amount_per_candidate: number
  status: number
}

type AssessorItem = {
  id: number
  assessor_id: number
  assessor_name: string
  amount_per_candidate: number
  effective_from: string | null
  status: number
}

type TpItem = {
  id: number
  scheme_id: number
  scheme_name: string
  amount_per_candidate: number
  status: number
}

type Props = {
  sscData: SscItem[]
  assessorData: AssessorItem[]
  tpData: TpItem[]
  updateData: () => void
}

// ── SSC (existing) ──────────────────────────────────
const initialSscForm = { ssc_id: '', scheme_id: '', amount_per_candidate: '' }

// ── Assessor ────────────────────────────────────────
const initialAssessorForm = { assessor_id: '', amount_per_candidate: '', effective_from: '' }

// ── TP ──────────────────────────────────────────────
const initialTpForm = { scheme_id: '', amount_per_candidate: '' }

const MasterDataPage = ({ sscData, assessorData, tpData, updateData }: Props) => {
  // ── SSC state ──
  const [sscDialogOpen, setSscDialogOpen] = useState(false)
  const [sscEditItem, setSscEditItem] = useState<SscItem | null>(null)
  const [sscSaving, setSscSaving] = useState(false)
  const [sscDeleteId, setSscDeleteId] = useState<number | null>(null)
  const [sscDeleteOpen, setSscDeleteOpen] = useState(false)
  const [sscList, setSscList] = useState<SSCType[]>([])
  const [schemeList, setSchemeList] = useState<SchemesType[]>([])
  const [sscForm, setSscForm] = useState(initialSscForm)

  // ── Assessor state ──
  const [assDialogOpen, setAssDialogOpen] = useState(false)
  const [assEditItem, setAssEditItem] = useState<AssessorItem | null>(null)
  const [assSaving, setAssSaving] = useState(false)
  const [assDeleteId, setAssDeleteId] = useState<number | null>(null)
  const [assDeleteOpen, setAssDeleteOpen] = useState(false)
  const [assessors, setAssessors] = useState<{ id: number; first_name: string; last_name: string }[]>([])
  const [assForm, setAssForm] = useState(initialAssessorForm)

  // ── TP state ──
  const [tpDialogOpen, setTpDialogOpen] = useState(false)
  const [tpEditItem, setTpEditItem] = useState<TpItem | null>(null)
  const [tpSaving, setTpSaving] = useState(false)
  const [tpDeleteId, setTpDeleteId] = useState<number | null>(null)
  const [tpDeleteOpen, setTpDeleteOpen] = useState(false)
  const [tpSchemeList, setTpSchemeList] = useState<SchemesType[]>([])
  const [tpForm, setTpForm] = useState(initialTpForm)

  // ── Fetch common data ──
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)
      .then(res => res.json())
      .then(res => setSscList(Array.isArray(res) ? res : []))
      .catch(() => {})

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes`)
      .then(res => res.json())
      .then(res => { setSchemeList(Array.isArray(res) ? res : []); setTpSchemeList(Array.isArray(res) ? res : []) })
      .catch(() => {})

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessors`)
      .then(res => res.json())
      .then(res => setAssessors(Array.isArray(res) ? res : []))
      .catch(() => {})
  }, [])

  // ══════════════════════════════════════════════════
  //  SSC HANDLERS
  // ══════════════════════════════════════════════════

  const openSscAdd = () => { setSscEditItem(null); setSscForm(initialSscForm); setSscDialogOpen(true) }

  const openSscEdit = (item: SscItem) => {
    setSscEditItem(item)
    setSscForm({ ssc_id: item.ssc_id.toString(), scheme_id: item.scheme_id.toString(), amount_per_candidate: item.amount_per_candidate.toString() })
    setSscDialogOpen(true)
  }

  const saveSsc = async () => {
    if (!sscForm.ssc_id || !sscForm.scheme_id || !sscForm.amount_per_candidate) {
      toast.error('All fields required')

      return
    }

    setSscSaving(true)

    try {
      const url = sscEditItem ? `${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${sscEditItem.id}` : `${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data`
      const method = sscEditItem ? 'PUT' : 'POST'
      const body: Record<string, any> = { type: 1, ssc_id: Number(sscForm.ssc_id), scheme_id: Number(sscForm.scheme_id), amount_per_candidate: Number(sscForm.amount_per_candidate) }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success(sscEditItem ? 'Updated' : 'Created')
        setSscDialogOpen(false)
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    } finally {
      setSscSaving(false)
    }
  }

  const deleteSsc = async () => {
    if (!sscDeleteId) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${sscDeleteId}`, { method: 'DELETE' })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Deleted')
        setSscDeleteOpen(false)
        setSscDeleteId(null)
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    }
  }

  const toggleSscStatus = async (item: SscItem) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: item.status === 1 ? 0 : 1 }) })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Status updated')
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    }
  }

  // ══════════════════════════════════════════════════
  //  ASSESSOR HANDLERS
  // ══════════════════════════════════════════════════

  const openAssAdd = () => { setAssEditItem(null); setAssForm(initialAssessorForm); setAssDialogOpen(true) }

  const openAssEdit = (item: AssessorItem) => {
    setAssEditItem(item)
    setAssForm({ assessor_id: item.assessor_id.toString(), amount_per_candidate: item.amount_per_candidate.toString(), effective_from: item.effective_from ? item.effective_from.split('T')[0] : '' })
    setAssDialogOpen(true)

    // Ensure the editing assessor is in the dropdown list
    setAssessors(prev => {
      if (prev.some(a => a.id === item.assessor_id)) return prev
      const parts = (item.assessor_name || '').split(' ')

      return [...prev, { id: item.assessor_id, first_name: parts[0] || 'Unknown', last_name: parts.slice(1).join(' ') }]
    })
  }

  const saveAss = async () => {
    if (!assForm.assessor_id || !assForm.amount_per_candidate) {
      toast.error('Assessor and amount required')

      return
    }

    setAssSaving(true)

    try {
      const url = assEditItem ? `${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${assEditItem.id}` : `${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data`
      const method = assEditItem ? 'PUT' : 'POST'
      const body: Record<string, any> = { type: 2, assessor_id: Number(assForm.assessor_id), amount_per_candidate: Number(assForm.amount_per_candidate), effective_from: assForm.effective_from || null }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success(assEditItem ? 'Updated' : 'Created')
        setAssDialogOpen(false)
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    } finally {
      setAssSaving(false)
    }
  }

  const deleteAss = async () => {
    if (!assDeleteId) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${assDeleteId}`, { method: 'DELETE' })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Deleted')
        setAssDeleteOpen(false)
        setAssDeleteId(null)
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    }
  }

  const toggleAssStatus = async (item: AssessorItem) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: item.status === 1 ? 0 : 1 }) })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Status updated')
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    }
  }

  // ══════════════════════════════════════════════════
  //  TP HANDLERS
  // ══════════════════════════════════════════════════

  const openTpAdd = () => { setTpEditItem(null); setTpForm(initialTpForm); setTpDialogOpen(true) }

  const openTpEdit = (item: TpItem) => {
    setTpEditItem(item)
    setTpForm({ scheme_id: item.scheme_id.toString(), amount_per_candidate: item.amount_per_candidate.toString() })
    setTpDialogOpen(true)
  }

  const saveTp = async () => {
    if (!tpForm.scheme_id || !tpForm.amount_per_candidate) {
      toast.error('Scheme and amount required')

      return
    }

    setTpSaving(true)

    try {
      const url = tpEditItem ? `${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${tpEditItem.id}` : `${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data`
      const method = tpEditItem ? 'PUT' : 'POST'
      const body: Record<string, any> = { type: 3, scheme_id: Number(tpForm.scheme_id), amount_per_candidate: Number(tpForm.amount_per_candidate) }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success(tpEditItem ? 'Updated' : 'Created')
        setTpDialogOpen(false)
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    } finally {
      setTpSaving(false)
    }
  }

  const deleteTp = async () => {
    if (!tpDeleteId) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${tpDeleteId}`, { method: 'DELETE' })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Deleted')
        setTpDeleteOpen(false)
        setTpDeleteId(null)
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    }
  }

  const toggleTpStatus = async (item: TpItem) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: item.status === 1 ? 0 : 1 }) })
      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Status updated')
        updateData()
      } else {
        toast.error(result.message || 'Failed')
      }
    } catch {
      toast.error('Failed')
    }
  }

  // ══════════════════════════════════════════════════
  //  SHARED DELETE DIALOG
  // ══════════════════════════════════════════════════

  return (
    <Grid container spacing={6}>
      {/* ── SSC SECTION ── */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='SSC Wise Scheme and Invoice Amount' subheader='Manage SSC-wise scheme rates' action={<Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openSscAdd}>Add New</Button>} />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>SSC Name</TableCell>
                    <TableCell>Scheme Name</TableCell>
                    <TableCell>Amount Per Candidate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sscData.length === 0 ? <TableRow><TableCell colSpan={5} align='center'>No data</TableCell></TableRow>
                    : sscData.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.ssc_name}</TableCell>
                        <TableCell>{item.scheme_name}</TableCell>
                        <TableCell>{Number(item.amount_per_candidate).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button size='small' variant={item.status === 1 ? 'contained' : 'outlined'} color={item.status === 1 ? 'success' : 'secondary'} onClick={() => toggleSscStatus(item)} sx={{ minWidth: 70, textTransform: 'none', borderRadius: 4 }}>{item.status === 1 ? 'Active' : 'Inactive'}</Button>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => openSscEdit(item)} size='small'><i className='tabler-edit text-[22px] text-textSecondary' /></IconButton>
                          <IconButton onClick={() => { setSscDeleteId(item.id); setSscDeleteOpen(true) }} size='small'><i className='tabler-trash text-[22px] text-textSecondary' /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* ── ASSESSOR SECTION ── */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Assessor Wise Invoice Amount' subheader='Manage per-candidate rates for assessors' action={<Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openAssAdd}>Add New</Button>} />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Assessor Name</TableCell>
                    <TableCell>Per Candidate Amount</TableCell>
                    <TableCell>Effective From</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assessorData.length === 0 ? <TableRow><TableCell colSpan={5} align='center'>No data</TableCell></TableRow>
                    : assessorData.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.assessor_name}</TableCell>
                        <TableCell>{Number(item.amount_per_candidate).toFixed(2)}</TableCell>
                        <TableCell>{item.effective_from ? new Date(item.effective_from).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Button size='small' variant={item.status === 1 ? 'contained' : 'outlined'} color={item.status === 1 ? 'success' : 'secondary'} onClick={() => toggleAssStatus(item)} sx={{ minWidth: 70, textTransform: 'none', borderRadius: 4 }}>{item.status === 1 ? 'Active' : 'Inactive'}</Button>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => openAssEdit(item)} size='small'><i className='tabler-edit text-[22px] text-textSecondary' /></IconButton>
                          <IconButton onClick={() => { setAssDeleteId(item.id); setAssDeleteOpen(true) }} size='small'><i className='tabler-trash text-[22px] text-textSecondary' /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* ── TP SECTION ── */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Training Partner Invoice Amount' subheader='Manage per-candidate rates for training partners' action={<Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openTpAdd}>Add New</Button>} />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Scheme</TableCell>
                    <TableCell>Amount Per Candidate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tpData.length === 0 ? <TableRow><TableCell colSpan={4} align='center'>No data</TableCell></TableRow>
                    : tpData.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.scheme_name}</TableCell>
                        <TableCell>{Number(item.amount_per_candidate).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button size='small' variant={item.status === 1 ? 'contained' : 'outlined'} color={item.status === 1 ? 'success' : 'secondary'} onClick={() => toggleTpStatus(item)} sx={{ minWidth: 70, textTransform: 'none', borderRadius: 4 }}>{item.status === 1 ? 'Active' : 'Inactive'}</Button>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => openTpEdit(item)} size='small'><i className='tabler-edit text-[22px] text-textSecondary' /></IconButton>
                          <IconButton onClick={() => { setTpDeleteId(item.id); setTpDeleteOpen(true) }} size='small'><i className='tabler-trash text-[22px] text-textSecondary' /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* ════════════════════════════════════════════ */}
      {/*  DIALOGS                                     */}
      {/* ════════════════════════════════════════════ */}

      {/* SSC Dialog */}
      <Dialog open={sscDialogOpen} onClose={() => setSscDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{sscEditItem ? 'Edit SSC Amount' : 'Add SSC Amount'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-2'>
            <Grid item xs={12}>
              <CustomTextField select fullWidth label='Select SSC' value={sscForm.ssc_id} onChange={e => setSscForm({ ...sscForm, ssc_id: e.target.value })} SelectProps={{ MenuProps }}>
                <MenuItem value=''>Select SSC</MenuItem>
                {sscList.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.ssc_name}</MenuItem>)}
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <CustomTextField select fullWidth label='Select Scheme' value={sscForm.scheme_id} onChange={e => setSscForm({ ...sscForm, scheme_id: e.target.value })} SelectProps={{ MenuProps }}>
                <MenuItem value=''>Select Scheme</MenuItem>
                {schemeList.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.scheme_name}</MenuItem>)}
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <CustomTextField fullWidth label='Amount Per Candidate' type='number' value={sscForm.amount_per_candidate} onChange={e => setSscForm({ ...sscForm, amount_per_candidate: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSscDialogOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' onClick={saveSsc} disabled={sscSaving} startIcon={sscSaving ? <CircularProgress size={16} /> : <i className='tabler-device-floppy' />}>{sscEditItem ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Assessor Dialog */}
      <Dialog open={assDialogOpen} onClose={() => setAssDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{assEditItem ? 'Edit Assessor Amount' : 'Add Assessor Amount'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-2'>
            <Grid item xs={12}>
              <CustomTextField select fullWidth label='Select Assessor' value={assForm.assessor_id} onChange={e => setAssForm({ ...assForm, assessor_id: e.target.value })} SelectProps={{ MenuProps }} disabled={!!assEditItem}>
                <MenuItem value=''>Select Assessor</MenuItem>
                {assessors.map(a => <MenuItem key={a.id} value={a.id.toString()}>{a.first_name} {a.last_name}</MenuItem>)}
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <CustomTextField fullWidth label='Per Candidate Amount' type='number' value={assForm.amount_per_candidate} onChange={e => setAssForm({ ...assForm, amount_per_candidate: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField fullWidth label='Effective From' type='date' value={assForm.effective_from} onChange={e => setAssForm({ ...assForm, effective_from: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssDialogOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' onClick={saveAss} disabled={assSaving} startIcon={assSaving ? <CircularProgress size={16} /> : <i className='tabler-device-floppy' />}>{assEditItem ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* TP Dialog */}
      <Dialog open={tpDialogOpen} onClose={() => setTpDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{tpEditItem ? 'Edit TP Amount' : 'Add TP Amount'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-2'>
            <Grid item xs={12}>
              <CustomTextField select fullWidth label='Select Scheme' value={tpForm.scheme_id} onChange={e => setTpForm({ ...tpForm, scheme_id: e.target.value })} SelectProps={{ MenuProps }}>
                <MenuItem value=''>Select Scheme</MenuItem>
                {tpSchemeList.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.scheme_name}</MenuItem>)}
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <CustomTextField fullWidth label='Amount Per Candidate' type='number' value={tpForm.amount_per_candidate} onChange={e => setTpForm({ ...tpForm, amount_per_candidate: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTpDialogOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' onClick={saveTp} disabled={tpSaving} startIcon={tpSaving ? <CircularProgress size={16} /> : <i className='tabler-device-floppy' />}>{tpEditItem ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm (shared by all) */}
      <Dialog open={sscDeleteOpen} onClose={() => setSscDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this SSC amount record?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setSscDeleteOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' color='error' onClick={deleteSsc}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={assDeleteOpen} onClose={() => setAssDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this assessor amount record?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setAssDeleteOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' color='error' onClick={deleteAss}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={tpDeleteOpen} onClose={() => setTpDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this TP amount record?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setTpDeleteOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' color='error' onClick={deleteTp}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default MasterDataPage
