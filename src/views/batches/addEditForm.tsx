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

// Third-party Imports
import { toast } from 'react-toastify'

import { Controller, useForm, useWatch } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, minLength, string, check, trim, maxLength, optional, date, boolean, regex, pipe } from "valibot"

import type { InferInput } from 'valibot'

// Components Imports
import { CircularProgress, FormControlLabel, Switch, Tooltip } from '@mui/material'

import type { batches, exam_sets, schemes, state, users } from '@prisma/client'

import CustomIconButton from '@/@core/components/mui/IconButton'

import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

import type { SSCType } from '@/types/sectorskills/sscType'

import type { QPType } from '@/types/qualification-pack/qpType'

import { getLocalizedUrl } from '@/utils/i18n'

import type { Locale } from '@configs/i18n'

import { MenuProps, ModeOfAssessment } from '@/configs/customDataConfig'

import type { SchemesType } from '@/types/schemes/schemesType'
import AddEditTCForm from '../training-partner/training-centers/list/AddEditTCForm'
import AddEditSchemeDialog from '@/components/scheme/dialogs/AddEditSchemeDialog'

type FormData = InferInput<typeof schema>


const schema = object(
  {
    sscId: pipe(string(), trim() , minLength(1, 'This field is required')),
    qpId: pipe(string(), trim() , minLength(1, 'This field is required')),
    theoryExamSetId: optional(pipe(string(), trim())),
    practicalExamSetId: optional(pipe(string(), trim())),
    vivaExamSetId: optional(pipe(string(), trim())),
    batchName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long') , maxLength(191, 'The max length for this field is 191 characters.')),
    batchSize: pipe(string(), trim() , minLength(1, 'This field is required') , maxLength(191, 'The max length for this field is 191 characters.')),
    scheme: pipe(string(), trim() , minLength(1, 'This field is required')),
    subScheme: pipe(string(), trim() , minLength(1, 'This field is required')),
    trainingPartner: pipe(string(), trim() , minLength(1, 'This field is required')),
    trainingCenter: pipe(string(), trim() , minLength(1, 'This field is required')),
    assessmentStartDate: date('This field is required'),
    assessmentEndDate: date('This field is required'),
    loginRestrictCount: pipe(string(), trim() , minLength(1, 'This field is required.') , regex(/^[1-9][0-9]{0,2}$/, 'Login Restrict Count must contain only numbers') , maxLength(3, 'The max length is 3 digits')),
    captureImage: optional(boolean()),
    captureImageInSeconds: optional(pipe(string(), trim() , check((value) => !value || /^[0-9]+$/.test(value), 'Must contain only numbers') , maxLength(10, 'Max length is 10 digits'))),
    modeOfAssessment: pipe(string(), trim() , minLength(1, 'This field is required'))
  }
)

