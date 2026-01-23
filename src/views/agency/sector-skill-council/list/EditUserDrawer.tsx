// React Imports
import { useState } from 'react';

import type { ChangeEvent } from 'react';

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

import { Avatar } from '@mui/material';

import CustomTextField from '@core/components/mui/TextField';
import { sscImagePath } from '@/configs/customDataConfig';

type Props = {
  open: boolean
  handleClose: () => void
  sscId: number
  sscName: string
  sscCode: string
  username: string
  sscStatus: string
  sscImage?: string
  updateSSCList: () => void
}

type FormDataType = InferInput<typeof schema> & {
  profileImage: File | string
}

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

const EditUserDrawer = ({ open, handleClose, sscId, sscName, sscCode, username, sscStatus, sscImage, updateSSCList }: Props) => {


  // States
  const [loading, setLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [fileInput, setSSCImageInput] = useState<File | string>('');

  // const [formData, setFormData] = useState<FormDataType>({ sscName: sscName, sscCode: sscCode, username: username, status: sscStatus });

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    values: {
      sscName: sscName,
      sscCode: sscCode,
      username: username,
      status: sscStatus.toString(),
      profileImage: ''
    }
  });

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {

    setLoading(true)

    data.profileImage = fileInput as File;

    const formData = new FormData();

    formData.append('sscName', data.sscName);
    formData.append('sscCode', data.sscCode);
    formData.append('username', data.username);
    formData.append('status', data.status);
    formData.append('profileImage', data.profileImage);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills/${sscId}`, {

      method: 'POST',

      // headers: {

      //   'Content-Type': 'application/json'

      // },

      body: formData

    });

    if (res.ok) {
      setLoading(false)
      reset();
      toast.success('SSC record has been updated successfully!',{
        hideProgressBar: false
      });
      updateSSCList();
    } else if (res.status === 422) {
      const result = await res.json();

      Object.entries(result.errors).forEach(([field, messages]) => {
        setError(field as keyof FormDataType, {
          type: 'server',
          message: (messages as string[])[0],
        });
      });

      setLoading(false)

      return
    } else {
      setLoading(false)
      toast.error('Something wrong',{
        hideProgressBar: false
      });

    }

    setLoading(false)
    handleClose();
    reset();
    handleReset();
  }

  const handleReset = () => {
    handleClose();
    reset();
    handleFileInputReset()
  }

  const handleFileInputChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result as string)
      reader.readAsDataURL(files[0])
      setSSCImageInput(files[0])

    }
  }

  const handleFileInputReset = () => {

    setSSCImageInput('')

    setImgSrc(null);
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
        <div className='flex flex-col items-center gap-6'>
            {imgSrc ? (
              <img width={100} className='rounded' src={imgSrc} alt='Profile' />
            ) : (sscImage ? (
              <img width={100} className='rounded' src={sscImagePath(sscId, sscImage)} alt='Profile' />
            ) : (
              <Avatar />
            ))}
            <div className='flex flex-grow flex-col gap-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button component='label' variant='contained' htmlFor='ssc-image'>
                  Upload New Photo
                  <input
                    hidden
                    type='file'
                    accept='image/png, image/jpeg'
                    onChange={handleFileInputChange}
                    id='ssc-image'
                  />
                </Button>
                <Button variant='tonal' color='secondary' onClick={handleFileInputReset}>
                  Reset
                </Button>
              </div>
              <Typography>Allowed JPG, GIF or PNG. Max size of 800K</Typography>
            </div>
          </div>
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
