


'use client'

// React Imports
import { useEffect, useState } from 'react'

import type { ChangeEvent } from 'react'

// import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'


// Components Imports

// Styled Component Imports
import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import type { state } from '@prisma/client'

import { Autocomplete, Chip, CircularProgress, createFilterOptions } from '@mui/material'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, trim, minLength, optional, regex, maxLength, check, array, date, pipe, number, minValue } from "valibot"

import { toast } from 'react-toastify'

import type { InferInput } from 'valibot'

import type { SSCType } from '@/types/sectorskills/sscType'

import type { QPType } from '@/types/qualification-pack/qpType'

import CustomTextField from '@core/components/mui/TextField'




import { generateRandomPassword } from '@/utils/passwordGenerator'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

import { MenuProps } from '@/configs/customDataConfig'

import type { UsersType } from '@/types/users/usersType'

// import type { UsersType } from '@/types/users/usersType'

// import type { UsersType } from '@/types/users/usersType'

type FormDataType = InferInput<typeof schema> & {
  profile?: File | string
  assessorCertificate: File | string
  certificate_8th: File | string
  certificate_10th: File | string
  certificate_12th: File | string
  certificate_DIPLOMA: File | string
  certificate_UG: File | string
  certificate_PG: File | string
  agreementCopy: File | string
  aadhaarCardImage: File | string,
  resumeCV: File | string,
  panCardImage: File | string,
  cancelCheck: File | string,
}


const schema = object(
  {
    sscId: array(pipe(string(), trim() , minLength(1, 'This field is required'))),
    jobRoles: array( pipe(number('must be number'), minValue(1, 'This field is required'))),
    jobValidUpto: array(date()),
    username: pipe(string(), trim() , minLength(1, 'This field is required')),
    email: pipe(string(), trim() , minLength(1, 'This field is required')),
    password: pipe(string(), trim() , minLength(1, 'This field is required')),
    employeeId: optional(pipe(string(), trim() ,)),
    firstName: optional(pipe(string(), trim() ,)),
    lastName: optional(pipe(string(), trim() ,)),
    state: optional(pipe(string(), trim() ,)),
    city: optional(pipe(string(), trim() ,)),
    pinCode: optional(pipe(string(), trim() , minLength(6, "Pin Code length must be 6 digits") , check((value) => !value || /^[1-9][0-9]{5}$/.test(value), 'Pin Code must contain only numbers and or can\'t starts from 0') , maxLength(6, 'Pin Code length must be 6 digits') ,)),
    address: optional(pipe(string(), trim() ,)),
    phoneNumber: pipe(string(), trim() , minLength(1, 'Phone Number is required') , regex(/^[0-9]+$/, 'Phone Number must contain only numbers') , minLength(10, 'Phone Number must be 10 digits') , maxLength(10, 'Phone Number must be 10 digits')),
    aadhaarNumber: pipe(string(), trim() , minLength(1, 'Aadhaar Number is required') , regex(/^[0-9]+$/, 'Aadhaar Number must contain only numbers') , minLength(12, 'Aadhaar Number must be 12 digits') , maxLength(12, 'Aadhaar Number must be 12 digits')),
    panCardNumber: optional(pipe(string(), trim() , check((value) => !value || value.length === 10, 'Pan Card Number must be 10 characters') ,)),
    toa_nomination: optional(pipe(string(), trim())),
    lastQualification: pipe(string(), trim() , minLength(1, 'This field is required')),
    bankName: optional(pipe(string(), trim() ,)),
    accountNumber: optional(pipe(string(), trim() , check((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Account number must contain only numbers') , maxLength(17, 'Max length is 17 digits'))),
    ifscCode: optional(pipe(string(), trim() ,)),

  }
)



const initialData = {
  profile: '',
  username: '',
  email: '',
  password: '',
  employeeId: '',
  sscId: [],
  jobRoles: [],
  jobValidUpto: [],
  firstName: '',
  lastName: '',
  state: '',
  city: '',
  pinCode: '',
  address: '',
  phoneNumber: '',
  aadhaarNumber: '',
  panCardNumber: '',
  toa_nomination: '',
  lastQualification: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  certificate_8th: '',
  certificate_10th: '',
  certificate_12th: '',
  certificate_DIPLOMA: '',
  certificate_UG: '',
  certificate_PG: '',
  assessorCertificate: '',
  agreementCopy: '',
  aadhaarCardImage: '',
  resumeCV: '',
  panCardImage: '',
  cancelCheck: '',
}

const filter = createFilterOptions();

async function createCity(name: string, state: string) {

  console.log('Creating city:', name);

  // Replace with your actual API call
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cityName: name, stateId: state }),
  });

  if (!res.ok) throw new Error('Failed to create city');

  return res.json();
}

