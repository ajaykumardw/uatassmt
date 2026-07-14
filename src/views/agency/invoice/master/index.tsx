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
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'

import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'
import { MenuProps } from '@/configs/customDataConfig'

import type { SSCType } from '@/types/sectorskills/sscType'
import type { SchemesType } from '@/types/schemes/schemesType'

type MasterDataItem = {
  id: number
  ssc_id: number
  ssc_name: string
  scheme_id: number
  scheme_name: string
  amount_per_candidate: number
  status: number
}

type Props = {
  data: MasterDataItem[]
  updateData: () => void
}

const initialFormData = {
  ssc_id: '',
  scheme_id: '',
  amount_per_candidate: ''
}

const MasterDataPage = ({ data, updateData }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [sscList, setSscList] = useState<SSCType[]>([])
  const [schemeList, setSchemeList] = useState<SchemesType[]>([])
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)
      .then(res => res.json())
      .then(res => setSscList(Array.isArray(res) ? res : []))
      .catch(() => {})

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes`)
      .then(res => res.json())
      .then(res => setSchemeList(Array.isArray(res) ? res : []))
      .catch(() => {})
  }, [])

  const openAddDialog = () => {
    setEditingItem(null)
    setFormData(initialFormData)
    setDialogOpen(true)
  }

  const openEditDialog = (item: MasterDataItem) => {
    setEditingItem(item)
    setFormData({
      ssc_id: item.ssc_id.toString(),
      scheme_id: item.scheme_id.toString(),
      amount_per_candidate: item.amount_per_candidate.toString()
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.ssc_id || !formData.scheme_id || !formData.amount_per_candidate) {
      toast.error('All fields are required')

      return
    }

    setSaving(true)

    try {
      const url = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/invoice/master-data/${editingItem.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/invoice/master-data`

      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssc_id: Number(formData.ssc_id),
          scheme_id: Number(formData.scheme_id),
          amount_per_candidate: Number(formData.amount_per_candidate)
        })
      })

      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success(editingItem ? 'Master data updated successfully' : 'Master data created successfully')
        setDialogOpen(false)
        updateData()
      } else {
        toast.error(result.message || 'Failed to save master data')
      }
    } catch {
      toast.error('Failed to save master data')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/master-data/${deleteId}`, {
        method: 'DELETE'
      })

      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Master data deleted successfully')
        setDeleteConfirmOpen(false)
        setDeleteId(null)
        updateData()
      } else {
        toast.error(result.message || 'Failed to delete master data')
      }
    } catch {
      toast.error('Failed to delete master data')
    }
  }

  const toggleStatus = async (item: MasterDataItem) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/master-data/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: item.status === 1 ? 0 : 1 })
      })

      const result = await res.json()

      if (res.ok && result.status === 'Success') {
        toast.success('Status updated successfully')
        updateData()
      } else {
        toast.error(result.message || 'Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Invoice Master Data'
            subheader='Manage SSC-wise scheme amounts'
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openAddDialog}>
                Add New
              </Button>
            }
          />
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
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>No data available</TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.ssc_name}</TableCell>
                        <TableCell>{item.scheme_name}</TableCell>
                        <TableCell>{Number(item.amount_per_candidate).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={item.status === 1 ? 'Active' : 'Inactive'}
                            color={item.status === 1 ? 'success' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => openEditDialog(item)} size='small'>
                            <i className='tabler-edit text-[22px] text-textSecondary' />
                          </IconButton>
                          <IconButton
                            onClick={() => { setDeleteId(item.id); setDeleteConfirmOpen(true) }}
                            size='small'
                          >
                            <i className='tabler-trash text-[22px] text-textSecondary' />
                          </IconButton>
                          <IconButton onClick={() => toggleStatus(item)} size='small'>
                            <i className={`tabler-${item.status === 1 ? 'pause-circle' : 'play-circle'} text-[22px] text-textSecondary`} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? 'Edit Master Data' : 'Add Master Data'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-2'>
            <Grid item xs={12}>
              <CustomTextField
                select
                fullWidth
                label='Select SSC'
                value={formData.ssc_id}
                onChange={e => setFormData({ ...formData, ssc_id: e.target.value })}
                SelectProps={{ MenuProps }}
              >
                <MenuItem value=''>Select SSC</MenuItem>
                {sscList.map(ssc => (
                  <MenuItem key={ssc.id} value={ssc.id.toString()}>{ssc.ssc_name}</MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                select
                fullWidth
                label='Select Scheme'
                value={formData.scheme_id}
                onChange={e => setFormData({ ...formData, scheme_id: e.target.value })}
                SelectProps={{ MenuProps }}
              >
                <MenuItem value=''>Select Scheme</MenuItem>
                {schemeList.map(scheme => (
                  <MenuItem key={scheme.id} value={scheme.id.toString()}>{scheme.scheme_name}</MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                label='Amount Per Candidate'
                type='number'
                value={formData.amount_per_candidate}
                onChange={e => setFormData({ ...formData, amount_per_candidate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <i className='tabler-device-floppy' />}>
            {editingItem ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this master data entry?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color='secondary'>Cancel</Button>
          <Button variant='contained' color='error' onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default MasterDataPage
