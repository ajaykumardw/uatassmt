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

// Third-party Imports
import { toast } from 'react-toastify'

import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, minLength, string, custom, toTrimmed, maxLength, optional, date, boolean } from 'valibot'

import type { Input } from 'valibot'

// Components Imports
import { FormControlLabel, Switch } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'


type FormData = Input<typeof schema>


const schema = object(
  {
    sscId: string([toTrimmed(), minLength(1, 'This field is required')]),
    qpId: string([toTrimmed(), minLength(1, 'This field is required')]),
    batchName: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'First Name must be at least 3 characters long')
    ]),
    batchSize: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    scheme: string([toTrimmed(), minLength(1, 'This field is required')]),
    subScheme: string([toTrimmed(), minLength(1, 'This field is required')]),
    trainingCenter: string([toTrimmed(), minLength(1, 'This field is required')]),
    assessmentStartDate: date('This field is required'),
    assessmentEndDate: date('This field is required'),
    loginRestrictCount: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+$/.test(value), 'Login Restrict Count must contain only numbers'),
      maxLength(3, 'The max length is 3')
    ])),
    captureImage: optional(boolean()),
    captureImageInSeconds: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+$/.test(value), 'Must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ])),
    modOfAssessment: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ])
  }
)

const AddEditBatchForm = () => {

  // States
  const [isCaptureImage, setIsCaptureImage] = useState(false)

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      sscId: '',
      qpId: '',
      batchName: '',
      batchSize: '',
      scheme: '',
      subScheme: '',
      trainingCenter: '',
      loginRestrictCount: '3',
      assessmentStartDate: undefined,
      assessmentEndDate: undefined,
      captureImage: false,
      captureImageInSeconds: '',
      modOfAssessment: '',
    }
  })

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
      <CardHeader title='Create Batch' />
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} autoComplete='off' method='POST'>
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='sscId'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='SSC' {...field}

                    // onChange={(e) => {
                    //   field.onChange(e); // Ensure the field value gets updated in the form state
                    //   handleStateChange(e.target.value); // Call your custom onChange handler
                    // }}

                    {...(errors.sscId && { error: true, helperText: errors.sscId.message })}>
                    <MenuItem value=''>Select SSC</MenuItem>
                    <MenuItem disabled>No SSC found</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='qpId'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='Qualification Pack' {...field}

                    // onChange={(e) => {
                    //   field.onChange(e); // Ensure the field value gets updated in the form state
                    //   handleStateChange(e.target.value); // Call your custom onChange handler
                    // }}

                    {...(errors.qpId && { error: true, helperText: errors.qpId.message })}>
                    <MenuItem value=''>Select Qualification Pack</MenuItem>
                    <MenuItem disabled>No Qualification Pack found</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='batchName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Batch Name'
                    placeholder=''
                    {...(errors.batchName && { error: true, helperText: errors.batchName.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='batchSize'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Batch Size'
                    required={true}
                    {...(errors.batchSize && { error: true, helperText: errors.batchSize.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='scheme'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='Scheme' {...field}

                    // onChange={(e) => {
                    //   field.onChange(e); // Ensure the field value gets updated in the form state
                    //   handleStateChange(e.target.value); // Call your custom onChange handler
                    // }}

                    {...(errors.scheme && { error: true, helperText: errors.scheme.message })}>
                    <MenuItem value=''>Select Scheme</MenuItem>
                    <MenuItem disabled>No scheme found</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='subScheme'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='Sub Scheme' {...field}

                    // onChange={(e) => {
                    //   field.onChange(e); // Ensure the field value gets updated in the form state
                    //   handleStateChange(e.target.value); // Call your custom onChange handler
                    // }}

                    {...(errors.subScheme && { error: true, helperText: errors.subScheme.message })}>
                    <MenuItem value=''>Select Sub Scheme</MenuItem>
                    <MenuItem disabled>No sub scheme found</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='trainingCenter'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='Training Center' {...field}

                    // onChange={(e) => {
                    //   field.onChange(e); // Ensure the field value gets updated in the form state
                    //   handleStateChange(e.target.value); // Call your custom onChange handler
                    // }}

                    {...(errors.trainingCenter && { error: true, helperText: errors.trainingCenter.message })}>
                    <MenuItem value=''>Select Training Center</MenuItem>
                    <MenuItem disabled>No training center found</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='loginRestrictCount'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Login Restrict Count'
                    placeholder=''
                    {...(errors.loginRestrictCount && { error: true, helperText: errors.loginRestrictCount.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='assessmentStartDate'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <AppReactDatepicker
                    selected={value}
                    showYearDropdown
                    showMonthDropdown
                    showTimeSelect
                    onChange={onChange}
                    dateFormat='MM/dd/yyyy h:mm aa'
                    placeholderText='MM/DD/YYYY h:mm aa'
                    required={true}
                    customInput={
                      <CustomTextField
                        value={value}
                        onChange={onChange}
                        fullWidth
                        label='Assessment Start Date'
                        {...(errors.assessmentStartDate && { error: true, helperText: errors.assessmentStartDate.message })}
                      />
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='assessmentEndDate'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <AppReactDatepicker
                    selected={value}
                    showYearDropdown
                    showMonthDropdown
                    showTimeSelect
                    onChange={onChange}
                    dateFormat='MM/dd/yyyy h:mm aa'
                    placeholderText='MM/DD/YYYY h:mm aa'
                    required={true}
                    customInput={
                      <CustomTextField
                        value={value}
                        onChange={onChange}
                        required={true}
                        fullWidth
                        label='Assessment End Date'
                        {...(errors.assessmentEndDate && { error: true, helperText: errors.assessmentEndDate.message })}
                      />
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='captureImage'
                render={({ field }) => (
                  <FormControlLabel
                    {...field}
                    control={<Switch checked={isCaptureImage} size='small' onChange={e => setIsCaptureImage(e.target.checked)} />}
                    label='Capture Image'
                  />
                )}
              />

              <Controller
                control={control}
                name='captureImageInSeconds'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.captureImageInSeconds && { error: true, helperText: errors.captureImageInSeconds.message })}
                    disabled={!isCaptureImage}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='modOfAssessment'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='Mod Of Assessment' {...field}

                    // onChange={(e) => {
                    //   field.onChange(e); // Ensure the field value gets updated in the form state
                    //   handleStateChange(e.target.value); // Call your custom onChange handler
                    // }}

                    {...(errors.modOfAssessment && { error: true, helperText: errors.modOfAssessment.message })}>
                    <MenuItem value=''>Select Mod Of Assessment</MenuItem>
                    <MenuItem value="1">Digital Online</MenuItem>
                    <MenuItem value="2">Digital Offline</MenuItem>
                    <MenuItem value="3">Paper Pen</MenuItem>
                  </CustomTextField>
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

}

export default AddEditBatchForm
