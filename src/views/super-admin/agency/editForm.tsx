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
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { email, object, minLength, string, check, trim, regex, maxLength, optional, pipe } from "valibot"

import type { InferInput } from 'valibot'

// Components Imports
import type { city, state, users } from '@prisma/client'

import CustomTextField from '@core/components/mui/TextField'

type FormData = InferInput<typeof schema>



const schema = object(
  {
    companyName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
    contactPersonFirstName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
    contactPersonLastName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Last Name must be at least 3 characters long')),
    email: pipe(string(), trim() , minLength(1, 'This field is required') , email('Please enter a valid email address')),
    phoneNumber: pipe(string(), trim() , minLength(1, 'Phone Number is required') , regex(/^[0-9]+$/, 'Phone Number must contain only numbers') , minLength(10, 'Phone Number must be 10 digits') , maxLength(10, 'Phone Number must be 10 digits')),
    landlineNumber: optional(pipe(string(), trim() , check((value) => !value || /^[0-9]+$/.test(value), 'Landline Number must contain only numbers') , maxLength(10, 'Landline Number must be 10 digits'))),
    state: pipe(string(), trim() , minLength(1, 'This field is required')),
    city: pipe(string(), trim() , minLength(1, 'This field is required')),
    pincode: pipe(string(), trim() , minLength(1, "Pin Code is required") , minLength(6, "Pin Code length must be 6 digits") , maxLength(6, 'Pin Code length must be 6 digits') , regex(/^[1-9][0-9]{5}$/, 'Pin Code must contain only numbers and or can\'t starts from 0')),
    address: pipe(string(), trim() , minLength(1, 'Address is required') , maxLength(100, 'Address max length is 100 characters'))
  }
)

const AgencyEditForm = ({ currentAgency, stateData, citiesData }: { stateData?: state[], citiesData: city[], currentAgency?: users }) => {

  // States
  const [cityData, setCityData] = useState<any[]>(citiesData)

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
    values: {
      companyName: currentAgency?.company_name || '',
      contactPersonFirstName: currentAgency?.first_name || '',
      contactPersonLastName: currentAgency?.last_name || '',
      email: currentAgency?.email || '',
      phoneNumber: currentAgency?.mobile_no || '',
      landlineNumber: '',
      state: currentAgency?.state_id?.toString() || '',
      city: currentAgency?.city_id?.toString() || '',
      pincode: currentAgency?.pin_code || '',
      address: currentAgency?.address || ''
    }
  })

  const handleStateChange = async (state: string) => {

    // reset({"city": ''})
    resetField("city", {defaultValue: ""})

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

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {

    console.log(data);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency/${currentAgency?.id}`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json' // Assuming you're sending JSON data

      },

      body: JSON.stringify(data)

    });

    console.log(res)

    if (res.ok) {

      reset()

      toast.success('Form Submitted')

    } else {

      toast.error('Something wrong')

    }
  }

  return (
    <Card>
      <CardHeader title='Edit Agency' />
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
                name='phoneNumber'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
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
                  <CustomTextField select fullWidth label='State' {...field}
                    onChange={(e) => {
                      field.onChange(e); // Ensure the field value gets updated in the form state
                      handleStateChange(e.target.value); // Call your custom onChange handler
                    }}
                    {...(errors.state && { error: true, helperText: errors.state.message })}>
                    <MenuItem value=''>Select State</MenuItem>
                    {stateData?.map((state: state) => (
                      <MenuItem key={state?.state_id?.toString()} value={state?.state_id?.toString()}>{state?.state_name}</MenuItem>
                    ))}
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
                  <CustomTextField select fullWidth label='City' {...field} {...(errors.city && { error: true, helperText: errors.city.message })}>
                    <MenuItem value=''>Select City</MenuItem>
                    {cityData && cityData.length > 0 ? (
                      cityData.map((city) => (
                        <MenuItem key={city?.city_id?.toString()} value={city?.city_id?.toString()}>
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
              <Button variant='tonal' color='secondary' type='reset' onClick={() => {setCityData(citiesData || []); resetField("city", {defaultValue: currentAgency?.city_id?.toString() || ''}); reset();}}>
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

export default AgencyEditForm
