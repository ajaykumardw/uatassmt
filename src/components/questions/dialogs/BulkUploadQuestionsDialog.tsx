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
import Switch from '@mui/material/Switch'
import { Avatar, CircularProgress, FormControlLabel, FormHelperText, IconButton, InputAdornment, Typography } from '@mui/material'

// Component Imports
import { toast } from 'react-toastify'


import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, trim, minLength, optional, check, array, number, pipe } from "valibot"

import type { InferInput } from 'valibot'

import { useDropzone } from 'react-dropzone'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDropzone from '@/libs/styles/AppReactDropzone'


// import type { PCType } from '@/types/pc/pcType'

// type AddQPDialogData = {
//   firstName?: string
//   lastName?: string
//   userName?: string
//   billingEmail?: string
//   status?: string
//   taxId?: string
//   contact?: string
//   language?: string[]
//   country?: string
//   useAsBillingAddress?: boolean
// }
// type AddQPDialogData = {
//   sscId?: string
//   qualificationPackId?: string
//   qualificationPackName?: string
//   level?: string
//   version?: string
//   totalTheoryMarks?: string
//   totalVivaMarks?: string
//   totalPracticalMarks?: string
//   totalMarks?: string
//   userName?: string
//   billingEmail?: string
//   status?: string
//   taxId?: string
//   contact?: string
//   language?: string[]
//   country?: string
//   useAsBillingAddress?: boolean
//   isTheoryCutosff?: boolean
//   isVivaCutoff?: boolean
//   isPracticalCutoff?: boolean
//   isOverallCutoff?: boolean
//   theoryCutoffMarks?: string
//   practicalCutoffMarks?: string
//   vivaCutoffMarks?: string
//   overallCutoffMarks?: string
// }

type AddQPDialogData = InferInput<typeof schema>

type AddQPDialogProps = {
  open: boolean
  nosId?: number
  pcID?: number

  // setOpen: (open: boolean) => void

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
  selectPC: [],
  pcId: 0,
  questionType: '',
  questionLevel: '',
  questionName: '',
  questionExplanation: '',
  questionMarks: '',
  option1: '',
  option2: '',
  option: ['','',''],
  correctAnswer: '',

  // isTheoryCutosff: false,
  // isVivaCutoff: false,
  // isPracticalCutoff: false,
  // isOverallCutoff: false,
  // isWeightedAvailable: false,
  // theoryCutoffMarks: '',
  // practicalCutoffMarks: '',
  // vivaCutoffMarks: '',
  // overallCutoffMarks: '',
  // weightedMarks: ''
}

const questionType = [
  {
    value: 'theory',
    name: 'Theory'
  },
  {
    value: 'viva',
    name: 'Viva'
  },
  {
    value: 'practical',
    name: 'Practical'
  }
];

const questionLevel = [
  {
    value: 'E',
    name: 'Easy'
  },
  {
    value: 'M',
    name: 'Medium'
  },
  {
    value: 'H',
    name: 'Hard'
  }
];

const schema = object(
  {
    selectPC: array(string(), 'This field is required'),
    pcId: optional(number()),
    questionType: pipe(string(), trim() , minLength(1, 'This field is required')),
    questionLevel: pipe(string(), trim() , minLength(1, 'This field is required')),
    questionName: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Question name must be at least 3 characters long')),
    questionExplanation: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Question name must be at least 3 characters long')),
    questionMarks: pipe(string(), trim() , minLength(1, 'This field is required') , check((value) => !value || /^(?:[1-9]|1\d|2[0-5])(\.\d+)?$/.test(value), 'Marks must be between 1 and 25.') ,),
    option1: pipe(string(), trim() , minLength(1, 'This field is required')),
    option2: pipe(string(), trim() , minLength(1, 'This field is required')),
    option: optional(array(string(),'optional field')),
    correctAnswer: pipe(string(), trim() , minLength(1, 'Please check any one option field for correct answer')),

    // options: Pipe(array(string(), minLength(2, 'At least two options are required')))

    // vivaCutoffMarks: optional(string([
    //   toTrimmed(),
    //   custom((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Viva cutoff marks must contain only numbers'),
    //   maxLength(10, 'Max length is 10 digits')
    // ])),
    // practicalCutoffMarks: optional(string([
    //   toTrimmed(),
    //   custom((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Practical cutoff marks must contain only numbers'),
    //   maxLength(10, 'Max length is 10 digits')
    // ])),
    // overallCutoffMarks: optional(string([
    //   toTrimmed(),
    //   custom((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Overall cutoff marks must contain only numbers'),
    //   maxLength(10, 'Max length is 10 digits')
    // ])),
    // weightedMarks: optional(string([
    //   toTrimmed(),
    //   custom((value) => !value || /^[0-9]+(?:\.[0-9]+)?$/.test(value), 'Weighted marks must contain only numbers'),
    //   maxLength(10, 'Max length is 10 digits')
    // ]))
  }
)

