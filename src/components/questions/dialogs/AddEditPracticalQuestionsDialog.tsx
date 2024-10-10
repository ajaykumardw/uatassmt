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

import { object, string, trim, minLength, check, pipe } from "valibot"

import type { InferInput } from 'valibot'


import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { SSCType } from '@/types/sectorskills/sscType'
import type { QPType } from '@/types/qualification-pack/qpType'
import type { NOSType } from '@/types/nos/nosType'
import { removeDuplicates } from '@/utils/removeDuplicates'

type AddQPDialogData = InferInput<typeof schema>

type AddQPDialogProps = {
  open: boolean
  questionId?: number

  handleClose: () => void
  data?: AddQPDialogData
  updateQuestionsList: () => void
}

// const initialData: AddQPDialogProps['data'] = {
//   firstName: 'Oliver',
//   lastName: 'Queen',
//   userName: 'oliverQueen',
//   billingEmail: 'oliverQueen@gmail.com',
//   status: 'active',
//   taxId: 'Tax-8894',
//   contact: '+ 1 609 933 4422',
//   language: ['English'],
//   country: 'US',
//   useAsBillingAddress: true
// }
const initialData: AddQPDialogData = {
  sscId: '',
  qpId: '',
  nosId: '',
  questionName: '',
  questionMarks: '',
}


const schema = object(
  {
    sscId: pipe(string(), trim() , minLength(1, 'This field is required')),
    qpId: pipe(string(), trim() , minLength(1, 'This field is required')),
    nosId: pipe(string(), trim() , minLength(1, 'This field is required')),
    questionName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Question name must be at least 3 characters long')),
    questionMarks: pipe(string(), trim() , minLength(1, 'This field is required') , check((value) => !value || /^(?:[1-9]|1\d|2[0-5])(\.\d+)?$/.test(value), 'Marks must be between 1 and 25.') ,),
  }
)

