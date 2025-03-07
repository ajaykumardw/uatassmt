'use client'


// React Imports
import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

// MUI Imports

import Link from 'next/link'

import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import type { role } from '@prisma/client'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import { userRoleObj } from '@/configs/customDataConfig'

type AddUsersDialogProps = {
  open: boolean

  handleClose: () => void
  rolesData?: role[]

}

const AddUsersDialog = ({ open, handleClose, rolesData }: AddUsersDialogProps) => {

  // States
  const [roles, setRoles] = useState<AddUsersDialogProps['rolesData']>(rolesData || [])
  const params = useParams()

  const { lang: locale } = params

  useEffect(() => {

    if (rolesData) setRoles(rolesData);

  }, [rolesData]);

  const handleReset = () => {
    setRoles(roles || []);

    handleClose();
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleReset}
      maxWidth='md'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleReset} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Select Role
      </DialogTitle>
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <Grid container spacing={5}>
          <Grid item xs={12} className='flex gap-4 flex-wrap'>
            {roles?.map((role, index) => (
              <Link key={index} href={`/${locale}/users/create/${role.id}`}>
                <Button size='large' variant='tonal' startIcon={<i className={`${userRoleObj[role.id].icon} text-[28px]`} />}>
                  {role.name}
                </Button>
              </Link>
            ))}
            {/* <Link href={`/${locale}/users/create/1`}>
              <Button size='large' variant='tonal' startIcon={<i className='tabler-school text-[28px]' />}>
                Assessor
              </Button>
            </Link>
            <Link href={`/${locale}/users/create/2`}>
              <Button size='large' variant='tonal' startIcon={<i className='tabler-heart-handshake text-[28px]' />}>
                TP
              </Button>
            </Link>
            <Link href={`/${locale}/users/create/3`}>
              <Button size='large' variant='tonal' startIcon={<i className='tabler-heart-rate-monitor text-[28px]' />}>
                Monitoring Team
              </Button>
            </Link>
            <Link href={`/${locale}/users/create/4`}>
              <Button size='large' variant='tonal' startIcon={<i className='tabler-calculator text-[28px]' />}>
                Accounts
              </Button>
            </Link> */}
            {/* <Link href={`/${locale}/users/create/3`}>
              <Button size='large' variant='tonal' startIcon={<i className='tabler-user text-[28px]' />}>
                User
              </Button>
            </Link> */}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
        <Button variant='tonal' color='secondary' type='reset' onClick={handleReset}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddUsersDialog
