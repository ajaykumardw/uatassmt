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

import { Checkbox, CircularProgress, FormControl, FormControlLabel, FormHelperText, Typography } from '@mui/material'

// Component Imports
import { toast } from 'react-toastify'

import { Controller, useForm, useWatch } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, trim, minLength, optional, check, pipe, boolean } from "valibot"

import type { InferInput } from 'valibot'

import type { questions } from '@prisma/client'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'


import type { SSCType } from '@/types/sectorskills/sscType'

import type { QPType } from '@/types/qualification-pack/qpType'

import { removeDuplicates } from '@/utils/removeDuplicates'

import TheoryQuestionListTable from '@/views/agency/exam-sets/list/TheoryQuestionsListTable'

type AddQPDialogData = InferInput<typeof schema> & {
  selectedQuestions?: number[]
}

type AddQPDialogProps = {
  open: boolean
  examSetId?: number
  handleClose: () => void
  data?: AddQPDialogData
  updateExamSetsList: () => void
}

const initialData: AddQPDialogData = {
  sscId: '',
  qpId: '',
  setName: '',
  mode: '',
  totalQuestions: '',
  status: '',
  easy: '0',
  medium: '0',
  hard: '0',
  questionRandom: false,
  optionRandom: false,
}


const schema = object(
  {
    sscId: pipe(string(), trim() , minLength(1, 'This field is required')),
    qpId: pipe(string(), trim() , minLength(1, 'This field is required')),
    setName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Question name must be at least 3 characters long')),
    mode: pipe(string(), trim(), minLength(1, 'This field is required.')),
    totalQuestions: pipe(string(), trim(), minLength(1, 'This field is required.'), check((value) => !value || /^(?:[1-9]|[1-4]\d|50)$/.test(value), 'Total Questions must be between 1 and 50 and must be a number.') ),
    status: pipe(string(), trim(), minLength(1, 'This field is required.')),
    easy: pipe(string(), trim(), minLength(1, 'This field is required.'), check((value) => !value || /^(?:0|[1-9]|[1-4]\d|50)(\.\d+)?$/.test(value), 'Easy must be between 0 and 50 and must be a number.') ),
    medium: pipe(string(), trim(), minLength(1, 'This field is required.'), check((value) => !value || /^(?:0|[1-9]|[1-4]\d|50)(\.\d+)?$/.test(value), 'Medium must be between 0 and 50 and must be a number.') ),
    hard: pipe(string(), trim(), minLength(1, 'This field is required.'), check((value) => !value || /^(?:0|[1-9]|[1-4]\d|50)(\.\d+)?$/.test(value), 'Hard must be between 0 and 50 and must be a number.') ),
    questionRandom: optional(boolean()),
    optionRandom: optional(boolean()),
  }
);



