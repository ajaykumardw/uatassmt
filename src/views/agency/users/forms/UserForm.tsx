'use client'

// React Imports
import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'


import { toast } from 'react-toastify'

import { Controller, useForm } from 'react-hook-form';

// Components Imports

// Styled Component Imports
import type { SubmitHandler } from 'react-hook-form';

import { object, string, trim, minLength, optional, check, maxLength, pipe } from "valibot"

import type { InferInput } from 'valibot';

import { valibotResolver } from '@hookform/resolvers/valibot'

import type { city, state } from '@prisma/client'


import { CircularProgress } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'

import { generateRandomPassword } from '@/utils/passwordGenerator'

import type { UsersType } from '@/types/users/usersType'

import { getLocalizedUrl } from '@/utils/i18n'

import type { Locale } from '@configs/i18n'

import { MenuProps } from '@/configs/customDataConfig'

type FormDataType = InferInput<typeof schema> & {
  role: string
}

const schema = object(
  {
    username: pipe(string(), trim() , minLength(1, 'This field is required'), check(value => !/\s/.test(value), 'User Login ID must not contain whitespace'), check(value => /^[A-Za-z0-9_]+$/.test(value), 'User Login ID must not contain special characters except "_"')),
    email: pipe(string(), trim() , minLength(1, 'This field is required')),
    password: pipe(string(), trim() , minLength(1, 'This field is required'), minLength(8, 'Password must be at least 8 characters long.')),
    firstName: pipe(string(), trim() , minLength(1, 'This field is required.') , maxLength(50, 'The maximum length for First name is 50 characters.')),
    lastName: optional(pipe(string(), trim() , maxLength(50, 'The maximum length for First name is 50 characters.'))),
    state: pipe(string(), trim() , minLength(1, 'This field is required.')),
    city: optional(pipe(string(), trim() ,)),
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
  role: ''
}


const UserForm = ({ id, data, roleId }:{id?: number, data?: UsersType, roleId: number}) => {

  const router = useRouter();
  const { lang: locale } = useParams()

  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [stateData, setStateData] = useState<state[]>([]);
  const [cityData, setCityData] = useState<city[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataType>(initialData);

  const {
    control,
    reset,
    resetField,
    handleSubmit,

    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),

    // values: {
    //   username: data?.user_name || '',
    //   email: data?.email || '',
    //   password: data?.password || '',
    //   firstName: data?.first_name || '',
    //   lastName: data?.last_name || '',
    //   state: data?.state_id?.toString() || '',
    //   city: data?.city_id?.toString() || '',
    //   role: data?.role_id?.toString() || ''
    // }
    values: formData
  })

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

  useEffect(() => {

    if(data){
      if (data?.state_id) {
        handleStateChange(data.state_id.toString());
      }

      setFormData({
        username: data?.user_name || '',
        email: data?.email || '',
        password: data?.password || '',
        firstName: data?.first_name || '',
        lastName: data?.last_name || '',
        state: stateData.length > 0 && data.state_id ? data.state_id?.toString() : '',
        city: cityData.length > 0 && data.city_id ? data.city_id?.toString() : '',
        role: data?.role_id?.toString() || ''
      })
    }
  }, [data]);

  const handleStateChange = async (state: string) => {

    resetField("city", {defaultValue: ""})

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

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {

    setLoading(true);

    data.role = roleId.toString();

    if(id){

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)
      });

      if(res.ok){
        setLoading(false);
        handleReset();
        localStorage.setItem("formSubmitMessage", "User has been updated successfully!");

        router.push(getLocalizedUrl("/users", locale as Locale))

      } else {
        setLoading(false);

        const resp = await res.json();

        toast.error(resp.message || 'Something went wrong!', {
          hideProgressBar: false
        });
      }
    }else{

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)
      });

      if(res.ok){
        setLoading(false);
        handleReset();

        localStorage.setItem("formSubmitMessage", "New User has been created successfully!");

        router.push(getLocalizedUrl("/users", locale as Locale))

      } else {
        setLoading(false);

        const resp = await res.json();

        toast.error(resp.message || 'Something went wrong!', {
          hideProgressBar: false
        });

      }
    }

    setLoading(false);
    handleReset();
  }

  const handleReset = () => {
    resetField("password", {defaultValue: data?.password || ""})
    resetField("state", {defaultValue: data?.state_id?.toString() || ""})
    resetField("city", {defaultValue: data?.city_id?.toString() || ""})
    setCityData([]);
    reset();
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();

    resetField("password", {defaultValue: newPassword})
  }


  return (
    <Card>
      <CardHeader title={`${id ? 'Edit' : 'Create'} ${roleId === 3 ? 'Monitoring Team' : roleId === 4 ? 'Accounts' : 'User' }`} />
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='username'
                rules={{ required: true }}
                render={({field}) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Login ID'
                    placeholder=''
                    required={true}
                    {...(errors.username && { error: true, helperText: errors.username.message })}
                  />
                )}
              />
            </Grid>
            {id ? '' : (

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

            )}
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
                    SelectProps={{ MenuProps, displayEmpty: true }}
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
                    SelectProps={{ MenuProps, displayEmpty: true }}
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
          </Grid>
        </CardContent>
        <Divider />
        <CardActions>
          <Button type='submit' variant='contained' className='mie-2' disabled={loading}>
            {loading && <CircularProgress size={20} color='inherit' />}
            Submit
          </Button>
          <Button
            variant='tonal'
            color='secondary'
            onClick={handleReset}
          >
            Reset
          </Button>
        </CardActions>
      </form>
    </Card>
  )
}

export default UserForm
