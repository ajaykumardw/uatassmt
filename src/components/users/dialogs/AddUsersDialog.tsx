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

// Component Imports
import { toast } from 'react-toastify'


import { useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, toTrimmed, minLength } from 'valibot'

import type { Input } from 'valibot'


import DialogCloseButton from '@components/dialogs/DialogCloseButton'

// import { getLocalizedUrl } from '@/utils/i18n'

// import type { Locale } from '@/configs/i18n'

// type AddQPDialogData = {
//   firstName?: string
//   lastName?: string
//   userName?: string
//   billingEmail?: string
//   status?: string
//   taxId?: string
//   contact?: string
//   language?: string[]
//   country?: string
//   useAsBillingAddress?: boolean
// }
// type AddQPDialogData = {
//   sscId?: string
//   qualificationPackId?: string
//   qualificationPackName?: string
//   level?: string
//   version?: string
//   totalTheoryMarks?: string
//   totalVivaMarks?: string
//   totalPracticalMarks?: string
//   totalMarks?: string
//   userName?: string
//   billingEmail?: string
//   status?: string
//   taxId?: string
//   contact?: string
//   language?: string[]
//   country?: string
//   useAsBillingAddress?: boolean
//   isTheoryCutoff?: boolean
//   isVivaCutoff?: boolean
//   isPracticalCutoff?: boolean
//   isOverallCutoff?: boolean
//   theoryCutoffMarks?: string
//   practicalCutoffMarks?: string
//   vivaCutoffMarks?: string
//   overallCutoffMarks?: string
// }
type AddQPDialogData = Input<typeof schema> & {
  nosId?: number
}

type AddQPDialogProps = {
  open: boolean
  nosId?: number
  pcId?: number

  // setOpen: (open: boolean) => void

  handleClose: () => void
  data?: AddQPDialogData

  // updatePCList: () => void
}

// const initialData: AddQPDialogProps['data'] = {
//   firstName: 'Oliver',
//   lastName: 'Queen',
//   userName: 'oliverQueen',
//   billingEmail: 'oliverQueen@gmail.com',
//   status: 'active',
//   taxId: 'Tax-8894',
//   contact: '+ 1 609 933 4422',
//   language: ['English'],
//   country: 'US',
//   useAsBillingAddress: true
// }

const initialData: AddQPDialogData = {
  nosId: 0,
  pcId: '',
  pcName: '',
}

const schema = object(
  {
    pcId: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'PC Id must be at least 3 characters long')
    ]),
    pcName: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'PC name must be at least 3 characters long')
    ]),
  }
)

// const status = ['Status', 'Active', 'Inactive', 'Suspended']

// const languages = ['English', 'Spanish', 'French', 'German', 'Hindi']

// const countries = ['Select Country', 'France', 'Russia', 'China', 'UK', 'US']

// const qpLevel = [
//   {
//     value: 'E',
//     name: 'Easy'
//   },
//   {
//     value: 'M',
//     name: 'Medium'
//   },
//   {
//     value: 'H',
//     name: 'Hard'
//   }
// ]

const AddUsersDialog = ({ open, nosId, pcId, handleClose, data }: AddQPDialogProps) => {

  // States
  const [userData, setUserData] = useState<AddQPDialogProps['data']>(data || initialData)
  const params = useParams()

  const { lang: locale } = params

  useEffect(() => {

    setUserData(data);

  }, [data]);

  // Hooks
  const {
    reset,
    handleSubmit,
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    defaultValues: initialData,
    values: userData
  })

  // const handleClose = () => {
  //   setOpen(false)
  //   setUserData(initialData)
  // }

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();

    data.nosId = nosId;

    if (pcId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pc/${pcId}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        reset();
        toast.success('PC has been updated successfully!', {
          hideProgressBar: false
        });

      } else {
        toast.error('PC not updated. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pc`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {
        reset();

        toast.success('New PC has been created successfully!', {
          hideProgressBar: false
        });

      } else {

        const errorData = await res.json(); // Assuming error response is JSON

        toast.error(errorData.message, {
          hideProgressBar: false
        });


      }
    }

    handleReset();
    handleClose();
  }

  const handleReset = () => {
    reset();
    setUserData(userData || initialData);

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
        {/* {pcId ? 'Edit ' : 'Add '}PC */}
        Select Role
        {/* <Typography component='span' className='flex flex-col text-center'>
          Updating user details will receive a privacy audit.
        </Typography> */}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid item xs={12} className='flex gap-4 flex-wrap'>
              <Link href={`/${locale}/users/create/1`}>
                <Button size='large' variant='tonal' startIcon={<i className='tabler-school text-[28px]' />}>
                  Assessor
                </Button>
              </Link>
              <Link href={`/${locale}/users/create/2`}>
                <Button size='large' variant='tonal' startIcon={<i className='tabler-building-bank text-[28px]' />}>
                  TP
                </Button>
              </Link>
              <Link href={`/${locale}/users/create/3`}>
                <Button size='large' variant='tonal' startIcon={<i className='tabler-user text-[28px]' />}>
                  User
                </Button>
              </Link>
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='pcId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    disabled={true}
                    {...field}
                    {...(errors.pcId && { error: true, helperText: errors.pcId.message })}
                    label='PC ID'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='pcName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.pcName && { error: true, helperText: errors.pcName.message })}
                    label='PC Name'
                  />
                )}
              />
            </Grid> */}
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          {/* <Button variant='contained' type='submit' disabled={loading}>
            {loading && <CircularProgress size={20} color='inherit' />}
            Submit
          </Button> */}
          <Button variant='tonal' color='secondary' type='reset' onClick={handleReset}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddUsersDialog
