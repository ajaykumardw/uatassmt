'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

import { toast } from 'react-toastify'

// Components Imports

// Styled Component Imports
import { Controller, useForm } from 'react-hook-form';

import type { SubmitHandler } from 'react-hook-form';

import { object, string, toTrimmed, minLength, optional, custom, maxLength, regex } from 'valibot'

import type { Input } from 'valibot';

import { valibotResolver } from '@hookform/resolvers/valibot'

import type { city, state } from '@prisma/client'

import { CircularProgress } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'

import { generateRandomPassword } from '@/utils/passwordGenerator'

// type FormDataType = {
//   username: string
//   email: string
//   password: string
//   isPasswordShown: boolean
//   confirmPassword: string
//   isConfirmPasswordShown: boolean
//   firstName: string
//   lastName: string
//   state: string
//   city: string
//   pinCode: string
//   address: string
//   panCardNumber?: string
//   gstNumber: string
//   country: string
//   language: string[]
//   date: Date | null
//   phoneNumber: string
// }

type FormDataType = Input<typeof schema>

const schema = object(
  {
    username: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    email: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    password: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    firstName: string([
      toTrimmed(),
      minLength(1, 'This field is required.'),
      maxLength(50, 'The maximum length for First name is 50 characters.')
    ]),
    lastName: optional(string([
      toTrimmed(),
      maxLength(50, 'The maximum length for First name is 50 characters.')
    ])),
    state: string([
      toTrimmed(),
      minLength(1, 'This field is required.')
    ]),
    city: optional(string([
      toTrimmed(),
    ])),
    pinCode: optional(string([
      toTrimmed(),
      minLength(6, "Pin Code length must be 6 digits"),
      custom((value) => !value || /^[1-9][0-9]{5}$/.test(value), 'Pin Code must contain only numbers and or can\'t starts from 0'),
      maxLength(6, 'Pin Code length must be 6 digits'),
    ])),
    address: string([
      toTrimmed(),
      minLength(1, 'First name is required.'),
      maxLength(191, 'The maximum length for First name is 191 characters.')
    ]),
    phoneNumber: string([
      toTrimmed(),
      minLength(1, 'Phone Number is required'),
      regex(/^[0-9]+$/, 'Phone Number must contain only numbers'),
      minLength(10, 'Phone Number must be 10 digits'),
      maxLength(10, 'Phone Number must be 10 digits')
    ]),
    panCardNumber: optional(string([
      toTrimmed(),
      custom((value) => !value || value.length === 10, 'Pan Card Number must be 10 characters'),
    ])),
    gstNumber: string([
      toTrimmed(),
      minLength(1, 'This field is required.'),
      regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z1-9]Z[0-9A-Z]$/, 'GST number must be 15 characters long and follow the correct format (e.g., 12ABCDE3456F1Z7).'),
    ])
  }
)

const initialData = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  state: '',
  city: '',
  pinCode: '',
  address: '',
  panCardNumber: '',
  gstNumber: '',
  phoneNumber: ''
}