const AssessorForm = ({data, assessorId}:{data?:UsersType, assessorId?: number}) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData);

  // console.log(data);

  const [jobRolesLength, setJobRolesLength] = useState<any[]>([])

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [fileInput, setFileInput] = useState<File | string>('')
  const [certificate8thInput, setCertificate8thInput] = useState<File | string>('')
  const [certificate10thInput, setCertificate10thInput] = useState<File | string>('')
  const [certificate12thInput, setCertificate12thInput] = useState<File | string>('')
  const [certificateDiplomaInput, setCertificateDiplomaInput] = useState<File | string>('')
  const [certificateUGInput, setCertificateUGInput] = useState<File | string>('')
  const [certificatePGInput, setCertificatePGInput] = useState<File | string>('')
  const [assessorCertificateInput, setAssessorCertificateInput] = useState<File | string>('')
  const [agreementCopyInput, setAgreementCopyFileInput] = useState<File | string>('')
  const [aadhaarCardInput, setAadhaarCardFileInput] = useState<File | string>('')
  const [resumeCVInput, setResumeCVFileInput] = useState<File | string>('')
  const [panCardInput, setPanCardFileInput] = useState<File | string>('')
  const [cancelCheckInput, setCancelCheckFileInput] = useState<File | string>('')
  const [imgSrc, setImgSrc] = useState<string>('/images/avatars/1.png')
  const [sscData, setSSCData] = useState<SSCType[]>([])
  const [stateData, setStateData] = useState<state[]>([])
  const [cityData, setCityData] = useState<any[]>([])
  const [qpData, setQPData] = useState<QPType[]>([])
  const [selectedQualification, setCountEducationCertificates] = useState('');
  const [jobValidUpto, setJobValidUpto] = useState<{ [key: number]: Date }>({});
  const [loading, setLoading] = useState(false);

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  useEffect(() => {
    if(data){

      // console.log("user data:", data);


      const rawJobRoles = data.user_additional_data.job_roles;

      const jobRoleIds: number[] = Array.isArray(rawJobRoles)
        ? rawJobRoles
            .filter((v): v is number => typeof v === 'number') // only keep numbers
        : [];

      const sscIds = sscData
        .filter(ssc =>
          ssc.qualification_packs?.some(qp => jobRoleIds.includes(qp.id))
        )
        .map(ssc => ssc.id.toString());

        console.log("sscIds:", sscIds);

      if(sscIds.length > 0){
        handleSSCChange(sscIds);
      }

      // if(data.ssc_id){
      //   handleSSCChange([data.ssc_id.toString()])
      // }

      if(data.state_id){
        handleStateChange(data.state_id.toString());
      }

      if(data.user_additional_data && data.user_additional_data.job_roles){
        setJobRolesLength(data.user_additional_data.job_roles as number[]);

        const jobRolesOld = data.user_additional_data.job_roles as number[];
        const jobValidUptoOld = data.user_additional_data.job_valid_upto ? JSON.parse(data.user_additional_data.job_valid_upto) : [];
        const result:{ [key: number]: Date } = {};

        if(jobRolesOld.length > 0 && jobValidUptoOld.length > 0){
          jobRolesOld.forEach((job:number, index:number) => {
            result[job] = new Date(jobValidUptoOld[index]);
          });
        }

        setJobValidUpto(result);
      }



      setFormData({
        profile: data.avatar || '',
        username: data.user_name || '',
        email: data.email || '',
        password: 'null',
        employeeId: data.user_additional_data && data.user_additional_data.employee_id?.toString() || '',
        sscId: sscIds.length > 0 ? sscIds : [],
        jobRoles: data.user_additional_data && data.user_additional_data.job_roles && (data.user_additional_data.job_roles as number[])?.length > 0 ? (data.user_additional_data.job_roles as number[]) : [],
        jobValidUpto: [],
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        state: stateData.length > 0 && data.state_id ? data.state_id?.toString() : '',
        city: cityData.length > 0 && data.city_id ? data.city_id?.toString() : '',
        pinCode:  data.pin_code || '',
        address: data.address || '',
        phoneNumber: data.mobile_no || '',
        aadhaarNumber: data.user_additional_data && data.user_additional_data.aadhaar_no || '',
        panCardNumber: data.user_additional_data && data.user_additional_data.pan_card_no || '',
        toa_nomination: data.user_additional_data && data.user_additional_data.toa_nomination?.toString() || '',
        lastQualification: data.user_additional_data && data.user_additional_data.last_qualification || '',
        bankName: data.user_additional_data && data.user_additional_data.bank_name || '',
        accountNumber: data.user_additional_data && data.user_additional_data.account_no?.toString() || '',
        ifscCode: data.user_additional_data && data.user_additional_data.ifsc_code?.toString() || '',
        certificate_8th: '',
        certificate_10th: '',
        certificate_12th: '',
        certificate_DIPLOMA: '',
        certificate_UG: '',
        certificate_PG: '',
        assessorCertificate: '',
        agreementCopy: '',
        aadhaarCardImage: '',
        resumeCV: '',
        panCardImage: '',
        cancelCheck: '',
      })

      setCountEducationCertificates(data.user_additional_data && data.user_additional_data.last_qualification || '')

      // console.log("assessor data:", data);
    }
  }, [data, sscData])

  const getSSCData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch SSC Data')
    }

    const sectorData = await res.json();

    setSSCData(sectorData);

  }

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
    getSSCData()
  }, []);

  const handleSSCChange = async (sscIds: string[]) => {

    if(sscIds.length === 0) {
    resetField("jobRoles")
    setJobValidUpto({});
    setJobRolesLength([]);
    }

    // setFormData({ ...formData, sscId: ssc, jobRoles: [] as string[]  })

    const selectedSSCs = sscData.filter(ssc => sscIds.includes(ssc.id.toString()));

    const allQPs = selectedSSCs.flatMap(ssc => ssc.qualification_packs || []);

    setQPData(allQPs);

    console.log("selectedSSCs:", selectedSSCs);

    // const sscId = Number(sscIds);

    // // setSSC(sscId);

    // const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    // if (selectedSSC) {

    //   setQPData(selectedSSC.qualification_packs || []);

    // } else {

    //   setQPData([]);

    // }
  }

  // const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

  const {
    control,

    reset,
    resetField,
    handleSubmit,

    setValue,
    watch,

    // setError,
    // clearErrors,

    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    values: formData
  })

  // useEffect(() => {

  //   if(jobRolesLength){
  //     console.log("jobRolesLength:", jobRolesLength, jobValidUpto);
  //   }

  // }, [jobRolesLength, jobValidUpto]);

  const onSubmit: SubmitHandler<FormDataType> = async (reqData: FormDataType) => {

    setLoading(true);

    reqData.profile = fileInput;
    reqData.jobValidUpto = Object.values(jobValidUpto);

    reqData.certificate_8th = certificate8thInput;
    reqData.certificate_10th = certificate10thInput;
    reqData.certificate_12th = certificate12thInput;
    reqData.certificate_DIPLOMA = certificateDiplomaInput;
    reqData.certificate_UG = certificateUGInput;
    reqData.certificate_PG = certificatePGInput;
    reqData.assessorCertificate = assessorCertificateInput;
    reqData.agreementCopy = agreementCopyInput;
    reqData.aadhaarCardImage = aadhaarCardInput;
    reqData.resumeCV = resumeCVInput;
    reqData.panCardImage = panCardInput;
    reqData.cancelCheck = cancelCheckInput;

    // console.log(data.aadhaarNumber);

    const formData = new FormData();

    formData.append("profile", reqData.profile as File);
    formData.append("jobValidUpto", JSON.stringify(reqData.jobValidUpto));
    formData.append("username", reqData.username);
    formData.append("email", data?.email || reqData.email);
    formData.append("password", reqData.password);
    formData.append("employeeId", reqData.employeeId || "");
    formData.append("sscId", JSON.stringify(data?.ssc_id ? [data.ssc_id.toString()] : reqData.sscId));
    formData.append("jobRoles", JSON.stringify(reqData.jobRoles));
    formData.append("firstName", reqData.firstName || "");
    formData.append("lastName", reqData.lastName || "");
    formData.append("state", reqData.state?.toString() || "");
    formData.append("city", reqData.city?.toString() || "");
    formData.append("pinCode", reqData.pinCode?.toString() || "");
    formData.append("address", reqData.address?.toString() || "");
    formData.append("phoneNumber", reqData.phoneNumber);
    formData.append("aadhaarNumber", reqData.aadhaarNumber);
    formData.append("panCardNumber", reqData.panCardNumber || "");
    formData.append("toa_nomination", reqData.toa_nomination || "");
    formData.append("lastQualification", reqData.lastQualification);
    formData.append("bankName", reqData.bankName || "");
    formData.append("accountNumber", reqData.accountNumber || "");
    formData.append("ifscCode", reqData.ifscCode || "");

    // documents

    formData.append("certificate_8th", reqData.certificate_8th as File);
    formData.append("certificate_10th", reqData.certificate_10th as File);
    formData.append("certificate_12th", reqData.certificate_12th as File);
    formData.append("certificate_DIPLOMA", reqData.certificate_DIPLOMA as File);
    formData.append("certificate_UG", reqData.certificate_UG as File);
    formData.append("certificate_PG", reqData.certificate_PG as File);

    formData.append("assessorCertificate", reqData.assessorCertificate as File);
    formData.append("agreementCopy", reqData.agreementCopy as File);
    formData.append("aadhaarCardImage", reqData.aadhaarCardImage as File);
    formData.append("resumeCV", reqData.resumeCV as File);
    formData.append("panCardImage", reqData.panCardImage as File);
    formData.append("cancelCheck", reqData.cancelCheck as File);

    // for(let key in data){
    //   formData.append(key, (data as any)[key])
    // }

    if(assessorId){

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor/${assessorId}`, {

        method: 'POST',
        body: formData

      });


      if (res.ok) {
        setLoading(false)
        reset();

        toast.success('Assessor has been Updated successfully!', {
          hideProgressBar: false
        });


      } else {
        setLoading(false)
        toast.error('Something went wrong!', {
          hideProgressBar: false
        });


      }
    } else {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor`, {

        method: 'POST',
        body: formData

      });


      if (res.ok) {
        setLoading(false)
        handleReset();

        toast.success('New Assessor has been created successfully!', {
          hideProgressBar: false
        });

      } else {

        handleReset();
        const resp = await res.json();

        console.log("error:", resp);
        setLoading(false)
        toast.error(resp.message || 'Something went wrong!', {
          hideProgressBar: false
        });

      }
    }

    setLoading(false)

    handleReset();
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();

    resetField("password", {defaultValue: newPassword})
  }

  const handleFileInputChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result as string)
      reader.readAsDataURL(files[0])
      setFileInput(files[0])

    }
  }

  const handle8thCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setCertificate8thInput(files[0])

    }
  }

  const handle10thCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setCertificate10thInput(files[0])

    }
  }

  const handle12thCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setCertificate12thInput(files[0])

    }
  }

  const handleDiplomaCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setCertificateDiplomaInput(files[0])

    }
  }

  const handleUGCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setCertificateUGInput(files[0])

    }
  }

  const handlePGCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setCertificatePGInput(files[0])

    }
  }

  const handleAssessorCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setAssessorCertificateInput(files[0])

    }
  }

  const handleAgreementCopyChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setAgreementCopyFileInput(files[0]);

    }
  }

  const handleAadhaarCardChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setAadhaarCardFileInput(files[0]);


    }
  }

  const handleResumeCVChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setResumeCVFileInput(files[0]);

    }
  }

  const handlePanCardImageChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setPanCardFileInput(files[0]);

    }
  }

  const handleCancelCheckImageChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      reader.readAsDataURL(files[0])
      setCancelCheckFileInput(files[0]);

    }
  }

  // Hooks

  const handleReset = () => {
    console.log("resetting form");
    setFileInput('')
    setCertificate8thInput('')
    setCertificate10thInput('')
    setCertificate12thInput('')
    setCertificateDiplomaInput('')
    setCertificateUGInput('')
    setCertificatePGInput('')
    setAssessorCertificateInput('')
    setAgreementCopyFileInput('')
    setAadhaarCardFileInput('')
    setResumeCVFileInput('')
    setPanCardFileInput('')
    setCancelCheckFileInput('')
    setCountEducationCertificates(data?.user_additional_data.last_qualification || '')
    reset();
  }

  const handleFileInputReset = () => {

    setFileInput('')

    setImgSrc('/images/avatars/1.png')
  }

  // Handle date change function
  const handleDateChange = (date: Date, index: number) => {


    const updatedJobValidUpto = { ...jobValidUpto, [index]: date };

    setJobValidUpto(updatedJobValidUpto);

  };

  const handleStateChange = async (state: string) => {

    resetField("city")

    if (state) {
      try {

        const cities = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/${state}`).then(function (response) { return response.json() });

        if (cities.length > 0) {

          setCityData(cities)

          if(data?.city_id){
            setValue('city', data.city_id.toString())
          }

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

  const isPDF = (filename:string) => {
    return filename.toLowerCase().endsWith('.pdf');
  }

  const state = watch('state');

  return (
    <Card>
      <CardHeader title={`${assessorId ? 'Edit' : 'Add'} Assessor`} />
      <Divider />
        <form onSubmit={handleSubmit(onSubmit)} encType='multipart/form-data'>
          <CardContent>
            <Grid container spacing={6}>
              <Grid item xs={12}>
                <Typography variant='body2' className='font-medium'>
                  1. Assessor Details
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <div className='flex max-sm:flex-col items-center gap-6'>
                  <img height={100} width={100} className='rounded' src={imgSrc} alt='Profile' />
                  <div className='flex flex-grow flex-col gap-4'>
                    <div className='flex flex-col sm:flex-row gap-4'>
                      <Button component='label' variant='contained' htmlFor='account-settings-upload-image'>
                        Upload New Photo
                        <input
                          hidden
                          type='file'
                          accept='image/png, image/jpeg'
                          onChange={handleFileInputChange}
                          id='account-settings-upload-image'
                        />
                      </Button>
                      <Button variant='tonal' color='secondary' onClick={handleFileInputReset}>
                        Reset
                      </Button>
                    </div>
                    <Typography>Allowed JPG, GIF or PNG. Max size of 800K</Typography>
                  </div>
                </div>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='username'
                  rules={{ required: true }}
                  render={({field}) => (
                    <CustomTextField
                      fullWidth
                      required={true}
                      label="SIDH Id (Assessor's Id/ auto reflected as User Name)"
                      {...field}
                      {...(errors.username && { error: true, helperText: errors.username.message })}
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
                      fullWidth
                      required={true}
                      disabled={data && data.email ? true : false}
                      type='email'
                      label='Email'
                      {...field}
                      {...(errors.email && { error: true, helperText: errors.email.message })}
                      placeholder='johndoe@gmail.com'
                    />
                  )}
                />
              </Grid>
              {data ? null
              : (
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
                      id='form-layout-separator-password'
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
                  name='employeeId'
                  rules={{ required: true }}
                  render={({field}) => (
                    <CustomTextField
                      fullWidth
                      label='Employee ID'
                      {...field}
                      {...(errors.employeeId && { error: true, helperText: errors.employeeId.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='sscId'
                  rules={{ required: true }}
                  render={({field}) => (
                    <CustomTextField
                      select
                      required={true}

                      // disabled={data && data.ssc_id ? true : false}

                      fullWidth
                      label='Select SSC'
                      {...field}
                      {...(errors.sscId && { error: true, helperText: errors.sscId.message })}

                      // onChange={(e) => {
                      //   handleSSCChange(e.target.value)
                      //   field.onChange(e)
                      // }}

                      onChange={(e) => {
                        const selectedIds = Array.from(e.target.value); // multiple values

                        handleSSCChange(selectedIds);
                        field.onChange(selectedIds);
                      }}

                      // SelectProps={{ MenuProps, displayEmpty: true }}

                      SelectProps={{ MenuProps, multiple: true }}
                    >
                      {sscData && sscData.length > 0 ? (
                        sscData.map((ssc, index) => (
                          <MenuItem key={index} value={ssc.id.toString()}>
                            {ssc.ssc_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No SSC found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>
              {/* <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='jobRoles'
                  rules={{ required: true }}
                  render={({field}) => (
                    <CustomTextField
                      select
                      required={true}
                      fullWidth
                      label='Select Job Roles (can be multiple)'
                      {...field}
                      SelectProps={{
                        MenuProps,
                        multiple: true,
                        onChange: e => {setJobRolesLength(e.target.value as number[]); field.onChange(e)}
                      }}
                      {...(errors.jobRoles && { error: true, helperText: errors.jobRoles?.[0]?.message })}
                    >
                      {qpData && qpData.length > 0 ? (
                        qpData.map((qualificationPack) => (
                          <MenuItem key={qualificationPack.id.toString()} disabled={data && data.user_additional_data.job_roles && JSON.parse(data.user_additional_data.job_roles).includes(qualificationPack.id) ? false : false} value={qualificationPack.id}>
                            {qualificationPack.qualification_pack_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No job roles found</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid> */}
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name="jobRoles"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      disableCloseOnSelect

                      options={qpData}
                      groupBy={(qp) => qp?.ssc?.ssc_name || "Unknown SSC"}
                      getOptionLabel={(qp) => qp?.qualification_pack_name || ''}

                      isOptionEqualToValue={(option, value) =>
                        option?.id === value?.id
                      }

                      value={
                        (field.value || [])
                          .map(id => qpData.find(qp => qp.id === id))
                          .filter((v) => v !== undefined)
                      }

                      onChange={(_, selectedOptions) => {
                        const ids = selectedOptions.map(opt => opt?.id);

                        setJobRolesLength(ids);
                        field.onChange(ids);
                      }}

                      renderTags={(value, getTagProps) =>
                        value.filter((option): option is QPType => option !== undefined)
                        .map((option, index: number) => (
                          <Chip
                            label={option.qualification_pack_name}
                            {...getTagProps({ index })}
                            key={option.id}
                          />
                        ))
                      }

                      renderInput={(params) => (
                        <CustomTextField
                          {...params}

                          // required

                          fullWidth
                          label="Select Job Roles (can be multiple) *"
                          error={!!errors.jobRoles}
                          helperText={
                            errors.jobRoles?.root?.message ||
                            errors.jobRoles?.message
                          }
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              {jobRolesLength.map((job, index) => {

                const qp = qpData?.find(qp => qp.id === job);

                // console.log("jobRolesLength:", jobRolesLength, job, qpData, qp);

                return (
                  <Grid key={index} item xs={12} sm={6} md={3}>
                    <AppReactDatepicker
                      className='flex-auto'
                      selected={jobValidUpto[Number(job)] || null}
                      showYearDropdown
                      showMonthDropdown
                      required={true}
                      onChange={(date: Date) => handleDateChange(date, Number(job)) }
                      placeholderText='MM/DD/YYYY'
                      customInput={
                        <CustomTextField
                          fullWidth
                          required={true}
                          label={`(${qp?.qualification_pack_id}) Certificate Valid Upto`}
                          className='flex-auto'
                          placeholder='MM-DD-YYYY'
                        />
                      }
                    />
                  </Grid>
                )

              })}
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' className='font-medium'>
                  2. Personal Info
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='firstName'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      {...field}
                      label='First Name'
                      placeholder='John'
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
                      fullWidth
                      label='Last Name'
                      placeholder='Doe'
                      {...field}
                      {...(errors.lastName && { error: true, helperText: errors.lastName.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='state'
                  render={({ field }) => (
                    <Autocomplete
                      fullWidth
                      options={stateData || []}
                      value={
                        stateData?.find((state) => state.state_id.toString() === field.value) || null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.state_id.toString() === value.state_id.toString()
                      }
                      getOptionLabel={(option) => option.state_name || ''}
                      getOptionKey={option => option.state_id}
                      onChange={(event, value) => {
                        handleStateChange(value?.state_id.toString() || '');
                        field.onChange(value?.state_id.toString() || '');
                      }}
                      renderInput={(params) => (
                        <CustomTextField
                          label='State'
                          {...params}
                          {...(errors.state && { error: true, helperText: errors.state.message })}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name="city"
                  render={({ field }) => (
                    <Autocomplete
                      fullWidth
                      options={cityData || []}
                      value={
                        cityData?.find((city) => city.city_id.toString() === field.value) || null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option?.city_id?.toString() === value?.city_id?.toString()
                      }
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        if (option.inputValue) return `Click to Add "${option.inputValue}"`;

                        return option.city_name || '';
                      }}
                      filterOptions={(options, params) => {
                        const filtered = filter(options, params);
                        const { inputValue } = params;

                        const isExisting = options.some(
                          (option) => inputValue === option.city_name
                        );

                        if (inputValue !== '' && !isExisting) {
                          filtered.push({
                            inputValue,
                            city_name: inputValue,
                          });
                        }

                        return filtered;
                      }}
                      onChange={async (event, newValue) => {
                        if (typeof newValue === 'string' && state) {
                          try {
                            const created = await createCity(newValue, state);

                            field.onChange(created.data.city_id.toString());
                            setCityData((prev) => [...(prev || []), created.data]);
                          } catch (err) {
                            console.error('Create failed', err);
                          }
                        } else if (newValue?.inputValue && state) {
                          try {
                            const created = await createCity(newValue.inputValue, state);

                            field.onChange(created.data.city_id.toString());
                            setCityData((prev) => [...(prev || []), created.data]);
                          } catch (err) {
                            console.error('Create failed', err);
                          }
                        } else {
                          field.onChange(newValue?.city_id?.toString() || '');
                        }
                      }}
                      renderInput={(params) => (
                        <CustomTextField
                          {...params}
                          label="City"
                          error={!!errors.city}
                          helperText={errors.city?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='pinCode'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      label='Pin code'
                      {...field}
                      {...(errors.pinCode && { error: true, helperText: errors.pinCode.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='address'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      multiline
                      label='Address'
                      {...field}
                      {...(errors.address && { error: true, helperText: errors.address.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='phoneNumber'
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      required={true}
                      label='Phone Number'
                      placeholder='123-456-7890'
                      {...field}
                      {...field}
                      {...(errors.phoneNumber && { error: true, helperText: errors.phoneNumber.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='aadhaarNumber'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      required={true}
                      label='Aadhaar No.'
                      {...field}
                      {...(errors.aadhaarNumber && { error: true, helperText: errors.aadhaarNumber.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='panCardNumber'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      label='Pan Card No.'
                      {...field}
                      {...(errors.panCardNumber && { error: true, helperText: errors.panCardNumber.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='toa_nomination'
                  render={({ field }) => (
                    <CustomTextField
                      select
                      fullWidth
                      label='TOA Nomination Status'
                      {...field}
                      {...(errors.city && { error: true, helperText: errors.city.message })}
                    >
                      <MenuItem value=''>Select TOA Nomination</MenuItem>
                      <MenuItem value='1'>Yes</MenuItem>
                      <MenuItem value='0'>No</MenuItem>
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='lastQualification'
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      required={true}
                      fullWidth
                      label='Last Qualification'
                      {...field}
                      {...(errors.lastQualification && { error: true, helperText: errors.lastQualification.message })}
                      onChange={e => {

                        if(e.target.value === ''){
                          setCountEducationCertificates('');
                        }else{
                          setCountEducationCertificates(e.target.value);
                        }

                        field.onChange(e)

                      }}
                      SelectProps={{ MenuProps}}
                    >
                      <MenuItem value=''>Select Last Qualification</MenuItem>
                      <MenuItem value='8th'>8th</MenuItem>
                      <MenuItem value='10th'>10th</MenuItem>
                      <MenuItem value='12th'>12th</MenuItem>
                      <MenuItem value='Diploma'>Diploma</MenuItem>
                      <MenuItem value='UG'>Undergraduate</MenuItem>
                      <MenuItem value='PG'>Postgraduate</MenuItem>
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='bankName'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      label='Bank Name'
                      {...field}
                      {...(errors.bankName && { error: true, helperText: errors.bankName.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='accountNumber'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      label='Account No.'
                      {...field}
                      {...(errors.accountNumber && { error: true, helperText: errors.accountNumber.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  control={control}
                  name='ifscCode'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      label='IFSC Code'
                      {...field}
                      {...(errors.ifscCode && { error: true, helperText: errors.ifscCode.message })}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' className='font-medium'>
                  3. Documents
                </Typography>
              </Grid>

              {selectedQualification === '8th' || selectedQualification === '10th' ||
              selectedQualification === '12th' || selectedQualification === 'Diploma' ||
              selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextField
                    fullWidth
                    required={false}
                    type='file'
                    label='8th Certificate'
                    inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                    onChange={e => {handle8thCertificateChange(e);}}
                  />
                  {
                    data?.user_additional_data && data?.user_additional_data.certificate_8th && (
                      <>
                        {isPDF(data?.user_additional_data.certificate_8th) ? (
                          <embed
                            src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_8th}`}
                            width="100%"
                            height='200px'
                            type="application/pdf"
                            style={{ aspectRatio: '1/1' }}
                          />
                        ) :
                          <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                            <CardContent>
                              <img width={'100%'} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_8th}`} alt="8th Certificate" />
                            </CardContent>
                          </Card>
                        }
                      </>
                    )
                  }
                </Grid>
              ) : null}

              {selectedQualification === '10th' ||
              selectedQualification === '12th' || selectedQualification === 'Diploma' ||
              selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextField
                    fullWidth
                    required={data?.user_additional_data && data?.user_additional_data.certificate_10th ? false : true}
                    type='file'
                    label='10th Certificate'
                    inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                    onChange={e => {handle10thCertificateChange(e);}}
                  />
                  {
                    data?.user_additional_data && data?.user_additional_data.certificate_10th && (
                      <>
                        {isPDF(data?.user_additional_data.certificate_10th) ? (
                          <embed
                            src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_10th}`}
                            width="100%"
                            height='200px'
                            type="application/pdf"
                            style={{ aspectRatio: '1/1' }}
                          />
                        ) :
                        <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                          <CardContent>
                            <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_10th}`} alt="10th Certificate" />
                          </CardContent>
                        </Card>
                      }
                    </>
                    )
                  }
                </Grid>
              ) : null}

              {selectedQualification === '12th' || selectedQualification === 'Diploma' ||
              selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextField
                    fullWidth
                    required={data?.user_additional_data && data?.user_additional_data.certificate_12th ? false : true}
                    type='file'
                    label='12th Certificate'
                    name='certificate_12th'
                    inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                    onChange={e => {handle12thCertificateChange(e);}}
                  />
                  {
                    data?.user_additional_data && data?.user_additional_data.certificate_12th && (
                      <>
                        {isPDF(data?.user_additional_data.certificate_12th) ? (
                          <embed
                            src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_12th}`}
                            width="100%"
                            height='200px'
                            type="application/pdf"
                            style={{ aspectRatio: '1/1' }}
                          />
                        ) :
                          <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                            <CardContent>
                              <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_12th}`} alt="12th Certificate" />
                            </CardContent>
                          </Card>
                        }
                      </>
                    )
                  }
                </Grid>
              ) : null}

              {selectedQualification === 'Diploma' || selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextField
                    fullWidth
                    required={data?.user_additional_data && data?.user_additional_data.certificate_DIPLOMA ? false : true}
                    type='file'
                    label='Diploma Certificate'
                    name='certificate_DIPLOMA'
                    inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                    onChange={e => {handleDiplomaCertificateChange(e);}}
                  />
                  {
                    data?.user_additional_data && data?.user_additional_data.certificate_DIPLOMA && (
                      <>
                        {isPDF(data?.user_additional_data.certificate_DIPLOMA) ? (
                          <embed
                            src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_DIPLOMA}`}
                            width="100%"
                            height='200px'
                            type="application/pdf"
                            style={{ aspectRatio: '1/1' }}
                          />
                        ) :
                          <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                            <CardContent>
                              <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_DIPLOMA}`} alt="Diploma Certificate" />
                            </CardContent>
                          </Card>
                        }
                      </>
                    )
                  }
                </Grid>
              ) : null}

              {selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextField
                    fullWidth
                    required={data?.user_additional_data && data?.user_additional_data.certificate_UG ? false : true}
                    type='file'
                    label='UG Certificate'
                    name='certificate_UG'
                    inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                    onChange={e => {handleUGCertificateChange(e);}}
                  />
                  {
                    data?.user_additional_data && data?.user_additional_data.certificate_UG && (
                      <>
                        {isPDF(data?.user_additional_data.certificate_UG) ? (
                          <embed
                            src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_UG}`}
                            width="100%"
                            height='200px'
                            type="application/pdf"
                            style={{ aspectRatio: '1/1' }}
                          />
                        ) :
                          <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                            <CardContent>
                              <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_UG}`} alt="UG Certificate" />
                            </CardContent>
                          </Card>
                        }
                      </>
                    )
                  }
                </Grid>
              ) : null}

              {selectedQualification === 'PG' ? (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextField
                    fullWidth
                    required={data?.user_additional_data && data?.user_additional_data.certificate_PG ? false : true}
                    type='file'
                    label='PG Certificate'
                    name='certificate_PG'
                    inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                    onChange={e => {handlePGCertificateChange(e);}}
                  />
                  {
                    data?.user_additional_data && data?.user_additional_data.certificate_PG && (
                      <>
                        {isPDF(data?.user_additional_data.certificate_PG) ? (
                          <embed
                            src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_PG}`}
                            width="100%"
                            height='200px'
                            type="application/pdf"
                            style={{ aspectRatio: '1/1' }}
                          />
                        ) :
                          <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                            <CardContent>
                              <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.certificate_PG}`} alt="PG Certificate" />
                            </CardContent>
                          </Card>
                        }
                      </>
                    )
                  }
                </Grid>
              ) : null}

              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name='assessorCertificate'
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      required={data?.user_additional_data && data?.user_additional_data.assessor_certificate ? false : true}
                      type='file'
                      label='Assessor Certificate'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      {...field}
                      {...(errors.assessorCertificate && { error: true, helperText: errors.assessorCertificate.message })}
                      onChange={e => {handleAssessorCertificateChange(e); field.onChange(e)}}
                    />
                  )}
                />
                {
                  data?.user_additional_data && data?.user_additional_data.assessor_certificate && (
                    <>
                      {isPDF(data?.user_additional_data.assessor_certificate) ? (
                        <embed
                          src={`/uploads/agency/users/${data.id}/${data.user_additional_data.assessor_certificate}`}
                          width="100%"
                          height='200px'
                          type="application/pdf"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ) :
                        <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                        <CardContent>
                          <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.assessor_certificate}`} alt="Assessor Certificate" />
                        </CardContent>
                      </Card>
                      }
                    </>
                  )
                }
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name='agreementCopy'
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      required={data?.user_additional_data && data?.user_additional_data.assessor_certificate ? false : true}
                      type='file'
                      label='Agreement Copy'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      {...field}
                      {...(errors.agreementCopy && { error: true, helperText: errors.agreementCopy.message })}
                      onChange={e => {handleAgreementCopyChange(e); field.onChange(e)}}
                    />
                  )}
                />
                {
                  data?.user_additional_data && data?.user_additional_data.agreement_copy && (
                    <>
                      {isPDF(data?.user_additional_data.agreement_copy) ? (
                        <embed
                          src={`/uploads/agency/users/${data.id}/${data.user_additional_data.agreement_copy}`}
                          width="100%"
                          height='200px'
                          type="application/pdf"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ) :
                        <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                        <CardContent>
                          <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.agreement_copy}`} alt="Agreement Copy" />
                        </CardContent>
                      </Card>
                      }
                    </>
                  )
                }
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name='aadhaarCardImage'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      type='file'
                      required={data?.user_additional_data && data?.user_additional_data.aadhaar_card ? false : true}
                      label='Aadhaar Card'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      {...field}
                      {...(errors.aadhaarCardImage && { error: true, helperText: errors.aadhaarCardImage.message })}
                      onChange={e => { handleAadhaarCardChange(e); field.onChange(e) }}
                    />
                  )}
                />
                {
                  data?.user_additional_data && data?.user_additional_data.aadhaar_card && (
                    <>
                      {isPDF(data?.user_additional_data.aadhaar_card) ? (
                        <embed
                          src={`/uploads/agency/users/${data.id}/${data.user_additional_data.aadhaar_card}`}
                          width="100%"
                          height='200px'
                          type="application/pdf"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ) :
                        <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                        <CardContent>
                          <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.aadhaar_card}`} alt="Aadhaar Card" />
                        </CardContent>
                      </Card>
                      }
                    </>
                  )
                }
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name='resumeCV'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      type='file'
                      required={data?.user_additional_data && data?.user_additional_data.resume_cv ? false : true}
                      label='Resume/ CV'
                      inputProps={{ accept: 'application/pdf' }}
                      {...field}
                      {...(errors.resumeCV && { error: true, helperText: errors.resumeCV.message })}
                      onChange={e => { handleResumeCVChange(e); field.onChange(e) }}
                    />
                  )}
                />
                {
                  data?.user_additional_data && data?.user_additional_data.resume_cv && (
                    <>
                      {isPDF(data?.user_additional_data.resume_cv) ? (
                        <embed
                          src={`/uploads/agency/users/${data.id}/${data.user_additional_data.resume_cv}`}
                          width="100%"
                          height='200px'
                          type="application/pdf"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ) :
                        <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                        <CardContent>
                          <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.resume_cv}`} alt="Resume CV" />
                        </CardContent>
                      </Card>
                      }
                    </>
                  )
                }
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name='panCardImage'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      type='file'
                      label='Pan Card'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      {...field}
                      {...(errors.panCardImage && { error: true, helperText: errors.panCardImage.message })}
                      onChange={e => { handlePanCardImageChange(e); field.onChange(e) }}
                    />
                  )}
                />
                {
                  data?.user_additional_data && data?.user_additional_data.pan_card && (
                    <>
                      {isPDF(data?.user_additional_data.pan_card) ? (
                        <embed
                          src={`/uploads/agency/users/${data.id}/${data.user_additional_data.pan_card}`}
                          width="100%"
                          height='200px'
                          type="application/pdf"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ) :
                        <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                        <CardContent>
                          <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.pan_card}`} alt="Pan Card" />
                        </CardContent>
                      </Card>
                      }
                    </>
                  )
                }
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name='cancelCheck'
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      type='file'
                      label='Cancel Check'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      {...field}
                      {...(errors.cancelCheck && { error: true, helperText: errors.cancelCheck.message })}
                      onChange={e => { handleCancelCheckImageChange(e); field.onChange(e) }}
                    />
                  )}
                />
                {
                  data?.user_additional_data && data?.user_additional_data.cancel_check && (
                    <>
                      {isPDF(data?.user_additional_data.cancel_check) ? (
                        <embed
                          src={`/uploads/agency/users/${data.id}/${data.user_additional_data.cancel_check}`}
                          width="100%"
                          height='200px'
                          type="application/pdf"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ) :
                        <Card variant='outlined' sx={{ maxWidth: '200px', margin: 'auto', marginTop: '20px' }}>
                        <CardContent>
                          <img width={'100%'} height={100} src={`/uploads/agency/users/${data.id}/${data.user_additional_data.cancel_check}`} alt="Cancel Check" />
                        </CardContent>
                      </Card>
                      }
                    </>
                  )
                }
              </Grid>
            </Grid>
          </CardContent>
          <Divider />
          <CardActions>
            <Button type='submit' variant='contained' className='mie-2 gap-2' disabled={loading || jobRolesLength.length === 0}>
              {loading && <CircularProgress size={20} color='inherit' />}
              Submit
            </Button>
            <Button
              type='reset'
              variant='tonal'
              color='secondary'
              onClick={() => {
                handleReset()
              }}
            >
              Reset
            </Button>
          </CardActions>
        </form>
    </Card>
  )
}

export default AssessorForm
