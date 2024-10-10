'use client'

// React Imports
import { useEffect, useState } from 'react'

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

import { object, string, trim, minLength, pipe } from "valibot"

import type { InferInput } from 'valibot'

import type { batches, schemes, students } from '@prisma/client'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import CustomTextField from '@core/components/mui/TextField'


import type { UsersType } from '@/types/users/usersType'

import type { QPType } from '@/types/qualification-pack/qpType'

type AddQPDialogData = InferInput<typeof schema>

type AddQPDialogProps = {
  open: boolean
  batchId?: number
  batch: batches & {
    qualification_pack: QPType
    training_partner: UsersType
    training_center: UsersType
    scheme: schemes
    sub_scheme: schemes
    students?: students[]
    assessor: UsersType
  } | null

  // setOpen: (open: boolean) => void

  handleClose: () => void
  data?: UsersType[]
  updateBatchList: () => void
}


// const initialData: AddQPDialogData = {
//   assessorId: '',
// }

const schema = object(
  {
    assessorId: pipe(string(), trim() , minLength(1, 'This field is required')),
  }
)

const AssignAssessorDialog = ({ open, batchId, batch, handleClose, updateBatchList, data }: AddQPDialogProps) => {

  // States
  const [assessorData, setAssessorData] = useState<AddQPDialogProps['data']>([])
  const [loading, setLoading] = useState(false);

  // const [ssData, setSscUsers] = useState<SSCType[]>([])


  useEffect(()=>{

    if(batch){

      const filteredAssessorData = data?.filter(assessor => {
        const batchStartDate = batch.assessment_start_datetime;
        const jobId = batch.qualification_pack.id.toString();
        const additionalData = assessor?.user_additional_data;

        if (!additionalData) return false;

        const jobRoles = JSON.parse(additionalData.job_roles || "[]");
        const jobValidUpto = JSON.parse(additionalData.job_valid_upto || "[]");

        const jobIndex = jobRoles.indexOf(jobId);
        const jobEndDate = jobIndex !== -1 ? jobValidUpto[jobIndex] : null;

        return jobRoles.includes(jobId) && jobEndDate && batchStartDate && jobEndDate > batchStartDate;
      }) || [];


      setAssessorData(filteredAssessorData);

    }

  },[batch]);


  // const getSSCData = async () => {
  //   // Vars
  //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

  //   if (!res.ok) {
  //     throw new Error('Failed to fetch sector skills council')
  //   }

  //   const assessorData = await res.json();

  //   setSscUsers(assessorData);

  // }


  // useEffect(() => {

  //   // setAssessorData(data);
  //   getSSCData()
  // }, [data]);

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      assessorId: ''
    }

    // values: assessorData
  })

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();

    setLoading(true)

    if (batch && batch.id) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batch.id}/assign-assessor`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      console.log(res);

      if (res.ok) {
        setLoading(false);
        reset();
        toast.success('Assessor has been assigned successfully!', {
          hideProgressBar: false
        });
        updateBatchList();
      } else {
        setLoading(false);
        toast.error('Assessor not assigned. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    }


    //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos`, {

    //     method: 'POST',

    //     headers: {

    //       'Content-Type': 'application/json' // Assuming you're sending JSON data

    //     },

    //     body: JSON.stringify(data)

    //   });


    //   if (res.ok) {
    //     setLoading(false)
    //     reset();

    //     toast.success('New NOS has been created successfully!', {
    //       hideProgressBar: false
    //     });
    //     updateBatchList();

    //   } else {
    //     setLoading(false)
    //     toast.error('Something went wrong!', {
    //       hideProgressBar: false
    //     });


    //   }
    // }

    setLoading(false)
    handleReset();
    handleClose();
  }

  const handleReset = () => {
    reset();
    setAssessorData([]);

    handleClose();
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleReset}
      maxWidth='xs'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleReset} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {batchId ? 'Assign Assessor' : 'Assign Assessor' }
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='assessorId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    select
                    label='Select Assessor'
                    {...field}
                    {...(errors.assessorId && { error: true, helperText: errors.assessorId.message })}

                  // value={assessorData?.sscId}
                  // onChange={e => setAssessorData({ ...assessorData, sscId: e.target.value })}
                  >
                    {assessorData && assessorData.length > 0 ? (
                      assessorData.map((assessor) => (
                        <MenuItem key={assessor.id} value={assessor.id.toString()}>
                          {assessor.first_name} {assessor.last_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No data found</MenuItem>
                    )}
                    {/* {assessorData.map((assessor) => (
                      <MenuItem key={assessor.id} value={assessor.id.toString()}>
                        {assessor.first_name}
                      </MenuItem>
                    ))} */}
                  </CustomTextField>
                )}
              />
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='nosId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    disabled={batchId ? true : false}
                    {...field}
                    {...(errors.nosId && { error: true, helperText: errors.nosId.message })}
                    label='NOS ID'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='nosName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.nosName && { error: true, helperText: errors.nosName.message })}
                    label='NOS Name'
                  />
                )}
              />
            </Grid> */}
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

export default AssignAssessorDialog
