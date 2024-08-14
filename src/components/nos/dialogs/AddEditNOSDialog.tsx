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

import { object, string, toTrimmed, minLength, maxLength } from 'valibot'

import type { Input } from 'valibot'

import type { SSCType } from '@/types/sectorskills/sscType'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

type AddQPDialogData = Input<typeof schema>

type AddQPDialogProps = {
  open: boolean
  nosId?: number

  // setOpen: (open: boolean) => void

  handleClose: () => void
  data?: AddQPDialogData
  updateNOSList: () => void
}


const initialData: AddQPDialogData = {
  sscId: '',
  nosId: '',
  nosName: ''
}

const schema = object(
  {
    sscId: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    nosId: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'NOS Id must be at least 3 characters long'),
      maxLength(100, 'The maximum length for a NOS Id is 100 characters.')
    ]),
    nosName: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'NOS name must be at least 3 characters long'),
      maxLength(255, 'The maximum length for a NOS name is 255 characters.')
    ])
  }
)

const AddEditNOSDialog = ({ open, nosId, handleClose, updateNOSList, data }: AddQPDialogProps) => {

  // States
  const [userData, setUserData] = useState<AddQPDialogProps['data']>(data || initialData)
  const [loading, setLoading] = useState(false);
  const [ssData, setSscUsers] = useState<SSCType[]>([])


  const getSSCData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch sector skills council')
    }

    const userData = await res.json();

    setSscUsers(userData);

  }


  useEffect(() => {

    setUserData(data);
    getSSCData()
  }, [data]);

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    values: userData
  })

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();

    setLoading(true)

    if (nosId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos/${nosId}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        setLoading(false);
        reset();
        toast.success('NOS has been updated successfully!', {
          hideProgressBar: false
        });
        updateNOSList();
      } else {
        setLoading(false);
        toast.error('NOS not updated. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {
        setLoading(false)
        reset();

        toast.success('New NOS has been created successfully!', {
          hideProgressBar: false
        });
        updateNOSList();

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
        {nosId ? 'Edit ' : 'Add '}NOS
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='sscId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    select
                    label='Sector Skill Council'
                    {...field}
                    {...(errors.sscId && { error: true, helperText: errors.sscId.message })}

                  // value={userData?.sscId}
                  // onChange={e => setUserData({ ...userData, sscId: e.target.value })}
                  >
                    {ssData.map((ssc, index) => (
                      <MenuItem key={index} value={ssc.id.toString()}>
                        {ssc.ssc_name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='nosId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    disabled={nosId ? true : false}
                    {...field}
                    {...(errors.nosId && { error: true, helperText: errors.nosId.message })}
                    label='NOS ID'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='nosName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.nosName && { error: true, helperText: errors.nosName.message })}
                    label='NOS Name'
                  />
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

export default AddEditNOSDialog
