'use client'

// React Imports
import {  forwardRef, useEffect, useState } from 'react'

import type { ReactElement, Ref } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import { CircularProgress, FormControlLabel, Slide } from '@mui/material'

import type { SlideProps } from '@mui/material'

// Component Imports
import { toast } from 'react-toastify'


import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, toTrimmed, minLength, regex, maxLength, optional, custom, boolean } from 'valibot'

import type { Input } from 'valibot'

import type { SSCType } from '@/types/sectorskills/sscType'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

import { NSQFLevelLength } from '@/configs/customDataConfig';

type AddQPDialogData = Input<typeof schema>

type AddQPDialogProps = {
  open: boolean
  qpId?: number

  // setOpen: (open: boolean) => void

  handleClose: () => void
  data?: AddQPDialogData
  updateQPList: () => void
}

const initialData: AddQPDialogData = {
  sscId: '',
  qualificationPackId: '',
  qualificationPackName: '',
  nSQFLevel: '',
  version: '',
  nQRCode: '',
  totalTheoryMarks: '',
  totalVivaMarks: '',
  totalPracticalMarks: '',
  totalMarks: '',
  isTheoryCutoff: false,
  isVivaCutoff: false,
  isPracticalCutoff: false,
  isOverallCutoff: false,
  isNOSCutoff: false,
  isWeightedAvailable: false,
  theoryCutoffMarks: '',
  practicalCutoffMarks: '',
  vivaCutoffMarks: '',
  overallCutoffMarks: ''
}