const AddEditExamSetsDialog = ({ open, examSetId, handleClose, updateExamSetsList }: AddQPDialogProps) => {

  // States
  const [examSetData, setExamSetData] = useState<AddQPDialogProps['data']>(initialData)
  const [loading, setLoading] = useState(false);
  const [sscData, setSscUsers] = useState<SSCType[]>([])
  const [qpData, setQPData] = useState<QPType[]>([]);
  const [changedMode, setMode] = useState<string>('');
  const [theoryQuestions, setTheoryQuestions] = useState<questions[]>([]);
  const [easyQuestions, setEasyQuestions] = useState<questions[]>([]);
  const [mediumQuestions, setMediumQuestions] = useState<questions[]>([]);
  const [hardQuestions, setHardQuestions] = useState<questions[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState<{ [key: string]: boolean }>({});

  const [easyCount, setEasyCount] = useState('');
  const [mediumCount, setMediumCount] = useState('');
  const [hardCount, setHardCount] = useState('');

  const getSSCData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch sector skills council')
    }

    const userData = await res.json();

    setSscUsers(userData);

  }

  const getExamSetData = async (id: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-sets/${id}`)

    if(!res.ok){
      throw new Error('Failed to fetch Exam Set data')
    }

    const examSet = await res.json();

    if(examSet){

      fetchAllData(examSet.ssc_id, examSet.qp_id);

      setExamSetData({
        sscId: examSet?.ssc_id ? examSet?.ssc_id.toString() : '',
        qpId: examSet?.qp_id ? examSet?.qp_id.toString() : '',
        setName: examSet.set_name,
        mode: examSet.mode,
        totalQuestions: examSet.total_questions,
        status: examSet.status,
        easy: examSet.question_levels && examSet.question_levels.E ? examSet.question_levels.E.toString() : '0',
        medium: examSet.question_levels && examSet.question_levels.M ? examSet.question_levels.M.toString() : '0',
        hard: examSet.question_levels && examSet.question_levels.H ? examSet.question_levels.H.toString() : '0',
        questionRandom: examSet.question_random === 1,
        optionRandom: examSet.option_random === 1,
      })
      setMode(examSet.mode);

      if (examSet.exam_sets_questions.length > 0) {

        const newSelectedQuestion: { [key: string]: boolean } = {};

        examSet.exam_sets_questions.forEach((question: any) => {

          const questionId = question.question_id.toString();

          newSelectedQuestion[questionId] = true; // Mark each question ID as true
        });

        setSelectedQuestion(newSelectedQuestion);
      }

    }
  }

  const fetchAllData = async (sscId: number, qpId: number) => {
    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {

      setQPData(removeDuplicates(selectedSSC.qualification_packs || [], 'id'));

      const selectedQP = selectedSSC.qualification_packs.find(qp => qp.id === qpId);

      if (selectedQP) {

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions?qpId=${qpId}`);

        if(!res.ok){
          throw new Error('Failed to fetch Theory question data')
        }

        const theory:questions[] = await res.json();

        const easyQuestions = theory.filter(q => q.question_level === 'E');
        const mediumQuestions = theory.filter(q => q.question_level === 'M');
        const hardQuestions = theory.filter(q => q.question_level === 'H');

        setEasyQuestions(easyQuestions);
        setMediumQuestions(mediumQuestions);
        setHardQuestions(hardQuestions);

        setTheoryQuestions(theory);

      } else {

        setEasyQuestions([]);
        setMediumQuestions([]);
        setHardQuestions([]);
        setTheoryQuestions([]);
      }
    } else {
      setQPData([]);
    }
  }

  useEffect(() => {
    getSSCData();
  }, []);



  useEffect(() => {
    if(open && examSetId){
      getSSCData();
      getExamSetData(examSetId)
    }
  }, [open, examSetId])

  const handleSSCChange = async (ssc: string) => {

    resetField("qpId", {defaultValue: ""})
    resetField("mode", {defaultValue: ""})
    setMode('');

    setQPData([]);

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

    resetField("mode", {defaultValue: ""})

    setMode('');

    const qpId = Number(qp);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions?qpId=${qpId}`);

    if(!res.ok){
      throw new Error('Failed to fetch Theory question data')
    }

    const theory: questions[] = await res.json();

    const easyQuestions = theory.filter(q => q.question_level === 'E');
    const mediumQuestions = theory.filter(q => q.question_level === 'M');
    const hardQuestions = theory.filter(q => q.question_level === 'H');

    setEasyQuestions(easyQuestions);
    setMediumQuestions(mediumQuestions);
    setHardQuestions(hardQuestions);

    setTheoryQuestions(theory);

  };

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    resetField,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    values: {
      sscId: examSetData?.sscId || '',
      qpId: examSetData?.qpId || '',
      setName: examSetData?.setName || '',
      mode: examSetData?.mode || '',
      totalQuestions: examSetData?.totalQuestions.toString() || '',
      status: examSetData?.status.toString() || '',
      easy: examSetData?.easy || '0',
      medium: examSetData?.medium || '0',
      hard: examSetData?.hard || '0',
      questionRandom: examSetData?.questionRandom,
      optionRandom: examSetData?.optionRandom,
    }
  })

  useEffect(() => {

    if(changedMode === 'Auto'){

      const totalCounts = Number(easyCount || 0) + Number(mediumCount || 0) + Number(hardCount || 0);
      const totalQuestions = Number(getValues("totalQuestions")) || 0;

      const isEqual = totalCounts === totalQuestions;

      isEqual ? clearErrors(['easy', 'medium', 'hard']) : (setError('easy', {type: 'custom', message: 'The sum of Easy, Medium, and Hard questions must equal Total Questions.'}), setValue('easy', ''), setValue('medium', ''), setValue('hard', ''), setError('medium', {type: 'custom', message: 'The sum of Easy, Medium, and Hard questions must equal Total Questions.'}), setError('hard', {type: 'custom', message: 'The sum of Easy, Medium, and Hard questions must equal Total Questions.'}))
    }else{
      clearErrors(['easy', 'medium', 'hard']);
      setValue('easy', '0');
      setValue('medium', '0');
      setValue('hard', '0');
    }

  }, [changedMode, easyCount, mediumCount, hardCount, getValues]);

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();

    setLoading(true)

    data.selectedQuestions = selectedQuestions;

    if (examSetId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-sets/${examSetId}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        setLoading(false);
        handleReset();
        toast.success('Exam Set is updated successfully!', {
          hideProgressBar: false
        });
        updateExamSetsList();
      } else {
        setLoading(false);
        toast.error('Exam Set not updated. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-sets`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {
        setLoading(false)
        handleReset();

        toast.success('New Exam Set created successfully!', {
          hideProgressBar: false
        });
        updateExamSetsList();

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
    setMode('');
    resetField("qpId", {defaultValue: ""})
    reset();
    setExamSetData(initialData);

    setQPData([]);

    handleClose();

  }

  const totQuestions = useWatch({control, name: 'totalQuestions'});
  const isDisabled = changedMode === 'Manual' && selectedQuestions.length !== Number(totQuestions);

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
        {examSetId ? 'Edit Exam Set' : 'Add Exam Set'}
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
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='setName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    multiline
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.setName && { error: true, helperText: errors.setName.message })}
                    label='Set Name'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='totalQuestions'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    multiline
                    fullWidth
                    required={true}
                    {...field}
                    onChange={(e) =>  field.onChange(e)}
                    {...(errors.totalQuestions && { error: true, helperText: errors.totalQuestions.message })}
                    label='Total Questions'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='mode'
                rules={{ required: true }}
                render={({ field }) => {
                  return (
                    <CustomTextField
                      select
                      fullWidth
                      id='select-qp'
                      label='Mode'
                      required={true}
                      disabled={!(getValues("qpId") && /^(?:[1-9]|[1-4]\d|50)$/.test(totQuestions))}
                      {...field}
                      onChange={(e) => { field.onChange(e); setMode(e.target.value)}}
                      {...(errors.mode && { error: true, helperText: errors.mode.message })}
                    >
                      <MenuItem value='Auto'>Auto</MenuItem>
                      <MenuItem value='Manual'>Manual</MenuItem>
                    </CustomTextField>
                  )}
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='status'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    id='select-status'
                    label='Status'
                    required={true}
                    {...field}
                    onChange={(e) => { field.onChange(e); }}
                    {...(errors.status && { error: true, helperText: errors.status.message })}
                  >
                    <MenuItem value='1'>Publish</MenuItem>
                    <MenuItem value='0'>Unpublish</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            {changedMode === 'Auto'  &&
              <>
                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name='easy'
                    rules={{ required: true }}
                    render={({ field }) => (
                      <CustomTextField
                        multiline
                        fullWidth
                        required={true}
                        {...field}
                        onChange={e => { field.onChange(e); Number(e.target.value) > easyQuestions.length ? (setValue('easy', '0'), setEasyCount('0')) : setEasyCount(e.target.value) }}
                        {...(errors.easy && { error: true, helperText: errors.easy.message })}
                        label={`Easy (Available ${easyQuestions.length})`}
                        placeholder='0'
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name='medium'
                    rules={{ required: true }}
                    render={({ field }) => (
                      <CustomTextField
                        multiline
                        fullWidth
                        required={true}
                        {...field}
                        onChange={e => { field.onChange(e); Number(e.target.value) > mediumQuestions.length ? (setValue('medium', '0'), setMediumCount('0')) : setMediumCount(e.target.value) }}
                        {...(errors.medium && { error: true, helperText: errors.medium.message })}
                        label={`Medium (Available ${mediumQuestions.length})`}
                        placeholder='0'
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name='hard'
                    rules={{ required: true }}
                    render={({ field }) => (
                      <CustomTextField
                        multiline
                        fullWidth
                        required={true}
                        {...field}
                        onChange={e => { field.onChange(e); Number(e.target.value) > hardQuestions.length ? (setValue('hard', '0'), setHardCount('0')) : setHardCount(e.target.value)}}
                        {...(errors.hard && { error: true, helperText: errors.hard.message })}
                        label={`Hard (Available ${hardQuestions.length})`}
                        placeholder='0'
                      />
                    )}
                  />
                </Grid>
              </>
            }
            <Grid item xs={12}>
              <div className="flex flex-wrap">
                <FormControl error={Boolean(errors.questionRandom)}>
                  <Controller
                    name='questionRandom'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='Questions Random' />
                    )}
                  />
                  {errors.questionRandom && <FormHelperText error>This field is required.</FormHelperText>}
                </FormControl>
                <FormControl error={Boolean(errors.optionRandom)}>
                  <Controller
                    name='optionRandom'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='Option Random' />
                    )}
                  />
                  {errors.optionRandom && <FormHelperText error>This field is required.</FormHelperText>}
                </FormControl>
              </div>
            </Grid>
            {getValues('qpId') !== '' &&
              <Grid item xs={12}>
                <Typography color={theoryQuestions.length > 0 ? "primary" : "error"}>
                  Available Questions {theoryQuestions.length}
                </Typography>
              </Grid>
            }
            {changedMode === 'Manual' &&
              <Grid item xs={12}>
                <TheoryQuestionListTable tableData={theoryQuestions} selectedQuestion={selectedQuestion} setSelectedQuestions={setSelectedQuestions} />
              </Grid>
            }
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit' disabled={loading || isDisabled}>
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

export default AddEditExamSetsDialog
