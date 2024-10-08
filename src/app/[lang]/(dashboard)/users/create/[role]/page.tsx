


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

import type { city, state } from '@prisma/client'

import { CircularProgress } from '@mui/material'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, trim, minLength, optional, regex, maxLength, check, array, date, pipe } from "valibot"

import { toast } from 'react-toastify'

import type { InferInput } from 'valibot'

import type { SSCType } from '@/types/sectorskills/sscType'

import type { QPType } from '@/types/qualification-pack/qpType'

import CustomTextField from '@core/components/mui/TextField'




import { generateRandomPassword } from '@/utils/passwordGenerator'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import TPForm from '@/views/agency/users/forms/TPForm'
import SkeletonForm from '@/components/skeleton/SkeletonForm'

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

// type FormDataType = {
//   profile: File | null
//   username: string
//   email: string
//   password: string
//   isPasswordShown: boolean
//   confirmPassword: string
//   isConfirmPasswordShown: boolean
//   employeeId: string
//   sscId: string
//   jobRoles: string[]
//   jobValidUpto: (Date | null)[]
//   firstName: string
//   lastName: string
//   state: string
//   city: string
//   pinCode: string
//   address: string
//   phoneNumber: string
//   aadhaarNumber: string
//   panCardNumber: string
//   lastQualification: string
//   bankName: string
//   accountNumber: string
//   ifscCode: string
//   educationalCertificates: string[]
//   assessorCertificate: string
//   agreementCopy: string
//   aadhaarCardImage: string
//   resumeCV: string
//   panCardImage: string
//   cancelCheck: string
//   country: string
//   language: string[]
//   date: Date | null
// }


