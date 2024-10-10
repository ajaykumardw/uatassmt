// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Component Imports
import { toast } from 'react-toastify'


import { CircularProgress, FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from '@mui/material'

import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, pipe, string, trim, minLength, check, maxLength, optional, date, regex } from 'valibot'

import type { InferInput } from 'valibot';

import CustomTextField from '@core/components/mui/TextField'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

type Props = {
  open: boolean
  id: number | null
  handleClose: () => void,
  updateStudentList: any
}

// type FormDataType = {
//   fullName: string
//   username: string
//   email: string
//   company: string
//   country: string
//   contact: string
//   role: string
//   plan: string
//   status: string
// }

type FormDataType = InferInput<typeof schema>

const schema = object(
  {
    userName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
    candidateName: pipe(string(), trim(), minLength(1, 'This field is required'), maxLength(191, 'The max length for this field is 191 characters.')),
    gender: optional(pipe(string(), trim(), check((value) => !value || ['m', 'f', 't'].includes(value), 'Gender must be Male, Female, or Transgender'))),
    category: optional(pipe(string(), trim(), minLength(1, 'This field is required') , check(value => ['Gen', 'SC', 'ST', 'BC', 'OBC', 'OC'].includes(value), 'Category must be Gen, SC, ST, OC, or OBC'))),
    dob: optional(date()),
    fatherName: optional(pipe(string("Father's name type should be string"), trim(), maxLength(191, 'The max length for Father Name is 191 characters.'))),
    motherName: optional(pipe(string("Mother's name type should be string"), trim(), maxLength(191, 'The max length for Mother Name is 191 characters.'))),
    address: optional(pipe(string(), trim(), maxLength(191, 'The max length for Address is 191 characters.'))),
    city: optional(pipe(string('City should be type of string'), trim(), maxLength(100, 'The max length for City is 100 characters.'))),
    state: optional(pipe(string('State should be type of string'), trim(), maxLength(100, 'The max length for State is 100 characters.'))),
    mobileNo: pipe(string(), trim() , minLength(1, 'Phone Number is required') , regex(/^[0-9]+$/, 'Phone Number must contain only numbers') , minLength(10, 'Phone Number must be 10 digits') , maxLength(10, 'Phone Number must be 10 digits')),
  }
)


// Vars
const initialData = {
  userName: '',
  candidateName: '',
  gender: '',
  category: '',
  dob: undefined,
  fatherName: '',
  motherName: '',
  address: '',
  city: '',
  state: '',
  mobileNo: ''
}

