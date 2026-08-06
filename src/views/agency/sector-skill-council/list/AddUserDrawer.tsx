// React Imports
import { useState } from 'react'

import type { ChangeEvent } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Component Imports
import { toast } from 'react-toastify'

import { Avatar, CircularProgress, InputAdornment } from '@mui/material'

import { Controller,  useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, minLength, string, forward, check, trim, pipe, optional } from "valibot"

import type { InferInput } from 'valibot'

import CustomTextField from '@core/components/mui/TextField'
import { TypeOfAwardingEntityOptions } from '@/configs/customDataConfig'

type Props = {
  open: boolean
  handleClose: () => void
  updateSSCList: () => void
}

// type FormDataType = {
//   sscName: string
//   sscCode: string
//   username: string
//   password: string
//   confirmPassword: string
//   status: string
// }

type FormDataType = InferInput<typeof schema> & {
  profileImage: File | string
}

// Vars
// const initialData = {
//   sscName: '',
//   sscCode: '',
//   username: '',
//   password: '',
//   confirmPassword: '',
//   status: ''
// }


const schema = pipe(
  object(
    {
      sscName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
      sscCode: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
      username: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Last Name must be at least 3 characters long')),
      password: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(8, 'Password must be at least 8 characters long')),
      confirmPassword: pipe(string(), trim() , minLength(1, 'This field is required')),
      status: pipe(string(), trim() , minLength(1, 'This field is required')),
      sector: optional(pipe(string(), trim())),
      typeOfAwardingBody: optional(pipe(string(), trim()))
    }
  ),
  forward(
    check(input => input.password === input.confirmPassword, 'Passwords do not match.'),
    ['confirmPassword']
  )
)

const AddUserDrawer = ({ open, handleClose, updateSSCList }: Props) => {

  // States
  // const [formData, setFormData] = useState<FormDataType>(initialData)

  const [loading, setLoading] = useState(false);
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [fileInput, setSSCImageInput] = useState<File | string>('');

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    defaultValues: {
      sscName: '',
      sscCode: '',
      username: '',
      password: '',
      confirmPassword: '',
      status: '1',
      sector: '',
      typeOfAwardingBody: '',
      profileImage: ''
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {
    // e.preventDefault()

    setLoading(true);

    data.profileImage = fileInput as File;

    const formData = new FormData();

    formData.append('sscName', data.sscName);
    formData.append('sscCode', data.sscCode);
    formData.append('username', data.username);
    formData.append('password', data.password);
    formData.append('confirmPassword', data.confirmPassword);
    formData.append('status', data.status);
    formData.append('sector', data.sector || '');
    formData.append('typeOfAwardingBody', data.typeOfAwardingBody || '');
    formData.append('profileImage', data.profileImage);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`, {

      method: 'POST',

      // headers: {

      //   'Content-Type': 'application/json' // Assuming you're sending JSON data

      // },

      body: formData

    });


    if (res.ok) {

      reset();

      setLoading(false);

      toast.success('New SSC has been created successfully!',{
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

      toast.error('Something went wrong!',{
        hideProgressBar: false
      });

    }

    handleClose()
    reset()
    handleReset();
    setLoading(false);

    // setFormData(initialData)
  }

  const handleReset = () => {
    handleClose()
    reset()
    handleFileInputReset()

    // setFormData({
    //   sscName: '',
    //   sscCode: '',
    //   username: '',
    //   password: '',
    //   confirmPassword: '',
    //   status: '1'
    // })
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
        <Typography variant='h5'>Add New SSC</Typography>
        <IconButton onClick={handleReset}>
          <i className='tabler-x text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6 p-6'>
          <div className='flex flex-col items-center gap-6'>
            {imgSrc ? (
              <img width={100} className='rounded' src={imgSrc} alt='Profile' />
            ) : (
              <Avatar />
            )}
            <div className='flex flex-grow flex-col gap-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button component='label' variant='contained' htmlFor='account-settings-upload-image'>
                  Upload New Photo
                  <input
                    hidden
                    type='file'
                    accept='image/png, image/jpeg'
                    onChange={handleFileInputChange}
                    id='account-settings-upload-image'
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
            name='sector'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Sector'
                placeholder='Sector'
                {...(errors.sector && { error: true, helperText: errors.sector.message })}
              />
            )}
          />
          <Controller
            name='typeOfAwardingBody'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                label='Type of Awarding Body'
                {...field}
                value={field.value || ''}
                {...(errors.typeOfAwardingBody && { error: true, helperText: errors.typeOfAwardingBody.message })}
              >
                <MenuItem value=''>Select Type of Awarding Body</MenuItem>
                {TypeOfAwardingEntityOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                ))}
              </CustomTextField>
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
            name='password'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Password'
                placeholder='············'
                id='form-validation-password'
                type={isPasswordShown ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle password visibility'
                      >
                        <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                {...(errors.password && { error: true, helperText: errors.password.message })}
              />
            )}
          />
          <Controller
            name='confirmPassword'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Confirm Password'
                placeholder='············'
                id='form-validation-confirm-password'
                type={isConfirmPasswordShown ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle password visibility'
                      >
                        <i className={isConfirmPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                {...(errors['confirmPassword'] && { error: true, helperText: errors['confirmPassword'].message })}
              />
            )}
          />
          <Controller
            name='status'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField select fullWidth id='select_status' label='Select Status' {...field}
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
  )
}

export default AddUserDrawer