const schema = object(
  {
    sscId: pipe(string(), trim() , minLength(1, 'This field is required')),
    jobRoles: array( pipe(string(), trim() , minLength(1, 'This field is required'))),

    // jobValidUpto: array( string([
    //   toTrimmed(),
    //   minLength(1, 'This field is required')
    // ])),

    jobValidUpto: array(date()),
    username: pipe(string(), trim() , minLength(1, 'This field is required')),
    email: pipe(string(), trim() , minLength(1, 'This field is required')),
    password: pipe(string(), trim() , minLength(1, 'This field is required')),
    employeeId: optional(pipe(string(), trim() ,)),
    firstName: optional(pipe(string(), trim() ,)),
    lastName: optional(pipe(string(), trim() ,)),
    state: optional(pipe(string(), trim() ,)),
    city: optional(pipe(string(), trim() ,)),
    pinCode: optional(
      pipe(
        string(),
        trim() ,
        minLength(6, "Pin Code length must be 6 digits") ,
        check((value) => !value || /^[1-9][0-9]{5}$/.test(value), 'Pin Code must contain only numbers and or can\'t starts from 0') ,
        maxLength(6, 'Pin Code length must be 6 digits') ,

        // regex(/^[1-9][0-9]{5}$/, 'Pin Code must contain only numbers and or can\'t starts from 0')
      )
    ),
    address: optional(pipe(string(), trim() ,)),
    phoneNumber: pipe(string(), trim() , minLength(1, 'Phone Number is required') , regex(/^[0-9]+$/, 'Phone Number must contain only numbers') , minLength(10, 'Phone Number must be 10 digits') , maxLength(10, 'Phone Number must be 10 digits')),
    aadhaarNumber: pipe(string(), trim() , minLength(1, 'Aadhaar Number is required') , regex(/^[0-9]+$/, 'Aadhaar Number must contain only numbers') , minLength(12, 'Aadhaar Number must be 12 digits') , maxLength(12, 'Aadhaar Number must be 12 digits')),
    panCardNumber: optional(pipe(string(), trim() , check((value) => !value || value.length === 10, 'Pan Card Number must be 10 characters') ,)),
    lastQualification: pipe(string(), trim() , minLength(1, 'This field is required')),
    bankName: optional(pipe(string(), trim() ,)),
    accountNumber: optional(
      pipe(
        string(),
        trim() ,
        check((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Account number must contain only numbers') ,

        // regex(/^[0-9]+(?:\.[0-9]+)?$/, 'Account number must contain only numbers'), maxLength(17, 'Max length is 17 digits')
        )
      ),
    ifscCode: optional(pipe(string(), trim() ,)),

    // assessorCertificate: optional(maxSize(1024 * 1024 * 10, 'Please select a file smaller than 10 MB.')),
    // assessorCertificate: optional(instance(File, "Assessor Certificate is required",[
    //   mimeType(["image/jpeg", "image/png", "application/pdf"], "Only JPG, PNG and PDF files are accepted"),
    //   maxSize( 1024, 'Please select a file smaller than 2 MB.')
    // ])),
    // educationalCertificates: array(string()),

  }
)



const initialData = {
  profile: '',
  username: '',
  email: '',
  password: '',
  employeeId: '',
  sscId: '',
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



const UserCreate = ({ params }: { params: { role: string } }) => {
  // States
  const [formData] = useState<FormDataType>(initialData);

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
  const [cityData, setCityData] = useState<city[]>([])
  const [qpData, setQPData] = useState<QPType[]>([])
  const [selectedQualification, setCountEducationCertificates] = useState('');
  const [jobValidUpto, setJobValidUpto] = useState<{ [key: number]: Date }>({});
  const [loading, setLoading] = useState(false);

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

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

  const handleSSCChange = async (ssc: string) => {

    resetField("jobRoles")

    // setFormData({ ...formData, sscId: ssc, jobRoles: [] as string[]  })

    const sscId = Number(ssc);

    // setSSC(sscId);

    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {

      setQPData(selectedSSC.qualification_packs || []);

    } else {

      setQPData([]);

    }
  }

  // const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

  const {
    control,

    reset,
    resetField,
    handleSubmit,

    // setValue,
    // setError,
    // clearErrors,

    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    values: formData
  })

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {

    setLoading(true);

    data.profile = fileInput;
    data.jobValidUpto = Object.values(jobValidUpto);

    data.certificate_8th = certificate8thInput;
    data.certificate_10th = certificate10thInput;
    data.certificate_12th = certificate12thInput;
    data.certificate_DIPLOMA = certificateDiplomaInput;
    data.certificate_UG = certificateUGInput;
    data.certificate_PG = certificatePGInput;
    data.assessorCertificate = assessorCertificateInput;
    data.agreementCopy = agreementCopyInput;
    data.aadhaarCardImage = aadhaarCardInput;
    data.resumeCV = resumeCVInput;
    data.panCardImage = panCardInput;
    data.cancelCheck = cancelCheckInput;

    console.log(data.aadhaarNumber);

    const formData = new FormData();

    formData.append("profile", data.profile as File);
    formData.append("jobValidUpto", JSON.stringify(data.jobValidUpto));
    formData.append("username", data.username);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("employeeId", data.employeeId || "");
    formData.append("sscId", data.sscId);
    formData.append("jobRoles", JSON.stringify(data.jobRoles));
    formData.append("firstName", data.firstName || "");
    formData.append("lastName", data.lastName || "");
    formData.append("state", data.state?.toString() || "");
    formData.append("city", data.city?.toString() || "");
    formData.append("pinCode", data.pinCode?.toString() || "");
    formData.append("address", data.address?.toString() || "");
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("aadhaarNumber", data.aadhaarNumber);
    formData.append("panCardNumber", data.panCardNumber || "");
    formData.append("lastQualification", data.lastQualification);
    formData.append("bankName", data.bankName || "");
    formData.append("accountNumber", data.accountNumber || "");
    formData.append("ifscCode", data.ifscCode || "");

    // documents

    formData.append("certificate_8th", data.certificate_8th as File);
    formData.append("certificate_10th", data.certificate_10th as File);
    formData.append("certificate_12th", data.certificate_12th as File);
    formData.append("certificate_DIPLOMA", data.certificate_DIPLOMA as File);
    formData.append("certificate_UG", data.certificate_UG as File);
    formData.append("certificate_PG", data.certificate_PG as File);

    formData.append("assessorCertificate", data.assessorCertificate as File);
    formData.append("agreementCopy", data.agreementCopy as File);
    formData.append("aadhaarCardImage", data.aadhaarCardImage as File);
    formData.append("resumeCV", data.resumeCV as File);
    formData.append("panCardImage", data.panCardImage as File);
    formData.append("cancelCheck", data.cancelCheck as File);

    // for(let key in data){
    //   formData.append(key, (data as any)[key])
    // }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor`, {

      method: 'POST',

      // headers: {
      //   'Content-Type': 'multipart/form-data',
      // },

      // body: JSON.stringify(data)

      body: formData

    });


    if (res.ok) {
      setLoading(false)
      reset();

      // localStorage.setItem("userCreatedSuccess", "true");

      // router.push(getLocalizedUrl("/users", locale as Locale))

      toast.success('New Assessor has been created successfully!', {
        hideProgressBar: false
      });

      // updateNOSList();

    } else {
      setLoading(false)
      toast.error('Something went wrong!', {
        hideProgressBar: false
      });


    }

    // console.log("submitted data: ", data)

    handleReset();
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();

    resetField("password", {defaultValue: newPassword})

    // setFormData({ ...formData, password: newPassword })
  }

  const handleFileInputChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result as string)
      reader.readAsDataURL(files[0])
      setFileInput(files[0])

      // setFormData({ ...formData, profile: files[0]})

      // if (reader.result !== null) {
      //   setFileInput(reader.result as string)
      // }

    }
  }

  const handle8thCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setCertificate8thInput(files[0])

      // setFormData({ ...formData, assessorCertificate: files[0] })
      // if (reader.result !== null) {
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handle10thCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setCertificate10thInput(files[0])

      // setFormData({ ...formData, assessorCertificate: files[0] })
      // if (reader.result !== null) {
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handle12thCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setCertificate12thInput(files[0])

      // setFormData({ ...formData, assessorCertificate: files[0] })
      // if (reader.result !== null) {
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handleDiplomaCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setCertificateDiplomaInput(files[0])

      // setFormData({ ...formData, assessorCertificate: files[0] })
      // if (reader.result !== null) {
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handleUGCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setCertificateUGInput(files[0])

      // setFormData({ ...formData, assessorCertificate: files[0] })
      // if (reader.result !== null) {
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handlePGCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setCertificatePGInput(files[0])

      // setFormData({ ...formData, assessorCertificate: files[0] })
      // if (reader.result !== null) {
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handleAssessorCertificateChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setAssessorCertificateInput(files[0])

      // setFormData({ ...formData, assessorCertificate: files[0] })
      // if (reader.result !== null) {
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handleAgreementCopyChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setAgreementCopyFileInput(files[0]);

      // if (reader.result !== null) {
      //   setFormData({ ...formData, agreementCopy: reader.result as string })
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handleAadhaarCardChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setAadhaarCardFileInput(files[0]);

      // if (reader.result !== null) {
      //   setFormData({ ...formData, agreementCopy: reader.result as string })
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handleResumeCVChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setResumeCVFileInput(files[0]);

      // if (reader.result !== null) {
      //   setFormData({ ...formData, agreementCopy: reader.result as string })
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handlePanCardImageChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setPanCardFileInput(files[0]);

      // if (reader.result !== null) {
      //   setFormData({ ...formData, agreementCopy: reader.result as string })
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  const handleCancelCheckImageChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {

      // reader.onload = () => setImgSrc(reader.result as string)

      reader.readAsDataURL(files[0])
      setCancelCheckFileInput(files[0]);

      // if (reader.result !== null) {
      //   setFormData({ ...formData, agreementCopy: reader.result as string })
      //   // setFileInput(reader.result as string)
      // }
      // console.log(files[0])

    }
  }

  // Hooks

  const handleReset = () => {

    // setFormData(initialData);

    reset();
  }

  const handleFileInputReset = () => {

    setFileInput('')

    setImgSrc('/images/avatars/1.png')
  }

  // Handle date change function
  const handleDateChange = (date: Date, index: number) => {

    // const updatedDates = [...formData.jobValidUpto];

    // updatedDates[index] = date;

    // setFormData({ ...formData, jobValidUpto: updatedDates });

    const updatedJobValidUpto = { ...jobValidUpto, [index]: date };

    setJobValidUpto(updatedJobValidUpto);

  };

  const handleStateChange = async (state: string) => {

    resetField("city")

    // setFormData({ ...formData, state: state, city: '' })

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

  // const qualificationCounts: {
  //   [key: string]: number;
  // } = {
  //   '8th': 1,
  //   '10th': 2,
  //   '12th': 3,
  //   'Diploma': 4,
  //   'UG': 5,
  //   'PG': 6,
  // };

  if(Number(params.role) === 1){

    return (
      <Card>
        <CardHeader title={`Create ${Number(params.role) === 1 ? 'Assessor' : Number(params.role) === 2 ? 'Training Partner' : 'User'}`} />
        <Divider />
        {Number(params.role) === 1 &&
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
                        type='email'
                        label='Email'
                        {...field}
                        {...(errors.email && { error: true, helperText: errors.email.message })}
                        placeholder='johndoe@gmail.com'
                      />
                    )}
                  />
                </Grid>
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
                        fullWidth
                        label='Select SSC'
                        {...field}
                        {...(errors.sscId && { error: true, helperText: errors.sscId.message })}
                        onChange={(e) => {
                          handleSSCChange(e.target.value)
                          field.onChange(e)
                        }}
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
                <Grid item xs={12} sm={6}>
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
                          multiple: true,
                          onChange: e => {setJobRolesLength(e.target.value as string[]); field.onChange(e)}
                        }}
                        {...(errors.jobRoles && { error: true, helperText: errors.jobRoles.message })}
                      >
                        {qpData && qpData.length > 0 ? (
                          qpData.map((qualificationPack) => (
                            <MenuItem key={qualificationPack.id.toString()} value={qualificationPack.id.toString()}>
                              {qualificationPack.qualification_pack_name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>No job roles found</MenuItem>
                        )}
                      </CustomTextField>
                    )}
                  />
                </Grid>
                {jobRolesLength.map((job, index) => {

                  const qp = qpData?.find(qp => qp.id.toString() === job);

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
                      <CustomTextField
                        select
                        fullWidth
                        label='State'
                        {...field}
                        {...(errors.state && { error: true, helperText: errors.state.message })}
                        onChange={e => {
                          handleStateChange(e.target.value)
                          field.onChange(e)
                        }}
                      >
                        <MenuItem value=''>Select State</MenuItem>
                        {stateData?.map((state, index) => (
                          <MenuItem key={index} value={state?.state_id?.toString()}>{state.state_name}</MenuItem>
                        ))}
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
                        {...field}
                        {...(errors.city && { error: true, helperText: errors.city.message })}
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

                {/* {Array.from(Array(countEducationCertificate).keys()).map((item, index) => (

                  <Grid key={index} item xs={12} sm={6} md={3}>
                    <Controller
                      control={control}
                      name={`certificate_${index}`}
                      render={({ field }) => (
                        <CustomTextField
                          fullWidth
                          required={true}
                          type='file'
                          label={`${Object.keys(qualificationCounts)[index]} Certificate`}
                          {...field}
                          {...(errors.educationalCertificates && { error: true, helperText: errors.educationalCertificates.message })}
                          // onChange={e => setFormData({ ...formData, educationalCertificates: [e.target.value] as string[]})}
                        />
                      )}
                    />
                  </Grid>
                ))} */}

                {selectedQualification === '8th' || selectedQualification === '10th' ||
                selectedQualification === '12th' || selectedQualification === 'Diploma' ||
                selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      required={true}
                      type='file'
                      label='8th Certificate'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      onChange={e => {handle8thCertificateChange(e);}}
                    />
                  </Grid>
                ) : null}

                {selectedQualification === '10th' ||
                selectedQualification === '12th' || selectedQualification === 'Diploma' ||
                selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      required={true}
                      type='file'
                      label='10th Certificate'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      onChange={e => {handle10thCertificateChange(e);}}
                    />
                  </Grid>
                ) : null}

                {selectedQualification === '12th' || selectedQualification === 'Diploma' ||
                selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      required={true}
                      type='file'
                      label='12th Certificate'
                      name='certificate_12th'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      onChange={e => {handle12thCertificateChange(e);}}
                    />
                  </Grid>
                ) : null}

                {selectedQualification === 'Diploma' || selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      required={true}
                      type='file'
                      label='Diploma Certificate'
                      name='certificate_DIPLOMA'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      onChange={e => {handleDiplomaCertificateChange(e);}}
                    />
                  </Grid>
                ) : null}

                {selectedQualification === 'UG' || selectedQualification === 'PG' ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      required={true}
                      type='file'
                      label='UG Certificate'
                      name='certificate_UG'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      onChange={e => {handleUGCertificateChange(e);}}
                    />
                  </Grid>
                ) : null}

                {selectedQualification === 'PG' ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      required={true}
                      type='file'
                      label='PG Certificate'
                      name='certificate_PG'
                      inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                      onChange={e => {handlePGCertificateChange(e);}}
                    />
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
                        required={true}
                        type='file'
                        label='Assessor Certificate'
                        inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                        {...field}
                        {...(errors.assessorCertificate && { error: true, helperText: errors.assessorCertificate.message })}
                        onChange={e => {handleAssessorCertificateChange(e); field.onChange(e)}}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    control={control}
                    name='agreementCopy'
                    rules={{ required: true }}
                    render={({ field }) => (
                      <CustomTextField
                        fullWidth
                        required={true}
                        type='file'
                        label='Agreement Copy'
                        inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                        {...field}
                        {...(errors.agreementCopy && { error: true, helperText: errors.agreementCopy.message })}
                        onChange={e => {handleAgreementCopyChange(e); field.onChange(e)}}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    control={control}
                    name='aadhaarCardImage'
                    render={({ field }) => (
                      <CustomTextField
                        fullWidth
                        type='file'
                        required={true}
                        label='Aadhaar Card'
                        inputProps={{ accept: 'image/png, image/jpeg, application/pdf' }}
                        {...field}
                        {...(errors.aadhaarCardImage && { error: true, helperText: errors.aadhaarCardImage.message })}
                        onChange={e => { handleAadhaarCardChange(e); field.onChange(e) }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    control={control}
                    name='resumeCV'
                    render={({ field }) => (
                      <CustomTextField
                        fullWidth
                        type='file'
                        required={true}
                        label='Resume/ CV'
                        inputProps={{ accept: 'application/pdf' }}
                        {...field}
                        {...(errors.resumeCV && { error: true, helperText: errors.resumeCV.message })}
                        onChange={e => { handleResumeCVChange(e); field.onChange(e) }}
                      />
                    )}
                  />
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
                </Grid>
              </Grid>
            </CardContent>
            <Divider />
            <CardActions>
              <Button type='submit' variant='contained' className='mie-2 gap-2' disabled={loading}>
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
        }
      </Card>
    )
  }else if(Number(params.role) === 2){
    return <TPForm stateData={stateData} />
  }else{
    return <SkeletonForm />
  }
}

export default UserCreate