const EditStudentDrawer = ({ open, id, handleClose, updateStudentList }: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [loading, setLoading] = useState(false);

  const fetchStudent = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${id}`);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const res = await response.json();

      setFormData({
        userName: res.user_name.toString() || '',
        candidateName: res.candidate_name.toString() || '',
        mobileNo: res.mobile_no.toString() || '',
        fatherName: res.father_name || '',
        motherName: res.mother_name || '',
        gender: res.gender || '',
        dob: new Date(res.date_of_birth) || '',
        category: res.category || '',
        state: res.state || '',
        city: res.city || '',
        address: res.address || ''
      });

    } catch (error) {
      console.error("Failed to fetch student:", error);
    }

  }

  useEffect(() => {

    if(open && id){

      fetchStudent(id);

    }

  }, [open, id]);

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
  }

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    values: formData
  });

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {

    updateStudentList(false);

    setLoading(true)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${id}`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json'

      },

      body: JSON.stringify(data)

    });

    if (res.ok) {
      setLoading(false)
      reset();
      toast.success('Student updated successfully!',{
        hideProgressBar: false
      });
      updateStudentList(true);
    } else {
      setLoading(false)
      toast.error('Something wrong. Student not updated!',{
        hideProgressBar: false
      });

    }

    setLoading(false)
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
        <Typography variant='h5'>Edit Student</Typography>
        <IconButton onClick={handleReset}>
          <i className='tabler-x text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={handleSubmit(onSubmit)} method='POST' className='flex flex-col gap-6 p-6'>
          <Controller
            name='userName'
            control={control}
            rules={{ required: true }}
            disabled
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='User Name'
                placeholder='User Name'
                {...(errors.userName && { error: true, helperText: errors.userName.message })}
              />
            )}
          />
          <Controller
            name='candidateName'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Student Name'
                placeholder='Student Name'
                {...(errors.candidateName && { error: true, helperText: errors.candidateName.message })}
              />
            )}
          />
          <Controller
            name='mobileNo'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Phone Number'
                placeholder='Phone Number'
                {...(errors.mobileNo && { error: true, helperText: errors.mobileNo.message })}
              />
            )}
          />
          <Controller
            name='fatherName'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Father Name'
                placeholder='Father Name'
                {...(errors.fatherName && { error: true, helperText: errors.fatherName.message })}
              />
            )}
          />
          <Controller
            name='motherName'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Mother Name'
                placeholder='Mother Name'
                {...(errors.motherName && { error: true, helperText: errors.motherName.message })}
              />
            )}
          />
          <Controller
            name='dob'
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <AppReactDatepicker
                selected={value}
                showYearDropdown
                showMonthDropdown
                onChange={onChange}
                placeholderText='DD-MM-YYYY'
                dateFormat='dd-MM-YYYY'
                customInput={
                  <CustomTextField
                    value={value}
                    onChange={onChange}
                    fullWidth
                    label='Date Of Birth'
                    {...(errors.dob && { error: true, helperText: errors.dob.message })}
                  />
                }
              />
            )}
          />
          {/* <Controller
            name='gender'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <FormControl error={true}>
                <RadioGroup row {...field} name='gender'>
                  <FormControlLabel value='m' control={<Radio />} label='Male' />
                  <FormControlLabel value='f' control={<Radio />} label='Female' />
                  <FormControlLabel value='t' control={<Radio />} label='Transgender' />
                </RadioGroup>
                {errors.gender && (
                  <FormHelperText>
                    { errors.gender.message }
                  </FormHelperText>
                  )
                }
              </FormControl>
            )}
          /> */}
          <FormControl error={Boolean(errors.gender)}>
            <FormLabel>Gender</FormLabel>
            <Controller
              name='gender'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <RadioGroup row {...field} name='gender'>
                  <FormControlLabel value='m' control={<Radio />} label='Male' />
                  <FormControlLabel value='f' control={<Radio />} label='Female' />
                  <FormControlLabel value='t' control={<Radio />} label='Transgender' />
                </RadioGroup>
              )}
            />
            {errors.gender && <FormHelperText error>{errors.gender.message}</FormHelperText>}
          </FormControl>
          <Controller
            name='category'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField select fullWidth id='edit-select_category' label='Select Category' {...field}
                {...(errors.category && { error: true, helperText: errors.category.message })}>
                <MenuItem value=''>Select</MenuItem>
                <MenuItem value='Gen'>General</MenuItem>
                <MenuItem value='SC'>SC</MenuItem>
                <MenuItem value='ST'>ST</MenuItem>
                <MenuItem value='BC'>BC</MenuItem>
                <MenuItem value='OBC'>OBC</MenuItem>
                <MenuItem value='OC'>OC</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='state'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='State'
                placeholder='State'
                {...(errors.state && { error: true, helperText: errors.state.message })}
              />
            )}
          />
          <Controller
            name='city'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='City'
                placeholder='City'
                {...(errors.city && { error: true, helperText: errors.city.message })}
              />
            )}
          />
          <Controller
            name='address'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                multiline
                fullWidth
                label='Address'
                placeholder='Address'
                {...(errors.address && { error: true, helperText: errors.address.message })}
              />
            )}
          />
          {/* <Controller
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
          /> */}
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

export default EditStudentDrawer