const AddEditBatchForm = ({id, data, sscData, tpData, trainingCenters, schemesData}:{id?: number, data?: batches & {qualification_pack: QPType}, sscData: SSCType[], tpData: users[], trainingCenters?: users[], schemesData: SchemesType[]}) => {

  const router = useRouter();
  const { lang: locale } = useParams()

  // States
  const [isCaptureImage, setIsCaptureImage] = useState(!!data?.capture_image_in_seconds || false)
  const [qpData, setQPData] = useState<QPType[]>([])
  const [theoryExamSetData, setTheoryExamSetData] = useState<exam_sets[]>([])
  const [practicalExamSetData, setPracticalExamSetData] = useState<exam_sets[]>([])
  const [vivaExamSetData, setVivaExamSetData] = useState<exam_sets[]>([])
  const [trainingPartnerData, setTPData] = useState<users[]>(tpData || []);
  const [tcData, setTCData] = useState<users[]>(trainingCenters || []);
  const [schemes, setSchemes] = useState<SchemesType[]>(schemesData);
  const [subSchemesData, setSubSchemesData] = useState<schemes[]>([]);
  const [loading, setLoading] = useState(false);
  const [tpLoading, setTPLoading] = useState(false);
  const [tcLoading, setTCLoading] = useState(false);
  const [schemeLoading, setSchemeLoading] = useState(false);
  const [subSchemeLoading, setSubSchemeLoading] = useState(false);
  const [addTCOpen, setAddTCOpen] = useState(false);

  // const [addSchemeOpen, setAddSchemeOpen] = useState(false);
  const [addSubSchemeOpen, setAddSubSchemeOpen] = useState(false);
  const [stateData, setStateData] = useState<state[]>([]);


  // Hooks
  const {
    control,
    setValue,
    reset,
    resetField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      sscId: data?.qualification_pack.ssc_id.toString() || '',
      qpId: '',
      theoryExamSetId: '',
      practicalExamSetId: '',
      vivaExamSetId: '',
      batchName: data?.batch_name || '',
      batchSize: data?.batch_size || '',
      scheme: data?.scheme_id.toString() || '',
      subScheme: '',
      trainingPartner: data?.training_partner_id.toString() || '',
      trainingCenter: data?.training_centre_id.toString() || '',
      loginRestrictCount: '3',
      assessmentStartDate: (data?.assessment_start_datetime ? new Date(data?.assessment_start_datetime) : null)  || undefined,
      assessmentEndDate: (data?.assessment_end_datetime ? new Date(data?.assessment_end_datetime) : null) || undefined,
      captureImage: false,
      captureImageInSeconds: data?.capture_image_in_seconds?.toString() || '',
      modeOfAssessment: data?.assessment_mode?.toString() || '',
    }
  })

  useEffect(() => {

    if(tpData && tpData.length > 0){
      setTPData(tpData)
    }

    if(schemesData && schemesData.length > 0){
      setSchemes(schemesData)
    }

  },[tpData, schemesData]);

  useEffect(() => {

    if(data?.qualification_pack.ssc_id){
      getQPData(data?.qualification_pack.ssc_id)
    }

    if(data?.scheme_id){
      getSubSchemes(data?.scheme_id);
    }
  },[data]);

  useEffect(() => {

    if(qpData.length > 0 && data?.qp_id){
      getExamSetData(data?.qp_id)
    }

  },[data, qpData]);

  const getQPData = async (ssc: number) => {
    const sscId = Number(ssc);

    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {

      setQPData(selectedSSC.qualification_packs || []);

    } else {

      setQPData([]);

    }

    setValue("qpId", data?.qp_id.toString() || '');
  }

  const getExamSetData = async (qp: number) => {
    const qpId = Number(qp);

    const selectedQP = qpData.find(qp => qp.id === qpId);

    if (selectedQP) {

      // setTheoryExamSetData(selectedQP.exam_sets || []);
      setTheoryExamSetData((selectedQP.exam_sets || []).filter(set => set.set_type === 'T'));
      setPracticalExamSetData((selectedQP.exam_sets || []).filter(set => set.set_type === 'P'));
      setVivaExamSetData((selectedQP.exam_sets || []).filter(set => set.set_type === 'V'));

    } else {

      setTheoryExamSetData([]);
      setPracticalExamSetData([]);
      setVivaExamSetData([]);

    }

    setValue("theoryExamSetId", data?.theory_exam_set_id ? data?.theory_exam_set_id.toString() : '' );
    setValue("practicalExamSetId", data?.practical_exam_set_id ? data?.practical_exam_set_id.toString() : '' );
    setValue("vivaExamSetId", data?.viva_exam_set_id ? data?.viva_exam_set_id.toString() : '' );
  }

  const getSubSchemes = async (scheme: number) => {
    const schemeId = scheme;

    const selectedScheme = schemes.find(scheme => scheme.id === schemeId);

    if(selectedScheme){

      setSubSchemesData(selectedScheme.sub_schemes || [])

    } else {
      setSubSchemesData([])
    }

    setValue("subScheme", data?.sub_scheme_id.toString() || '')
  }

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {

    setLoading(true);
    data.captureImage = isCaptureImage;

    if(id){

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${id}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });

      if(res.ok){
        handleReset();

        localStorage.setItem("formSubmitMessage", "Batch Updated Successfully!");

        router.push(getLocalizedUrl("/batches/list", locale as Locale))
        setLoading(false);

      } else {
        setLoading(false);
        toast.error('Batch not updated. Something went wrong!', {
          hideProgressBar: false
        });
      }

    }else{

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if(res.ok){
        setLoading(false);
        handleReset();

        localStorage.setItem("formSubmitMessage", "New Batch Created Successfully!");

        router.push(getLocalizedUrl("/batches/list", locale as Locale))

      } else {

        setLoading(false);

        toast.error('Something went wrong!', {
          hideProgressBar: false
        });
      }
    }

    setLoading(false);

    handleReset();
  }

  const handleReset = () => {
    reset();
    setValue("qpId", data?.qp_id.toString() || '');
    setValue("theoryExamSetId", data?.theory_exam_set_id ? data?.theory_exam_set_id.toString() : '');
    setValue("practicalExamSetId", data?.practical_exam_set_id ? data?.practical_exam_set_id.toString() : '');
    setValue("vivaExamSetId", data?.viva_exam_set_id ? data?.viva_exam_set_id.toString() : '');
    setValue("scheme", data?.scheme_id.toString() || '');
    setValue("subScheme", data?.sub_scheme_id.toString() || '');
    setValue("trainingPartner", data?.training_partner_id.toString() || '');
    setValue("trainingCenter", data?.training_centre_id.toString() || '');
    setIsCaptureImage(!!data?.capture_image_in_seconds || false);
  }

  const handleSSCChange = async (ssc: string) => {

    resetField("qpId", {defaultValue: ""})

    const sscId = Number(ssc);

    // setSSC(sscId);

    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {

      setQPData(selectedSSC.qualification_packs || []);

    } else {

      setQPData([]);

    }
  }

  const handleQPChange = async (qp: string) => {

    resetField("theoryExamSetId", {defaultValue: ""})

    const qpId = Number(qp);

    // setSSC(sscId);

    const selectedQP = qpData.find(qp => qp.id === qpId);

    if (selectedQP) {

      setTheoryExamSetData(selectedQP.exam_sets || []);

    } else {

      setTheoryExamSetData([]);

    }
  }

  const handleTPChange = async (tp: string) => {

    resetField("trainingCenter", {defaultValue: ""})

    const tpId = Number(tp);

    const trainingCenters = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tc?tpId=${tpId}`).then(function (response) { return response.json() });

    if (trainingCenters.length > 0) {

      setTCData(trainingCenters)

    } else {

      setTCData([])

    }
  }

  const handleSchemeChange = async (scheme: string) => {

    resetField("subScheme", {defaultValue: ""})

    const schemeId = Number(scheme);

    const subSchemes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sub-scheme/${schemeId}`).then(function (response) { return response.json() });

    if (subSchemes.length > 0) {

      setSubSchemesData(subSchemes)

    } else {

      setSubSchemesData([])

    }
  }

  const handleReloadScheme = async () => {

    setSchemeLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes`);


    if(res.ok){
      setSchemeLoading(false);

      const data = await res.json();

      setSchemes(data);

    } else {

      setSchemeLoading(false);

    }

    setSchemeLoading(false);

  }

  const handleReloadTP = async () => {

    setTPLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-partner`);


    if(res.ok){
      setTPLoading(false);

      const tpData = await res.json();

      setTPData(tpData);

    } else {

      setTPLoading(false);

    }

    setTPLoading(false);

  }

  const handleReloadTC = async (tp: string) => {

    setTCLoading(true);

    const tpId = Number(tp);

    const trainingCenters = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tc?tpId=${tpId}`).then(function (response) { return response.json() });

    if (trainingCenters.length > 0) {

      setTCData(trainingCenters)

    } else {

      setTCData([])

    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-partner`);


    if(res.ok){
      setTCLoading(false);

      const tpData = await res.json();

      setTPData(tpData);

    } else {

      setTCLoading(false);

    }

    setTCLoading(false);

  }

  const handleReloadSubScheme = async (scheme: string) => {
    setSubSchemeLoading(true)
    handleSchemeChange(scheme);
    setSubSchemeLoading(false);
  }

  const handleAddTC = async () => {

    try {

      const states = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/state`, {method: 'POST', headers: {'Content-Type': 'application/json', }}).then(function (response) { return response.json() });

      if (states.length > 0) {

        setStateData(states)

      } else {

        setStateData([])

      }

    } catch (error) {

      console.error('Error fetching city data:', error);
    }

    setAddTCOpen(true)
  }

  const selectedScheme = useWatch({control, name: 'scheme'});
  const selectedTP = useWatch({control, name: 'trainingPartner'});

  return (
    <>
      <Card>
        <CardHeader title={`${id ? 'Edit' : 'Create'} Batch`} />
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
                    <CustomTextField select SelectProps={{ MenuProps }} required={true} fullWidth label='SSC' {...field}
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
                  name='qpId'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField select SelectProps={{ MenuProps }} required={true} fullWidth label='Qualification Pack' {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleQPChange(e.target.value);
                      }}
                      {...(errors.qpId && { error: true, helperText: errors.qpId.message })}>
                      <MenuItem value=''>Select Qualification Pack</MenuItem>
                      {qpData && qpData.length > 0 ? (
                        qpData.map((qualificationPack) => (
                          <MenuItem key={qualificationPack.id.toString()} value={qualificationPack.id.toString()}>
                            {qualificationPack.qualification_pack_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No Qualification Pack found</MenuItem>
                      )}
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
              <Grid item xs={12} md={6} className='flex items-end gap-4'>
                <Controller
                  name='scheme'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField select SelectProps={{ MenuProps }} className='flex-1' required={true} fullWidth label='Scheme' {...field}

                      onChange={(e) => {
                        field.onChange(e); // Ensure the field value gets updated in the form state
                        handleSchemeChange(e.target.value); // Call your custom onChange handler
                      }}

                      {...(errors.scheme && { error: true, helperText: errors.scheme.message })}>
                      <MenuItem value=''>Select Scheme</MenuItem>
                      {schemes && schemes.length > 0 ? (
                        schemes.map((scheme) => (
                          <MenuItem key={scheme.id.toString()} value={scheme.id.toString()}>
                            {scheme.scheme_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No scheme found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
                <Tooltip title="Reload Scheme">
                  <CustomIconButton aria-label='Reload' color='primary' variant='tonal' onClick={handleReloadScheme} disabled={schemeLoading}>
                    {
                      schemeLoading ?
                      <CircularProgress size={22} color='inherit' />
                      :
                      <i className='tabler-reload' />
                    }
                  </CustomIconButton>
                </Tooltip>
                <Button variant='tonal' onClick={() => setAddSubSchemeOpen(true)} color='primary'>Add Scheme</Button>
              </Grid>
              <Grid item xs={12} md={6} className='flex items-end gap-4'>
                <Controller
                  name='subScheme'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      required={true}
                      fullWidth
                      SelectProps={{ MenuProps }}
                      label='Sub Scheme'
                      className='flex-1'
                      {...field}
                      {...(errors.subScheme && { error: true, helperText: errors.subScheme.message })}
                    >
                      <MenuItem value=''>Select Sub Scheme</MenuItem>
                      {subSchemesData && subSchemesData.length > 0 ? (
                        subSchemesData.map((subScheme) => (
                          <MenuItem key={subScheme.id.toString()} value={subScheme.id.toString()}>
                            {subScheme.scheme_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No sub scheme found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
                <Tooltip title="Reload Sub Scheme">
                  <CustomIconButton aria-label='Reload' color='primary' variant='tonal' onClick={() => handleReloadSubScheme(selectedScheme)} disabled={subSchemeLoading}>
                    {
                      subSchemeLoading ?
                      <CircularProgress size={22} color='inherit' />
                      :
                      <i className='tabler-reload' />
                    }
                  </CustomIconButton>
                </Tooltip>
                {/* <IconButton aria-label='capture screenshot' color='primary' size='large'>
                  <i className='tabler-aperture' />
                </IconButton> */}
                {/* <CustomIconButton target='_blank' href={`/${locale}/users/create/2`} aria-label='Add TP' color='primary' variant='tonal' onClick={handleReloadTP} disabled={tpLoading}>
                  <i className='tabler-plus' />
                </CustomIconButton> */}
                <Button variant='tonal' disabled={selectedScheme === ''} onClick={() => setAddSubSchemeOpen(true)} color={selectedScheme === '' ? 'secondary' : 'primary'}>Add Sub Scheme</Button>
              </Grid>
              <Grid item xs={12} sm={6} className='flex items-end gap-4'>
                <Controller
                  name='trainingPartner'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      className='flex-1'
                      select
                      SelectProps={{ MenuProps }}
                      required={true}
                      fullWidth
                      label='Training Partner'
                      {...field}
                      onChange={(e) => {
                        field.onChange(e); // Ensure the field value gets updated in the form state
                        handleTPChange(e.target.value); // Call your custom onChange handler
                      }}
                      {...(errors.trainingPartner && { error: true, helperText: errors.trainingPartner.message })}
                    >
                      <MenuItem value=''>Select Training Partner</MenuItem>
                      {trainingPartnerData && trainingPartnerData.length > 0 ? (
                        trainingPartnerData.map((trainingPartner) => (
                          <MenuItem key={trainingPartner.id.toString()} value={trainingPartner.id.toString()}>
                            {trainingPartner.first_name + " " + trainingPartner.last_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No training partner found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
                <Tooltip title="Reload TP">
                  <CustomIconButton aria-label='Reload' color='primary' variant='tonal' onClick={handleReloadTP} disabled={tpLoading}>
                    {
                      tpLoading ?
                      <CircularProgress size={22} color='inherit' />
                      :
                      <i className='tabler-reload' />
                    }
                  </CustomIconButton>
                </Tooltip>
                {/* <IconButton aria-label='capture screenshot' color='primary' size='large'>
                  <i className='tabler-aperture' />
                </IconButton> */}
                {/* <CustomIconButton target='_blank' href={`/${locale}/users/create/2`} aria-label='Add TP' color='primary' variant='tonal' onClick={handleReloadTP} disabled={tpLoading}>
                  <i className='tabler-plus' />
                </CustomIconButton> */}
                <Button variant='tonal' target='_blank' href={`/${locale}/users/create/2`}>Add TP</Button>
              </Grid>
              <Grid item xs={12} sm={6} className='flex items-end gap-4'>
                <Controller
                  name='trainingCenter'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      SelectProps={{ MenuProps }}
                      required={true}
                      fullWidth
                      label='Training Center'
                      className='flex-1'
                      {...field}
                      {...(errors.trainingCenter && { error: true, helperText: errors.trainingCenter.message })}
                    >
                      <MenuItem value=''>Select Training Center</MenuItem>
                      {tcData && tcData.length > 0 ? (
                        tcData.map((trainingCenter) => (
                          <MenuItem key={trainingCenter.id.toString()} value={trainingCenter.id.toString()}>
                            {trainingCenter.company_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No training center found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
                <Tooltip title="Reload TC">
                  <CustomIconButton aria-label='Reload' color='primary' variant='tonal' onClick={() => handleReloadTC(selectedTP)} disabled={tcLoading}>
                    {
                      tcLoading ?
                      <CircularProgress size={22} color='inherit' />
                      :
                      <i className='tabler-reload' />
                    }
                  </CustomIconButton>
                </Tooltip>
                <Button variant='tonal' color={selectedTP === '' ? 'secondary' : 'primary'} disabled={selectedTP === ''} onClick={handleAddTC} style={{ textWrap: "nowrap" }}>Add TC</Button>
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
                  name='loginRestrictCount'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      required={true}
                      label='Login Restrict Count'
                      placeholder=''
                      {...(errors.loginRestrictCount && { error: true, helperText: errors.loginRestrictCount.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='modeOfAssessment'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      required={true}
                      fullWidth
                      label='Mode Of Assessment'
                      {...field}
                      {...(errors.modeOfAssessment && { error: true, helperText: errors.modeOfAssessment.message })}
                    >
                      <MenuItem value=''>Select Mode Of Assessment</MenuItem>
                      {ModeOfAssessment && ModeOfAssessment.length > 0 ? (
                        ModeOfAssessment.map((mode) => (
                          <MenuItem key={mode.id} value={mode.id}>{mode.label}</MenuItem>
                        ))
                      ) : (
                        <MenuItem value="2">No Mode found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='theoryExamSetId'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      required={true}
                      fullWidth
                      label='Theory Exam Set'
                      {...field}
                      {...(errors.theoryExamSetId && { error: true, helperText: errors.theoryExamSetId.message })}
                    >
                      <MenuItem value=''>Select Exam Set</MenuItem>
                      {theoryExamSetData && theoryExamSetData.length > 0 ? (
                        theoryExamSetData.map((examSet) => (
                          <MenuItem key={examSet.id.toString()} value={examSet.id.toString()}>{examSet.set_name}</MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No Theory Exam Set Found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='practicalExamSetId'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      required={true}
                      fullWidth
                      label='Practical Exam Set'
                      {...field}
                      {...(errors.practicalExamSetId && { error: true, helperText: errors.practicalExamSetId.message })}
                    >
                      <MenuItem value=''>Select Exam Set</MenuItem>
                      {practicalExamSetData && practicalExamSetData.length > 0 ? (
                        practicalExamSetData.map((examSet) => (
                          <MenuItem key={examSet.id.toString()} value={examSet.id.toString()}>{examSet.set_name}</MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No Practical Exam Set Found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='vivaExamSetId'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      required={true}
                      fullWidth
                      label='Viva Exam Set'
                      {...field}
                      {...(errors.vivaExamSetId && { error: true, helperText: errors.vivaExamSetId.message })}
                    >
                      <MenuItem value=''>Select Exam Set</MenuItem>
                      {vivaExamSetData && vivaExamSetData.length > 0 ? (
                        vivaExamSetData.map((examSet) => (
                          <MenuItem key={examSet.id.toString()} value={examSet.id.toString()}>{examSet.set_name}</MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No Viva Exam Set Found</MenuItem>
                      )}
                    </CustomTextField>
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
                      placeholder='Camera Interval in Seconds.'
                      {...field}
                      {...(errors.captureImageInSeconds && { error: true, helperText: errors.captureImageInSeconds.message })}
                      disabled={!isCaptureImage}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} className='flex gap-4'>
                <Button variant='contained' type='submit' disabled={loading}>
                  {loading && <CircularProgress size={20} color='inherit' />}
                  Submit
                </Button>
                <Button variant='tonal' color='secondary' type='reset' onClick={() => handleReset()}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </form>
      </Card>
      <AddEditTCForm tpId={selectedTP ? Number(selectedTP) : undefined} open={addTCOpen} stateData={stateData} updateTCList={() => handleReloadTC(selectedTP)} handleClose={() => setAddTCOpen(!addTCOpen)} />
      <AddEditSchemeDialog open={addSubSchemeOpen} parentId={selectedScheme ? Number(selectedScheme) : undefined} updateSchemeList={() => handleSchemeChange(selectedScheme)} handleClose={() => setAddSubSchemeOpen(!addSubSchemeOpen)} />
    </>
  )

}

export default AddEditBatchForm
