'use client'

// React Imports
import { useState } from 'react'

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

import { object, string, trim, minLength, maxLength, email, regex, pipe } from "valibot"

import type { InferInput } from 'valibot'

import type { city, state } from '@prisma/client'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'


import type { UsersType } from '@/types/users/usersType'

type AddEditTCDialogData = InferInput<typeof schema>

type AddEditTCDialogProps = {
  open: boolean
  tcId?: number

  // setOpen: (open: boolean) => void

  handleClose: () => void
  data?: UsersType
  updateTCList: () => void
  stateData?: state[]
  cities?: city[]
}


// const initialData: AddEditTCDialogData = {
//   tcId: '',
//   tcName: '',
//   email: '',
//   status: '',
//   firstName: '',
//   lastName: '',
//   state: '',
//   city: '',
//   address: '',
//   pinCode: '',
//   phoneNumber: ''
// }

const schema = object(
  {
    tcId: pipe(string(), trim() , minLength(1, 'This field is required') , maxLength(11, 'The maximum length for TC Id is 11 characters.')),
    tcName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'TC name must be at least 3 characters long') , maxLength(255, 'The maximum length for a TC name is 255 characters.')),
    email: pipe(string(), trim() , minLength(1, 'This field is required') , email('Please enter a valid email address')),
    status: pipe(string(), trim() , minLength(1, 'This field is required')),
    firstName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'TC SPOC First Name must be at least 3 characters long') , maxLength(100, 'The maximum length is 100 characters.')),
    lastName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'TC SPOC Last Name must be at least 3 characters long') , maxLength(100, 'The maximum length is 100 characters.')),
    state: pipe(string(), trim() , minLength(1, 'This field is required')),
    city: pipe(string(), trim() , minLength(1, 'This field is required')),
    address: pipe(string(), trim() , minLength(1, 'Address is required') , maxLength(100, 'Address max length is 100 characters')),
    pinCode: pipe(string(), trim() , minLength(1, "Pin Code is required") , minLength(6, "Pin Code length must be 6 digits") , maxLength(6, 'Pin Code length must be 6 digits') , regex(/^[1-9][0-9]{5}$/, 'Pin Code must contain only numbers and or can\'t starts from 0')),
    phoneNumber: pipe(string(), trim() , minLength(1, 'Phone Number is required') , regex(/^[0-9]+$/, 'Phone Number must contain only numbers') , minLength(10, 'Phone Number must be 10 digits') , maxLength(10, 'Phone Number must be 10 digits')),
  }
)

const AddEditTCForm = ({ open, tcId, handleClose, updateTCList, data, stateData, cities }: AddEditTCDialogProps) => {

  // States
  // const [userData, setUserData] = useState<AddEditTCDialogData>(initialData)

  const [loading, setLoading] = useState(false);

  // const [ssData, setSscUsers] = useState<SSCType[]>([])
  // const [stateData, setStateData] = useState<state[]>()

  const [cityData, setCityData] = useState<city[]>(cities || [])

  // console.log("city data", cityData);


  // const getSSCData = async () => {
  //   // Vars
  //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

  //   if (!res.ok) {
  //     throw new Error('Failed to fetch sector skills council')
  //   }

  //   const userData = await res.json();

  //   setSscUsers(userData);

  // }

  // const getStateData = async () => {
  //   try {

  //     const states = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/state`, {method: 'POST', headers: {'Content-Type': 'application/json', }}).then(function (response) { return response.json() });

  //     if (states.length > 0) {

  //       setStateData(states)

  //     } else {

  //       setStateData([])

  //     }

  //   } catch (error) {

  //     console.error('Error fetching city data:', error);
  //   }
  // }



  // useEffect(() => {
  //   getStateData();
  // }, [])


  // useEffect(() => {

    // getTCData(tcId || 0);

    // setUserData(data);
    // getStateData();
    // getSSCData()
    // if(data?.state_id){
    //   handleStateChange(data?.state_id?.toString())
    // }
  // }, [data]);

  // Hooks
  const {
    control,
    reset,
    resetField,
    handleSubmit,
    formState: { errors },
  } = useForm<AddEditTCDialogData>({
    resolver: valibotResolver(schema),
    values: {
      tcId: data?.user_name || '',
      tcName: data?.company_name || '',
      email: data?.email || '',
      status: data?.status.toString() || '',
      firstName: data?.first_name || '',
      lastName: data?.last_name || '',
      state: data?.state_id?.toString() || '',
      city: data?.city_id?.toString() || '',
      address: data?.address || '',
      pinCode: data?.pin_code || '',
      phoneNumber: data?.mobile_no || ''
    }
  })

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

        // console.log(cities)
        // return response;

      } catch (error) {
        console.error('Error fetching city data:', error);
      }
    } else {
      setCityData([])
    }

  }

  const onSubmit: SubmitHandler<AddEditTCDialogData> = async (data: AddEditTCDialogData) => {
    // e.preventDefault();

    setLoading(true)

    if (tcId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tc/${tcId}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        setLoading(false);
        reset();
        toast.success('Training Center has been updated successfully!', {
          hideProgressBar: false
        });
        updateTCList();
      } else {
        setLoading(false);
        toast.error('Training Center not updated. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tc`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {
        setLoading(false)
        reset();

        toast.success('New Training Center has been created successfully!', {
          hideProgressBar: false
        });
        updateTCList();

      } else {
        setLoading(false)
        toast.error('Something went wrong!', {
          hideProgressBar: false
        });


      }
    }

    setLoading(false)
    reset();
    handleClose();
  }

  const handleReset = () => {

    if(tcId){
      setCityData(cities || []);
      resetField("city", {defaultValue: data?.city_id?.toString()})
    }

    reset();

    // setUserData(userData || initialData);

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
        {tcId ? 'Edit ' : 'Add '}Training Center
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='tcId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.tcId && { error: true, helperText: errors.tcId.message })}
                    label='TC ID'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='tcName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.tcName && { error: true, helperText: errors.tcName.message })}
                    label='TC Name'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='email'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.email && { error: true, helperText: errors.email.message })}
                    type='email'
                    label='Email'
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
                control={control}
                name='firstName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.firstName && { error: true, helperText: errors.firstName.message })}
                    label='TC SPOC First Name'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='lastName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.lastName && { error: true, helperText: errors.lastName.message })}
                    label='TC SPOC Last Name'
                  />
                )}
              />
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
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='address'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    multiline
                    required={true}
                    fullWidth
                    {...field}
                    {...(errors.address && { error: true, helperText: errors.address.message })}
                    label='Address'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='pinCode'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required={true}
                    label='Pin Code'
                    placeholder=''
                    {...(errors.pinCode && { error: true, helperText: errors.pinCode.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='status'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    select
                    label='Status'
                    {...field}
                    {...(errors.status && { error: true, helperText: errors.status.message })}
                  >
                    <MenuItem value="1">Active</MenuItem>
                    <MenuItem value="0">Inactive</MenuItem>
                  </CustomTextField>
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

export default AddEditTCForm
