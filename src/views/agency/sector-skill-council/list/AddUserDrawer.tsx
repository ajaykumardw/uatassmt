// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Component Imports
import { toast } from 'react-toastify'

import { InputAdornment } from '@mui/material'

import { Controller,  useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, minLength, string, forward, check, trim, pipe } from "valibot"

import type { InferInput } from 'valibot'

import CustomTextField from '@core/components/mui/TextField'

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

type FormDataType = InferInput<typeof schema>

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
      status: pipe(string(), trim() , minLength(1, 'This field is required'))
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

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    defaultValues: {
      sscName: '',
      sscCode: '',
      username: '',
      password: '',
      confirmPassword: '',
      status: '1'
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {
    // e.preventDefault()

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json' // Assuming you're sending JSON data

      },

      body: JSON.stringify(data)

    });


    if (res.ok) {

      reset();

      toast.success('New SSC has been created successfully!',{
        hideProgressBar: false
      });
      updateSSCList();

    } else {

      toast.error('Something went wrong!',{
        hideProgressBar: false
      });

    }

    handleClose()
    reset()

    // setFormData(initialData)
  }

  const handleReset = () => {
    handleClose()
    reset()

    // setFormData({
    //   sscName: '',
    //   sscCode: '',
    //   username: '',
    //   password: '',
    //   confirmPassword: '',
    //   status: '1'
    // })
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
            <Button variant='contained' type='submit'>
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
