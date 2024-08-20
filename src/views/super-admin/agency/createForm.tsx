'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { email, object, minLength, string, forward, custom, toTrimmed, regex, maxLength, optional } from 'valibot'

import type { Input } from 'valibot'

// Components Imports
import type { state } from '@prisma/client'

import CustomTextField from '@core/components/mui/TextField'

type FormData = Input<typeof schema>



const schema = object(
  {
    companyName: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'First Name must be at least 3 characters long')
    ]),
    contactPersonFirstName: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'First Name must be at least 3 characters long')
    ]),
    contactPersonLastName: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'Last Name must be at least 3 characters long')
    ]),
    email: string([toTrimmed(), minLength(1, 'This field is required'), email('Please enter a valid email address')]),
    password: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(8, 'Password must be at least 8 characters long')
    ]),
    confirmPassword: string([toTrimmed(), minLength(1, 'This field is required')]),
    phoneNumber: string([
      toTrimmed(),
      minLength(1, 'Phone Number is required'),
      regex(/^[0-9]+$/, 'Phone Number must contain only numbers'),
      minLength(10, 'Phone Number must be 10 digits'),
      maxLength(10, 'Phone Number must be 10 digits')
    ]),
    landlineNumber: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+$/.test(value), 'Landline Number must contain only numbers'),
      maxLength(10, 'Landline Number must be 10 digits')
    ])),
    state: string([toTrimmed(), minLength(1, 'This field is required')]),
    city: string([toTrimmed(), minLength(1, 'This field is required')]),
    pincode: string([
      toTrimmed(),
      minLength(1, "Pin Code is required"),
      minLength(6, "Pin Code length must be 6 digits"),
      maxLength(6, 'Pin Code length must be 6 digits'),
      regex(/^[1-9][0-9]{5}$/, 'Pin Code must contain only numbers and or can\'t starts from 0')
    ]),
    address: string([
      toTrimmed(),
      minLength(1, 'Address is required'),
      maxLength(100, 'Address max length is 100 characters')
    ])
  },
  [
    forward(
      custom(input => input.password === input.confirmPassword, 'Passwords do not match.'),
      ['confirmPassword']
    )
  ]
)

const FormValidationOnScheme = ({ stateData }: { stateData?: state[] }) => {

  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [cityData, setCityData] = useState<any[]>()

  // const [formData, setFormData] = useState<FormData>({
  //   companyName: '',
  //   email: '',
  //   password: '',
  //   confirmPassword: '',
  //   lastName: ''
  // })

  // Hooks
  const {
    control,
    reset,
    resetField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      companyName: '',
      contactPersonFirstName: '',
      contactPersonLastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      landlineNumber: '',
      state: '',
      city: '',
      pincode: '',
      address: ''
    }
  })

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

        // console.log(cities)
        // return response;

      } catch (error) {
        console.error('Error fetching city data:', error);
      }
    } else {
      setCityData([])
    }

  }

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json' // Assuming you're sending JSON data

      },

      body: JSON.stringify(data)

    });

    // console.log(res)

    if (res.ok) {

      reset()

      toast.success('Form Submitted')

    } else {

      toast.error('Something wrong')

    }
  }

  return (
    <Card>
      <CardHeader title='Create Agency' />
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} autoComplete='off' method='POST'>
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Typography variant='body2' className='font-medium'>
                1. Account Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='companyName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Company Name'
                    placeholder='Company PVT LTD'
                    {...(errors.companyName && { error: true, helperText: errors.companyName.message })}
                  />
                )}
              />
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <Controller
                name='lastName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Last Name'
                    placeholder='Doe'
                    {...(errors.lastName && { error: true, helperText: errors.lastName.message })}
                  />
                )}
              />
            </Grid> */}
            <Grid item xs={12} sm={6}>
              <Controller
                name='email'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    type='email'
                    label='Email (This will be your login ID)'
                    placeholder='company@gmail.com'
                    {...(errors.email && { error: true, helperText: errors.email.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='password'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Password'
                    placeholder='············'
                    id='form-validation-scheme-password'
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='confirmPassword'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Confirm Password'
                    placeholder='············'
                    id='form-validation-scheme-confirm-password'
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='phoneNumber'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Phone Number'
                    placeholder=''
                    {...(errors.phoneNumber && { error: true, helperText: errors.phoneNumber.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='landlineNumber'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Landline Number'
                    placeholder=''
                    {...(errors.landlineNumber && { error: true, helperText: errors.landlineNumber.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='contactPersonFirstName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Contact Person First Name'
                    placeholder='John'
                    {...(errors.contactPersonFirstName && { error: true, helperText: errors.contactPersonFirstName.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='contactPersonLastName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Contact Person Last Name'
                    placeholder='Doe'
                    {...(errors.contactPersonLastName && { error: true, helperText: errors.contactPersonLastName.message })}
                  />
                )}
              />
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Last Name'
                placeholder='Doe'

              />
            </Grid> */}
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body2' className='font-medium'>
                2. Address Info
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='state'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='State' {...field}
                    onChange={(e) => {
                      field.onChange(e); // Ensure the field value gets updated in the form state
                      handleStateChange(e.target.value); // Call your custom onChange handler
                    }}
                    {...(errors.state && { error: true, helperText: errors.state.message })}>
                    <MenuItem value=''>Select State</MenuItem>
                    {stateData && stateData.length > 0 ? (
                      stateData?.map((state: any) => (
                        <MenuItem key={state.state_id.toString()} value={state.state_id.toString()}>{state.state_name}</MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No state found </MenuItem>

                    )}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='city'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='City' {...field} {...(errors.city && { error: true, helperText: errors.city.message })}>
                    <MenuItem value=''>Select City</MenuItem>
                    {cityData && cityData.length > 0 ? (
                      cityData.map((city: any) => (
                        <MenuItem key={city.city_id.toString()} value={city.city_id.toString()}>
                          {city.city_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No cities found </MenuItem>
                    )}
                    {/* <MenuItem value='UK'>UK</MenuItem>
                    <MenuItem value='USA'>USA</MenuItem>
                    <MenuItem value='Australia'>Australia</MenuItem>
                    <MenuItem value='Germany'>Germany</MenuItem> */}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='pincode'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Pin Code'
                    placeholder=''
                    {...(errors.pincode && { error: true, helperText: errors.pincode.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='address'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    multiline
                    label='Address'
                    placeholder=''
                    {...(errors.address && { error: true, helperText: errors.address.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} className='flex gap-4'>
              <Button variant='contained' type='submit'>
                Submit
              </Button>
              <Button variant='tonal' color='secondary' type='reset' onClick={() => reset()}>
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </form>
    </Card>
  )

  // return (
  //   <div>
  //    <div>
  //     {stateData?.map((state: any) => (
  //       <div key={state.id}>
  //         {state.state_name}
  //         {/* Your JSX representing each state */}
  //       </div>
  //     ))}
  //   </div>
  //   </div>
  // )
}

export default FormValidationOnScheme