// const status = ['Status', 'Active', 'Inactive', 'Suspended']

// const languages = ['English', 'Spanish', 'French', 'German', 'Hindi']

// const countries = ['Select Country', 'France', 'Russia', 'China', 'UK', 'US']

// const qpLevel = [
//   {
//     value: 'E',
//     name: 'Easy'
//   },
//   {
//     value: 'M',
//     name: 'Medium'
//   },
//   {
//     value: 'H',
//     name: 'Hard'
//   }
// ]

const BulkUploadQuestionsDialog = ({ open, pcID, handleClose, updateQuestionsList, data }: AddQPDialogProps) => {

  // States
  const [userData, setUserData] = useState<AddQPDialogProps['data']>(data || initialData)
  const [loading, setLoading] = useState(false);

  // const [ssData, setSscUsers] = useState<SSCType[]>([])
  // const [qpData, setQPData] = useState<QPType[]>([])

  // const [nosData] = useState<NOSType[]>([])

  const [count, setCount] = useState(0)
  const [isCorrectAnswer, setCorrectAnswer] = useState<number>(0)

  // const [pcData] = useState<PCType[]>([])

  // const [isTheoryCutosff, setIsTheoryCutosff] = useState(false)
  // const [isVivaCutoff, setIsVivaCutoff] = useState(false)
  // const [isPracticalCutoff, setIsPracticalCutoff] = useState(false)
  // const [isOverallCutoff, setIsOverallCutoff] = useState(false)
  // const [isWeightedAvailable, setIsWeightedAvailable] = useState(false)


  // const getSSCData = async () => {
  //   // Vars
  //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

  //   if (!res.ok) {
  //     throw new Error('Failed to fetch sector skills council')
  //   }

  //   const userData = await res.json();

  //   setSscUsers(userData);

  // }


  useEffect(() => {

    setUserData(data);

    const filteredOptions = data?.option?.filter(opt => opt !== null) || [];

    setCount(filteredOptions.length);

    setCorrectAnswer(data && data.correctAnswer ? Number(data.correctAnswer) : 0)

  }, [data]);


  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    values: {
      selectPC: userData?.selectPC || [],
      questionType: userData?.questionType || '',
      questionLevel: userData?.questionLevel || '',
      questionName: userData?.questionName || '',
      questionExplanation: userData?.questionExplanation || '',
      questionMarks: userData?.questionMarks || '',
      option1: userData?.option1 || '',
      option2: userData?.option2 || '',
      option: [userData?.option?.[0] ?? '', userData?.option?.[1] ?? '', userData?.option?.[2] ?? ''],
      correctAnswer: userData?.correctAnswer || ''
    }
  })


  useEffect(() => {
    isCorrectAnswer !== 0 ? clearErrors('correctAnswer') : setError('correctAnswer',{type: 'custom', message: 'Please check any one option field for the correct answer'});
  }, [isCorrectAnswer, clearErrors, setError])

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();
    // data.isTheoryCutosff = isTheoryCutosff;
    // data.isVivaCutoff = isVivaCutoff;
    // data.isPracticalCutoff = isPracticalCutoff;
    // data.isOverallCutoff = isOverallCutoff;
    // data.isWeightedAvailable = isWeightedAvailable;

    data.pcId = pcID

    setLoading(true)

    // if (questionId) {

    //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}`, {

    //     method: 'POST',

    //     headers: {

    //       'Content-Type': 'application/json'

    //     },

    //     body: JSON.stringify(data)

    //   });

    //   if (res.ok) {
    //     setLoading(false);
    //     reset();
    //     toast.success('Question has been updated successfully!', {
    //       hideProgressBar: false
    //     });
    //     updateQuestionsList();
    //   } else {
    //     setLoading(false);
    //     toast.error('Question not updated. Something went wrong here!', {
    //       hideProgressBar: false
    //     });
    //   }

    // } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions`, {

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

    // }

    setLoading(false)
    handleReset();
    handleClose();
  }

  const handleReset = () => {
    reset();
    setUserData(userData || initialData);
    clearErrors('correctAnswer');
    setCount(data && data.option ? data.option.filter(opt => opt !== null).length : 0);
    setCorrectAnswer(data && data.correctAnswer ? Number(data.correctAnswer) : 0);

    // setIsTheoryCutosff(userData?.isTheoryCutosff || false);
    // setIsVivaCutoff(userData?.isVivaCutoff || false);
    // setIsPracticalCutoff(userData?.isPracticalCutoff || false);
    // setIsOverallCutoff(userData?.isOverallCutoff || false);
    // setIsWeightedAvailable(userData?.isWeightedAvailable || false);

    handleClose();
  }

  const { getRootProps, getInputProps } = useDropzone({
    // maxFiles: 1,
    multiple: false,
    maxSize: 2000000,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: (acceptedFiles: File[]) => {

      // setFileInput(null);
      // setMissingHeaders([]);
      // setLoading(true); // Start loading
      // setProgress(0); // Reset progress
      // setData([]);

      const reader = new FileReader();

      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            // const arrayBuffer = e.target.result as ArrayBuffer;
            // const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

            // const sheetName = workbook.SheetNames[0];
            // const worksheet = workbook.Sheets[sheetName];

            // const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // const jsonDataWithHeader = XLSX.utils.sheet_to_json(worksheet, {header: 1});

            // const headers = jsonDataWithHeader[0] as string[]; // Assuming first row is headers

            // const expectedHeaders = ['Batch Name', 'Enrollment No', 'Name of Training Agency', 'Name of the Trainee', 'Gender(M/F/T)', 'Category(Gen/SC/ST/BC/OBC/OC)', 'DOB', "Father's name", "Mother's name", 'Address of the trainee', 'City', 'State', 'Mobile No']; // Replace with your expected headers
            // const expectedHeaders = ExpectedStudentExcelHeaders; // Replace with your expected headers

            // Validate headers

            // // For Exact headers
            // const isValidHeaders = expectedHeaders.every((header, index) => headers[index] === header);

            // for Missing headers
            // const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));


            // if (missingHeaders.length !== 0) {
            //   // setMissingHeaders(missingHeaders);
            //   toast.error(`Invalid sheet headings.`, {
            //     hideProgressBar: false
            //   });
            //   // setLoading(false); // End loading
            //   // setProgress(0); // Reset progress
            //   // setUploadData([]);
            //   // setData([]);
            //   return;
            // }

            // const mappedData = mapKeys(jsonData);

            // console.log("mapped data", mappedData);

            // const validatedData = await Promise.all(mappedData.map(async(item: any) => {

            //   const result = await safeParse(schema,item);

            //   return {
            //     ...item,
            //     result
            //   };
            // }));

            // console.log("validated data", validatedData);

            // Transform data

            // const filteredData = validatedData.filter(item => item.result.issues === undefined);

            // const transformedTrainees = validatedData.map((trainee: any) => {
            //   const transformed: {[key: string]: { value: any; error: string | null; }} = {};

            //   for (const [key, value] of Object.entries(trainee)) {

            //     // Find if there is an issue for the current field
            //     const issue = trainee.result?.issues?.find((issue: any) => issue.path.some((p: any) => p.key === key));

            //     // If there is an issue, set the value and error, otherwise just the value
            //     transformed[key] = {
            //       value: value,
            //       error: issue ? issue.message : ''
            //     };
            //   }

            //   return transformed;
            // });

            // console.log("transformed data", transformedTrainees);

            // Example usage
            // setUploadData(filteredData);
            // setData(transformedTrainees); // Update state with parsed data
            // setProgress(100); // Set progress to 100%
            // setLoading(false); // End loading
            // setFileInput(acceptedFiles[0]);
          } catch (error) {
            console.error('Error processing the Excel file:', error);

            toast.error('Error in processing the Excel file.', {
              hideProgressBar: false
            });

            // setLoading(false); // End loading
            // setProgress(0); // Reset progress on error
            // setUploadData([]);
            // setData([]);
          }
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading the file:', error);

        // setLoading(false); // End loading
        // setProgress(0); // Reset progress on error
        // setUploadData([]);
        // setData([]);

      };

      reader.onprogress = (event) => {
        if (event.loaded && event.total) {

          // const percentCompleted = Math.round((event.loaded / event.total) * 100);
          // setProgress(percentCompleted); // Update progress

        }
      };

      if(acceptedFiles[0]){
        reader.readAsArrayBuffer(acceptedFiles[0]); // Read the file as an ArrayBuffer
      }
    },
    onDropRejected: (rejectedFiles) => {

      // setLoading(false); // End loading
      // setProgress(0); // Reset progress on error
      // setUploadData([]);
      // setData([]);

      const errorMessage = rejectedFiles.map(file => {

        // console.log(file.errors);

        if (file.errors.length > 0) {
          return file.errors.map(error => {
            switch (error.code) {
              case 'file-invalid-type':
                return `Invalid file type for ${file.file.name}.`;
              case 'file-too-large':
                return `File ${file.file.name} is too large.`;
              case 'too-many-files':
                return `Too many files selected.`;
              default:
                return `Error with file ${file.file.name}.`;
            }
          }).join(' ');
        }

        return `Error with file ${file.file.name}.`;
      });

      console.log(errorMessage);

      errorMessage.map(error => {
        toast.error(error, {
          hideProgressBar: false
        });
      })

      // toast.error('You can only upload 1 file & maximum size of 2 MB.', {
      //   autoClose: 3000
      // })
    }
  });

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleReset}
      maxWidth={false}
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleReset} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Import Questions
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <AppReactDropzone>
            <div {...getRootProps({ className: 'dropzone' })}>
            <input {...getInputProps()} />
            <div className='flex items-center flex-col'>
              <Avatar variant='rounded' className='bs-12 is-12 mbe-9'>
                <i className='tabler-upload' />
              </Avatar>
              <Typography variant='h4' className='mbe-2.5'>
                Drop files here or click to upload.
              </Typography>
              <Typography>Allowed *.xls, *.xlsx</Typography>
              <Typography>Max 1 file and max size of 2 MB</Typography>
            </div>
            </div>
            {/* {loading && (
              <div className='flex items-center gap-3'>
                <div className='is-full'>
                  <LinearProgress variant='determinate' value={progress} />
                </div>
                <Typography variant='body2' color='text.secondary' className='font-medium'>{`${progress}%`}</Typography>
              </div>
            )} */}
            {/* {fileInput ? (
              <>
                <List>
                  <ListItem>
                    <div className='file-details'>
                      <div className='file-preview'><i className='vscode-icons-file-type-excel w-6 h-6' /></div>
                      <div>
                        <Typography className='file-name'>{fileInput.name}</Typography>
                        <Typography className='file-size' variant='body2'>
                          {Math.round(fileInput.size / 100) / 10 > 1000
                            ? `${(Math.round(fileInput.size / 100) / 10000).toFixed(1)} mb`
                            : `${(Math.round(fileInput.size / 100) / 10).toFixed(1)} kb`}
                        </Typography>
                      </div>
                    </div>
                    <IconButton onClick={() => handleRemoveFile()}>
                      <i className='tabler-x text-xl' />
                    </IconButton>
                  </ListItem>
                  {/* {listItems} */}
                  {/* {tableItems} */}
                {/* </List>
                <div className='buttons'>
                  <Button color='error' variant='outlined' onClick={handleRemoveFile}>
                    Remove All
                  </Button>
                  <Button variant='contained' onClick={handleUploadData} disabled={uploadData.length === 0}>Upload Students</Button>
                </div>
              </>
            ) : null} */}
          </AppReactDropzone>
          <Grid container spacing={5}>
            {/* { questionId && <Grid item xs={12}>
              <Controller
                control={control}
                name='selectPC'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    select
                    label='PC'
                    required={true}
                    SelectProps={{
                      multiple: true,
                      renderValue: selected => (
                        <div className='flex flex-wrap gap-1'>
                          {(selected as unknown as string[]).map(value => {

                            const pc = allPC?.find(pc => pc.id.toString() === value);

                            return (
                              <Chip key={value} label={pc?.pc_id} size='small' />
                            );
                          })}
                        </div>
                      )
                    }}
                    {...field}
                    {...(errors.pcId && { error: true, helperText: errors.pcId.message })}
                  >
                    {allPC?.map((pc, index) => (
                      <MenuItem key={index} value={pc.id.toString()}>
                        {pc.pc_name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>} */}
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='questionType'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    select
                    label='Question Type'
                    required={true}
                    {...field}
                    {...(errors.questionType && { error: true, helperText: errors.questionType.message })}
                  >
                    {questionType.map((type, index) => (
                      <MenuItem key={index} value={type.value}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='questionLevel'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    select
                    label='Question Level'
                    required={true}
                    {...field}
                    {...(errors.questionLevel && { error: true, helperText: errors.questionLevel.message })}
                  >
                    {questionLevel.map((level, index) => (
                      <MenuItem key={index} value={level.value}>
                        {level.name}
                      </MenuItem>
                    ))}
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
                name='questionExplanation'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    multiline
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.questionExplanation && { error: true, helperText: errors.questionExplanation.message })}
                    label='Question Explanation'
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
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='option1'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.option1 && { error: true, helperText: errors.option1?.message })}

                    label={
                      <FormControlLabel
                        control={<Switch checked={isCorrectAnswer === 1} color='success' onChange={() => {

                          const newAnswer = isCorrectAnswer === 1 ? 0 : 1;

                          setCorrectAnswer(newAnswer);

                          setValue('correctAnswer', (newAnswer === 0 ? '' : newAnswer.toString()))

                        }} />}
                        label='Option 1'
                        labelPlacement='start'
                        className='mx-0'
                      />
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='option2'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    {...(errors.option2 && { error: true, helperText: errors.option2?.message })}
                    label={

                      <FormControlLabel
                        control={<Switch checked={isCorrectAnswer === 2} color='success' onChange={() => {

                          const newAnswer = isCorrectAnswer === 2 ? 0 : 2;

                          setCorrectAnswer(newAnswer);
                          setValue('correctAnswer', (newAnswer === 0 ? '' : newAnswer.toString()))

                        }} />}
                        label='Option 2'
                        labelPlacement='start'
                        className='mx-0'
                      />
                    }
                  />
                )}
              />
            </Grid>
            {Array.from(Array(count).keys()).map((item, index) => (
              <Grid key={index} item xs={12} sm={count % 2 === 1 && index === count - 1 ? 12 : 6}>
                <Controller
                  control={control}
                  name={`option.${index}`
                }
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      required={isCorrectAnswer === index + 3}
                      {...field}
                      {...(errors.option && Array.isArray(errors.option) && { error: true, helperText: errors.option[index]?.message })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => {setCount(count - 1); setValue('correctAnswer', ''); isCorrectAnswer === index + 3 && setCorrectAnswer(0)}}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                            >
                              <i className="tabler-x text-actionActive" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      label={
                        <FormControlLabel
                          control={<Switch checked={isCorrectAnswer === index + 3} color='success' onChange={() => {

                            const newAnswer = isCorrectAnswer === index + 3 ? 0 : index + 3;

                            setCorrectAnswer(newAnswer);
                            setValue('correctAnswer', (newAnswer === 0 ? '' : newAnswer.toString()))
                          }} />}
                          label={`Option ${index + 3}`}
                          labelPlacement='start'
                          className='mx-0'
                        />
                      }
                    />
                  )}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <FormHelperText
              error={true}
              >

              {errors.correctAnswer && errors.correctAnswer?.message }
              </FormHelperText>
            </Grid>
            {count < 3 && <Grid item xs={12}>
              <Button
                size='small'
                variant='contained'
                onClick={() => {
                  if (count < 5) {
                    setCount(count + 1);
                  }
                }}
                startIcon={<i className='tabler-plus' />}
              >
                Add Option
              </Button>
            </Grid>
            }
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

export default BulkUploadQuestionsDialog
