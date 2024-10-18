'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import { CircularProgress } from '@mui/material'

// Component Imports
import { toast } from 'react-toastify'


import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, trim, minLength, maxLength, pipe } from "valibot"

import type { InferInput } from 'valibot'

// import type { SSCType } from '@/types/sectorskills/sscType'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

type AddQPDialogData = InferInput<typeof schema> & {
  parentId?: number
}

type AddQPDialogProps = {
  open: boolean
  schemeId?: number
  parentId?: number

  // setOpen: (open: boolean) => void

  handleClose: () => void
  data?: AddQPDialogData
  updateSchemeList: () => void
}


const initialData: AddQPDialogData = {
  schemeName: '',
  schemeCode: '',
  status: '1'
}

// const schema = object(
//   {
//     sscId: pipe(string(), trim() , minLength(1, 'This field is required')),
//     nosId: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'NOS Id must be at least 3 characters long') , maxLength(100, 'The maximum length for a NOS Id is 100 characters.')),
//     nosName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'NOS name must be at least 3 characters long') , maxLength(255, 'The maximum length for a NOS name is 255 characters.'))
//   }
// )
const schema = object(
  {
    schemeName: pipe(string(), trim() , minLength(1, 'This field is required'), maxLength(190, 'The maximum length for a NOS name is 190 characters.')),
    schemeCode: pipe(string(), trim() , minLength(1, 'This field is required'), maxLength(40, 'The maximum length for a NOS Id is 40 characters.')),
    status: pipe(string(), trim() , minLength(1, 'This field is required')),
  }
)

const AddEditSchemeDialog = ({ open, schemeId, parentId, handleClose, updateSchemeList, data }: AddQPDialogProps) => {

  // States
  const [schemeData, setSchemeData] = useState<AddQPDialogProps['data']>(data || initialData)
  const [loading, setLoading] = useState(false);

  // const [ssData, setSscUsers] = useState<SSCType[]>([])


  // const getSSCData = async () => {
  //   // Vars
  //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

  //   if (!res.ok) {
  //     throw new Error('Failed to fetch sector skills council')
  //   }

  //   const userData = await res.json();

  //   setSscUsers(userData);

  // }


  useEffect(() => {

    setSchemeData(data);

    // getSSCData()
  }, [data]);

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    values: schemeData
  })

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();

    data.parentId = parentId

    setLoading(true)

    if (schemeId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes/${schemeId}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        setLoading(false);
        reset();
        toast.success(`${parentId ? 'Sub Scheme' : 'Scheme'} has been updated successfully!`, {
          hideProgressBar: false
        });
        updateSchemeList();
      } else {
        setLoading(false);
        toast.error(`${parentId ? 'Sub Scheme' : 'Scheme'} not updated. Something went wrong here!`, {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        setLoading(false)
        reset();

        toast.success(`New ${parentId ? 'Sub Scheme' : 'Scheme'} has been created successfully!`, {
          hideProgressBar: false
        });
        updateSchemeList();

      } else {
        setLoading(false)
        toast.error('Something went wrong!', {
          hideProgressBar: false
        });

      }
    }

    setLoading(false)
    handleReset();
    handleClose();
  }

  const handleReset = () => {
    reset();
    setSchemeData(schemeData || initialData);

    handleClose();
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleReset}
      maxWidth='sm'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleReset} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {schemeId ? 'Edit ' : 'Add '}{ parentId ? 'Sub Scheme' : 'Scheme'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='schemeName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.schemeName && { error: true, helperText: errors.schemeName.message })}
                    label='Name'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='schemeCode'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.schemeCode && { error: true, helperText: errors.schemeCode.message })}
                    label='Code'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='status'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    select
                    label='Status'
                    {...field}
                    {...(errors.status && { error: true, helperText: errors.status.message })}
                  >
                    <MenuItem value="1">Active</MenuItem>
                    <MenuItem value="0">Inactive</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit' disabled={loading}>
            {loading && <CircularProgress size={20} color='inherit' />}
            Submit
          </Button>
          <Button variant='tonal' color='secondary' type='reset' onClick={handleReset}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddEditSchemeDialog
