// React Imports
import { useState } from 'react';

// MUI Imports
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

// Component Imports
import { toast } from 'react-toastify';

import { Controller, useForm } from 'react-hook-form';

import type { SubmitHandler } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot';

import { object, minLength, string, trim, pipe } from "valibot"

import type { InferInput } from 'valibot';

import CustomTextField from '@core/components/mui/TextField';

type Props = {
  open: boolean
  handleClose: () => void
  sscId: number
  sscName: string
  sscCode: string
  username: string
  sscStatus: string
  updateSSCList: () => void
}

type FormDataType = InferInput<typeof schema>

// Vars
// const initialData = {
//   sscName: 'ddfsgsdfg',
//   sscCode: '',
//   username: '',
//   status: ''
// }

const schema = object(
  {
    sscName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
    sscCode: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
    username: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Last Name must be at least 3 characters long')),
    status: pipe(string(), trim() , minLength(1, 'This field is required'))
  }
)

const EditUserDrawer = ({ open, handleClose, sscId, sscName, sscCode, username, sscStatus, updateSSCList }: Props) => {


  // States
  const [loading, setLoading] = useState(false);

  // const [formData, setFormData] = useState<FormDataType>({ sscName: sscName, sscCode: sscCode, username: username, status: sscStatus });

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    values: {
      sscName: sscName,
      sscCode: sscCode,
      username: username,
      status: sscStatus.toString()
    }
  });

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {

    setLoading(true)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills/${sscId}`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json'

      },

      body: JSON.stringify(data)

    });

    if (res.ok) {
      setLoading(false)
      reset();
      toast.success('SSC record has been updated successfully!',{
        hideProgressBar: false
      });
      updateSSCList();
    } else {
      setLoading(false)
      toast.error('Something wrong',{
        hideProgressBar: false
      });

    }

    setLoading(false)
    handleClose();
    reset();
  }

  const handleReset = () => {
    handleClose();
    reset();
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>Edit SSC</Typography>
        <IconButton onClick={handleReset}>
          <i className='tabler-x text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={handleSubmit(onSubmit)} method='POST' className='flex flex-col gap-6 p-6'>
          <Controller
            name='sscName'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='SSC Name'
                placeholder='Sector Skills Council Name'
                {...(errors.sscName && { error: true, helperText: errors.sscName.message })}
              />
            )}
            />
          <Controller
            name='sscCode'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='SSC Code'
                placeholder='Sector Skills Council Code'
                {...(errors.sscCode && { error: true, helperText: errors.sscCode.message })}
              />
            )}
          />
          <Controller
            name='username'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Username'
                placeholder='Username'
                {...(errors.username && { error: true, helperText: errors.username.message })}
              />
            )}
          />
          <Controller
            name='status'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField select fullWidth id='edit-select_status' label='Select Status' {...field}
                {...(errors.status && { error: true, helperText: errors.status.message })}>
                <MenuItem value='1'>Active</MenuItem>
                <MenuItem value='0'>Inactive</MenuItem>
              </CustomTextField>
            )}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading && <CircularProgress size={20} color='inherit' />}
              Submit
            </Button>
            <Button variant='tonal' color='error' type='reset' onClick={() => handleReset()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  );
}

export default EditUserDrawer