const TPForm = ({ id }:{id?: number}) => {

  // States
  const [formData] = useState<FormDataType>(initialData)

  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [stateData, setStateData] = useState<state[]>([]);
  const [cityData, setCityData] = useState<city[]>([]);
  const [loading, setLoading] = useState(false);

  const getStateData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/state`, {method: 'POST', headers: {'Content-Type': 'application/json', }})

    if (!res.ok) {
      throw new Error('Failed to fetch stateData')
    }

    const allStates = await res.json()

    setStateData(allStates)

  }

  useEffect(() => {

    getStateData()

  }, []);

  const handleStateChange = async (state: string) => {

    resetField("city")

    if (state) {
      try {

        const cities = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/${state}`).then(function (response) { return response.json() });

        if (cities.length > 0) {

          setCityData(cities)

        } else {

          setCityData([])

        }


      } catch (error) {

        console.error('Error fetching city data:', error);
      }
    } else {
      setCityData([])
    }

  }

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const {
    control,

    reset,
    resetField,
    handleSubmit,

    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    values: formData
  })

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {
    console.log('form data', data);
    setLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-partner`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json'

      },

      body: JSON.stringify(data)
    });

    if(res.ok){
      setLoading(false);
      handleReset();

      toast.success('New Training Partner has been created successfully!', {
        hideProgressBar: false
      });
    } else {
      setLoading(false);
      toast.error('Something went wrong!', {
        hideProgressBar: false
      });
    }

    setLoading(false);
    handleReset();
  }

  const handleReset = () => {
    resetField("password", {defaultValue: ""})
    reset();
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();

    resetField("password", {defaultValue: newPassword})
  }


  return (
    <Card>
      <CardHeader title={`${id ? 'Edit' : 'Create'} Training Partner`} />
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Typography variant='body2' className='font-medium'>
                1. Training Partner Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='username'
                rules={{ required: true }}
                render={({field}) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='TP Login Id'
                    placeholder=''
                    required={true}
                    {...(errors.username && { error: true, helperText: errors.username.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='email'
                rules={{ required: true }}
                render={({field}) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type='email'
                    label='Email'
                    required={true}
                    {...(errors.email && { error: true, helperText: errors.email.message })}

                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} className='flex items-end gap-4'>
              <Controller
                control={control}
                name='password'
                rules={{ required: true }}
                render={({field}) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    label='Password'
                    placeholder='············'
                    type={isPasswordShown ? 'text' : 'password'}
                    {...field}
                    {...(errors.password && { error: true, helperText: errors.password.message })}
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
                  />
                )}
              />
              <Button variant='tonal' onClick={handleGeneratePassword}>Generate</Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='phoneNumber'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    label='Phone Number'
                    {...field}
                    {...field}
                    {...(errors.phoneNumber && { error: true, helperText: errors.phoneNumber.message })}
                  />
                )}
              />
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Password'
                placeholder='············'
                id='form-layout-separator-password'
                type={formData.isPasswordShown ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle password visibility'
                      >
                        <i className={formData.isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Confirm Password'
                placeholder='············'
                id='form-layout-separator-confirm-password'
                type={formData.isConfirmPasswordShown ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle confirm password visibility'
                      >
                        <i className={formData.isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid> */}
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body2' className='font-medium'>
                2. Personal Info
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='firstName'
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='First Name'
                    {...(errors.firstName && { error: true, helperText: errors.firstName.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='lastName'
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Last Name'
                    {...(errors.lastName && { error: true, helperText: errors.lastName.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='state'
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label='State'
                    required={true}
                    {...field}
                    {...(errors.state && { error: true, helperText: errors.state.message })}
                    onChange={e => {
                      handleStateChange(e.target.value)
                      field.onChange(e)
                    }}
                  >
                    <MenuItem value=''>Select State</MenuItem>
                    {stateData && stateData.length > 0 ? (
                      stateData?.map((state, index) => (
                        <MenuItem key={index} value={state?.state_id?.toString()}>{state.state_name}</MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No states found</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='city'
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label='City'
                    required={true}
                    {...field}
                    {...(errors.city && { error: true, helperText: errors.city.message })}
                  >
                    <MenuItem value=''>Select City</MenuItem>
                    {cityData && cityData.length > 0 ? (
                      cityData.map((city) => (
                        <MenuItem key={city.city_id.toString()} value={city.city_id.toString()}>
                          {city.city_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No cities found </MenuItem>
                    )}

                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='pinCode'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    label='Pin code'
                    {...field}
                    {...(errors.pinCode && { error: true, helperText: errors.pinCode.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='address'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    multiline
                    label='Address'
                    {...field}
                    {...(errors.address && { error: true, helperText: errors.address.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='panCardNumber'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label='Pan Card No.'
                    {...field}
                    {...(errors.panCardNumber && { error: true, helperText: errors.panCardNumber.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='gstNumber'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      required={true}
                      label='GST No.'
                      {...field}
                      {...(errors.gstNumber && { error: true, helperText: errors.gstNumber.message })}
                    />
                  )}
                />
              </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions>
          <Button type='submit' variant='contained' className='mie-2' disabled={loading}>
            {loading && <CircularProgress size={20} color='inherit' />}
            Submit
          </Button>
          <Button
            type='reset'
            variant='tonal'
            color='secondary'
            onClick={() => {
              handleReset()
            }}
          >
            Reset
          </Button>
        </CardActions>
      </form>
    </Card>
  )
}

export default TPForm