const AddEditPracticalQuestionsDialog = ({ open, questionId, handleClose, updateQuestionsList }: AddQPDialogProps) => {

  // States
  const [userData, setUserData] = useState<AddQPDialogProps['data']>(initialData)
  const [loading, setLoading] = useState(false);
  const [sscData, setSscUsers] = useState<SSCType[]>([])
  const [qpData, setQPData] = useState<QPType[]>([]);
  const [nosData, setNOSData] = useState<NOSType[]>([]);

  const getSSCData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch sector skills council')
    }

    const userData = await res.json();

    setSscUsers(userData);

  }

  const getPracticalQuestionData = async (id: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/practical/${id}`)

    if(!res.ok){
      throw new Error('Failed to fetch practical question data')
    }

    const practical = await res.json();

    if(practical){

      fetchAllData(practical.ssc_id, practical.qp_id);

      setUserData({
        sscId: practical?.ssc_id ? practical?.ssc_id.toString() : '',
        qpId: practical?.qp_id ? practical?.qp_id.toString() : '',
        nosId: practical?.nos_id ? practical?.nos_id.toString() : '',
        questionName: practical.question,
        questionMarks: practical?.marks ? practical?.marks.toString() : ''
      })

    }
  }

  const fetchAllData = async (sscId: number, qpId: number) => {
    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {

      setQPData(removeDuplicates(selectedSSC.qualification_packs || [], 'id'));

      const selectedQP = selectedSSC.qualification_packs.find(qp => qp.id === qpId);

      if (selectedQP) {

        setNOSData(removeDuplicates(selectedQP.nos || [], 'id'));

      } else {

        setNOSData([]);
      }
    } else {
      setQPData([]);
    }
  }

  useEffect(() => {
    getSSCData();
  }, []);

  useEffect(() => {
    if(open && questionId){
      getSSCData();
      getPracticalQuestionData(questionId)
    }
  }, [open, questionId])

  const handleSSCChange = async (ssc: string) => {

    resetField("qpId", {defaultValue: ""})
    resetField("nosId", {defaultValue: ""})

    setQPData([]);
    setNOSData([]);

    const sscId = Number(ssc);

    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {
      setQPData(removeDuplicates(selectedSSC.qualification_packs || [], 'id'));
    } else {
      setQPData([]);
    }
  };

  // Function to handle QP change
  const handleQPChange = async (qp: string) => {

    resetField("nosId", {defaultValue: ""})

    setNOSData([]);

    const qpId = Number(qp);

    const selectedQP = qpData.find(qp => qp.id === qpId);

    if (selectedQP) {

      setNOSData(selectedQP.nos || []);
    } else {

      setNOSData([]);
    }
  };

  // Function to handle NOS change
  // const handleNOSChange = async (nos: string) => {

  //   const nosId = Number(nos);

  //   // const selectedNOS = nosData.find(nos => nos.id === nosId);

  // };



  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    values: {
      sscId: userData?.sscId || '',
      qpId: userData?.qpId || '',
      nosId: userData?.nosId || '',
      questionName: userData?.questionName || '',
      questionMarks: userData?.questionMarks || '',
    }
  })

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();

    setLoading(true)

    if (questionId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/practical/${questionId}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        setLoading(false);
        reset();
        toast.success('Question is updated successfully!', {
          hideProgressBar: false
        });
        updateQuestionsList();
      } else {
        setLoading(false);
        toast.error('Question not updated. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/practical`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {
        setLoading(false)
        reset();

        toast.success('New Question has been created successfully!', {
          hideProgressBar: false
        });
        updateQuestionsList();

      } else {
        setLoading(false)
        toast.error('Something went wrong!', {
          hideProgressBar: false
        });


      }
    }

    setLoading(false)
    handleReset();
    handleClose();
  }

  const handleReset = () => {
    reset();
    setUserData(initialData);

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
        {questionId ? 'Edit Practical Question' : 'Add Practical Question'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='sscId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select required={true} fullWidth label='SSC' id='select-ssc'
                  SelectProps={{  }}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e); // Ensure the field value gets updated in the form state
                      handleSSCChange(e.target.value); // Call your custom onChange handler
                    }}
                    {...(errors.sscId && { error: true, helperText: errors.sscId.message })}
                  >
                    <MenuItem value=''>Select SSC</MenuItem>
                    {sscData && sscData.length > 0 ? (
                      sscData.map((ssc) =>(
                        <MenuItem key={ssc.id.toString()} value={ssc.id.toString()}>{ssc.ssc_name}</MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No SSC found</MenuItem>
                    ) }
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='qpId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    id='select-qp'
                    label='Qualification Pack'
                    required={true}
                    {...field}
                    onChange={(e) => { field.onChange(e); handleQPChange(e.target.value)}}
                    {...(errors.qpId && { error: true, helperText: errors.qpId.message })}
                  >
                    <MenuItem value=''>Select Qualification Pack</MenuItem>
                    {qpData.length > 0 ? (
                      qpData.map((qualificationPack) => (
                        <MenuItem key={qualificationPack.id.toString()} value={qualificationPack.id.toString()}>
                          {qualificationPack.qualification_pack_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No Qualification pack found</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='nosId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    id='select-nos'
                    label='NOS'
                    required={true}
                    {...field}
                    onChange={(e) =>{ field.onChange(e); }}
                    {...(errors.nosId && { error: true, helperText: errors.nosId.message })}
                  >
                    <MenuItem value=''>Select NOS</MenuItem>
                    {nosData.length > 0 ? (
                      nosData.map((nos) => (
                        <MenuItem key={nos.id.toString()} value={nos.id.toString()}>
                          {nos.nos_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No NOS found</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='questionName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    multiline
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.questionName && { error: true, helperText: errors.questionName.message })}
                    label='Question'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='questionMarks'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.questionMarks && { error: true, helperText: errors.questionMarks.message })}
                    label='Marks'
                  />
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

export default AddEditPracticalQuestionsDialog