const schema = object(
  {
    sscId: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    qualificationPackId: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'Qualification pack Id must be at least 3 characters long')
    ]),
    qualificationPackName: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      minLength(3, 'Qualification pack name must be at least 3 characters long')
    ]),
    nSQFLevel: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    nQRCode: optional(string([
      toTrimmed(),
    ])),
    version: string([
      toTrimmed(),
      minLength(1, 'This field is required')
    ]),
    totalTheoryMarks: string([
      toTrimmed(),
      minLength(1, 'Total theory marks is required'),
      regex(/^[0-9]+(?:\.[0-9]+)?$/, 'Total theory marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ]),
    totalVivaMarks: string([
      toTrimmed(),
      minLength(1, 'Total viva marks is required'),
      regex(/^[0-9]+(?:\.[0-9]+)?$/, 'Total viva marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ]),
    totalPracticalMarks: string([
      toTrimmed(),
      minLength(1, 'Total practical marks is required'),
      regex(/^[0-9]+(?:\.[0-9]+)?$/, 'Total practical marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ]),
    totalMarks: string([
      toTrimmed(),
      minLength(1, 'Total marks is required'),
      regex(/^[0-9]+(?:\.[0-9]+)?$/, 'Total marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ]),
    isTheoryCutoff: optional(boolean()),
    isVivaCutoff: optional(boolean()),
    isPracticalCutoff: optional(boolean()),
    isOverallCutoff: optional(boolean()),
    isNOSCutoff: optional(boolean()),
    isWeightedAvailable: optional(boolean()),
    theoryCutoffMarks: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+$/.test(value), 'Theory cutoff marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ])),
    vivaCutoffMarks: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+$/.test(value), 'Viva cutoff marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ])),
    practicalCutoffMarks: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+$/.test(value), 'Practical cutoff marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ])),
    overallCutoffMarks: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Overall cutoff marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ])),
    nosCutoffMarks: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Overall cutoff marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ])),
    weightedAvailable: optional(string([
      toTrimmed(),
      custom((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Overall cutoff marks must contain only numbers'),
      maxLength(10, 'Max length is 10 digits')
    ])),
  }
)

const Transition = forwardRef(function Transition(
  props: SlideProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />
})

const AddQPDialog = ({ open, qpId, handleClose, updateQPList, data }: AddQPDialogProps) => {

  // States
  const [userData, setUserData] = useState<AddQPDialogProps['data']>(data || initialData)
  const [loading, setLoading] = useState(false);
  const [ssData, setSscUsers] = useState<SSCType[]>([])
  const [versionData, setVersion] = useState<any[]>([])
  const [isTheoryCutoff, setIsTheoryCutoff] = useState(false)
  const [isVivaCutoff, setIsVivaCutoff] = useState(false)
  const [isPracticalCutoff, setIsPracticalCutoff] = useState(false)
  const [isOverallCutoff, setIsOverallCutoff] = useState(false)
  const [isNOSCutoff, setIsNOSCutoff] = useState(false)
  const [isWeighted, setIsWeighted] = useState(false)

  const getSSCData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const userData = await res.json();

    setSscUsers(userData);

  }

  const getVersionData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/versions`)

    if (!res.ok) {
      throw new Error('Failed to fetch VersionData')
    }

    const versions = await res.json();

    setVersion(versions);

  }

  useEffect(() => {

    setUserData(data);
    setIsTheoryCutoff(data?.isTheoryCutoff || false);
    setIsVivaCutoff(data?.isVivaCutoff || false);
    setIsPracticalCutoff(data?.isPracticalCutoff || false);
    setIsOverallCutoff(data?.isOverallCutoff || false);
    setIsNOSCutoff(data?.isNOSCutoff || false);
    setIsWeighted(data?.isWeightedAvailable || false);
    getSSCData()
    getVersionData()
  }, [data]);

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    defaultValues: initialData,
    values: userData
  })

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();
    data.isTheoryCutoff = isTheoryCutoff;
    data.isVivaCutoff = isVivaCutoff;
    data.isPracticalCutoff = isPracticalCutoff;
    data.isOverallCutoff = isOverallCutoff;
    data.isNOSCutoff = isNOSCutoff;
    data.isWeightedAvailable = isWeighted;

    setLoading(true)

    if (qpId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qualification-packs/${qpId}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(data)

      });

      if (res.ok) {
        setLoading(false);
        reset();
        toast.success('Qualification Pack has been updated successfully!', {
          hideProgressBar: false
        });
        updateQPList();
      } else {
        setLoading(false);
        toast.error('Qualification pack not updated. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qualification-packs`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {
        setLoading(false)
        reset();

        toast.success('New Qualification Pack has been created successfully!', {
          hideProgressBar: false
        });
        updateQPList();

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
    setUserData(userData || initialData);
    setIsTheoryCutoff(userData?.isTheoryCutoff || false);
    setIsVivaCutoff(userData?.isVivaCutoff || false);
    setIsPracticalCutoff(userData?.isPracticalCutoff || false);
    setIsOverallCutoff(userData?.isOverallCutoff || false);
    setIsNOSCutoff(userData?.isNOSCutoff || false);
    setIsWeighted(userData?.isWeightedAvailable || false);

    handleClose();
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleReset}
      TransitionComponent={Transition}
      keepMounted
      maxWidth='md'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleReset} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {qpId ? 'Edit ' : 'Add '}Qualification Pack
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
                  <CustomTextField
                    fullWidth
                    select
                    label='Sector Skill Council'
                    required={true}
                    {...field}
                    {...(errors.sscId && { error: true, helperText: errors.sscId.message })}
                  >
                    {ssData.map((ssc, index) => (
                      <MenuItem key={index} value={ssc.id.toString()}>
                        {ssc.ssc_name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='qualificationPackId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    inputProps={{ readOnly: qpId && true }}
                    disabled={qpId ? true : false}
                    required={true}
                    {...field}
                    {...(errors.qualificationPackId && { error: true, helperText: errors.qualificationPackId.message })}
                    label='Qualification Pack Id'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='qualificationPackName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.qualificationPackName && { error: true, helperText: errors.qualificationPackName.message })}
                    label='Qualification Pack Name'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='version'
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label='Version'
                    required={true}
                    {...field}
                    {...(errors.version && { error: true, helperText: errors.version.message })}
                  >
                    {versionData.map((version) => (
                      <MenuItem key={version.id} value={version.id.toString()}>
                        {version.version_number}
                      </MenuItem>
                    ))}
                  </CustomTextField>

                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='nQRCode'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    inputProps={{ readOnly: qpId && true }}
                    {...field}
                    {...(errors.nQRCode && { error: true, helperText: errors.nQRCode.message })}
                    label='NQR Code'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='nSQFLevel'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label='NSQF Level'
                    required={true}
                    {...field}
                    {...(errors.nSQFLevel && { error: true, helperText: errors.nSQFLevel.message })}
                  >
                    {NSQFLevelLength.map((level) => (
                      <MenuItem key={level} value={level.toString()}>
                      {level}
                    </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='totalTheoryMarks'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label='Total Theory Marks'
                    required={true}
                    {...field}
                    {...(errors.totalTheoryMarks && { error: true, helperText: errors.totalTheoryMarks.message })}
                    onChange={(e) => {
                      field.onChange(e);

                      const totalTheoryMarks = parseFloat(e.target.value || '0');
                      const totalVivaMarks = parseFloat(getValues('totalVivaMarks') || '0');
                      const totalPracticalMarks = parseFloat(getValues('totalPracticalMarks') || '0');
                      const totalMarks = totalTheoryMarks + totalVivaMarks + totalPracticalMarks;

                      setValue('totalMarks', totalMarks === 0 || isNaN(totalMarks) ? '' : totalMarks.toString());
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='totalVivaMarks'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label='Total Viva Marks'
                    required={true}
                    {...field}
                    {...(errors.totalVivaMarks && { error: true, helperText: errors.totalVivaMarks.message })}
                    onChange={(e) => {
                      field.onChange(e);
                      const totalTheoryMarks = parseFloat(getValues('totalTheoryMarks') || '0');
                      const totalVivaMarks = parseFloat(e.target.value || '0');
                      const totalPracticalMarks = parseFloat(getValues('totalPracticalMarks') || '0');
                      const totalMarks = totalTheoryMarks + totalVivaMarks + totalPracticalMarks;

                      setValue('totalMarks', totalMarks === 0 || isNaN(totalMarks) ? '' : totalMarks.toString());
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='totalPracticalMarks'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label='Total Practical Marks'
                    required={true}
                    {...field}
                    {...(errors.totalPracticalMarks && { error: true, helperText: errors.totalPracticalMarks.message })}
                    onChange={(e) => {
                      field.onChange(e);
                      const totalTheoryMarks = parseFloat(getValues('totalTheoryMarks') || '0');
                      const totalVivaMarks = parseFloat(getValues('totalVivaMarks') || '0');
                      const totalPracticalMarks = parseFloat(e.target.value || '0');
                      const totalMarks = totalTheoryMarks + totalVivaMarks + totalPracticalMarks;

                      setValue('totalMarks', totalMarks === 0 || isNaN(totalMarks) ? '' : totalMarks.toString());
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='totalMarks'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label='Total Marks'
                    inputProps={{ readOnly: true }}
                    disabled={ true }
                    {...field}
                    {...(errors.totalMarks && { error: true, helperText: errors.totalMarks.message })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='isTheoryCutoff'
                render={({ field }) => (
                  <FormControlLabel
                    {...field}
                    control={<Switch checked={isTheoryCutoff} onChange={e => setIsTheoryCutoff(e.target.checked)} />}
                    label='Is theory cutoff available?'
                  />
                )}
              />

              <Controller
                control={control}
                name='theoryCutoffMarks'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.theoryCutoffMarks && { error: true, helperText: errors.theoryCutoffMarks.message })}
                    disabled={!isTheoryCutoff}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={isVivaCutoff} onChange={e => setIsVivaCutoff(e.target.checked)} />}
                label='Is viva cutoff available?'
              />
              <Controller
                control={control}
                name='vivaCutoffMarks'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.vivaCutoffMarks && { error: true, helperText: errors.vivaCutoffMarks.message })}
                    disabled={!isVivaCutoff}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={isPracticalCutoff} onChange={e => setIsPracticalCutoff(e.target.checked)} />}
                label='Is practical cutoff available?'
              />
              <Controller
                control={control}
                name='practicalCutoffMarks'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.practicalCutoffMarks && { error: true, helperText: errors.practicalCutoffMarks.message })}
                    disabled={!isPracticalCutoff}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={isOverallCutoff} onChange={e => setIsOverallCutoff(e.target.checked)} />}
                label='Is overall cutoff available?'
              />
              <Controller
                control={control}
                name='overallCutoffMarks'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.overallCutoffMarks && { error: true, helperText: errors.overallCutoffMarks.message })}
                    disabled={!isOverallCutoff}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={isNOSCutoff} onChange={e => setIsNOSCutoff(e.target.checked)} />}
                label='Is NOS cutoff available?'
              />
              <Controller
                control={control}
                name='nosCutoffMarks'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.nosCutoffMarks && { error: true, helperText: errors.nosCutoffMarks.message })}
                    disabled={!isNOSCutoff}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={isWeighted} onChange={e => setIsWeighted(e.target.checked)} />}
                label='Is weighted available?'
              />
              <Controller
                control={control}
                name='weightedAvailable'
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.weightedAvailable && { error: true, helperText: errors.weightedAvailable.message })}
                    disabled={!isWeighted}
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

export default AddQPDialog
