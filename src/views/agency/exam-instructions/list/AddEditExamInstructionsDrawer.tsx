// React Imports

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Component Imports
import { toast } from 'react-toastify'


import { Controller,  useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, minLength, string, trim, pipe } from "valibot"

import type { InferInput } from 'valibot'

import type { exam_instructions } from '@prisma/client'

import CustomTextField from '@core/components/mui/TextField'

import type { SSCType } from '@/types/sectorskills/sscType'

type Props = {
  instructionData? : exam_instructions | null
  open: boolean
  handleClose: () => void
  updateExamInstructionsList: () => void
  sscData: SSCType[]
}

// type FormDataType = {
//   sscName: string
//   sscCode: string
//   username: string
//   password: string
//   confirmPassword: string
//   status: string
// }

type FormDataType = InferInput<typeof schema>

// Vars
// const initialData = {
//   sscId: '',
//   instruction: '',
//   status: '1'
// }


const schema =object(
  {
    sscId: pipe(string(), trim() , minLength(1, 'This field is required')),
    instruction: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Instruction must be at least 3 characters long')),

    // sscCode: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'First Name must be at least 3 characters long')),
    // username: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(3, 'Last Name must be at least 3 characters long')),
    // password: pipe(string(), trim() , minLength(1, 'This field is required') , minLength(8, 'Password must be at least 8 characters long')),
    // confirmPassword: pipe(string(), trim() , minLength(1, 'This field is required')),

    status: pipe(string(), trim() , minLength(1, 'This field is required'))
  }
);


const AddEditExamInstructionsDrawer = ({ instructionData, open, handleClose, updateExamInstructionsList, sscData }: Props) => {

  // States
  // const [formData, setFormData] = useState<exam_instructions | null>(null)

  // const [isPasswordShown, setIsPasswordShown] = useState(false)
  // const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: valibotResolver(schema),
    values: {
      sscId: instructionData?.ssc_id.toString() || "",
      instruction: instructionData?.instruction || "",
      status: instructionData?.status.toString() || "1"
    }
  })

  const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {
    // e.preventDefault()

    if(instructionData && instructionData.id){
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-instructions/${instructionData.id}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {

        reset();

        toast.success('Instruction has been updated successfully!',{
          hideProgressBar: false
        });
        updateExamInstructionsList();

      } else {

        toast.error('Instruction not updated. Something went wrong!',{
          hideProgressBar: false
        });

      }
    }else{

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-instructions`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json' // Assuming you're sending JSON data

        },

        body: JSON.stringify(data)

      });


      if (res.ok) {

        reset();

        toast.success('New Instruction has been created successfully!',{
          hideProgressBar: false
        });
        updateExamInstructionsList();

      } else {

        toast.error('Instruction not created. Something went wrong!',{
          hideProgressBar: false
        });

      }
    }

    handleClose()
    reset()

    // setFormData(initialData)
  }

  const handleReset = () => {
    handleClose()
    reset()

    // setFormData(null);

    // setFormData({
    //   sscName: '',
    //   sscCode: '',
    //   username: '',
    //   password: '',
    //   confirmPassword: '',
    //   status: '1'
    // })
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
        <Typography variant='h5'>{instructionData && instructionData.id ? 'Edit' : 'Add New'} Exam Instruction</Typography>
        <IconButton onClick={handleReset}>
          <i className='tabler-x text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6 p-6'>
          <Controller
            name='sscId'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField select fullWidth label='Select SSC' {...field}
                {...(errors.sscId && { error: true, helperText: errors.sscId.message })}>
                  {sscData && sscData.length > 0 ? sscData.map((ssc, index) => (

                    <MenuItem key={index} value={ssc.id.toString()}>{ssc.ssc_name}</MenuItem>
                  )) : (
                    <MenuItem disabled>No data found</MenuItem>
                  )
                }
              </CustomTextField>
            )}
          />
          <Controller
            name='instruction'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                minRows={3}
                multiline
                {...field}
                fullWidth
                label='Exam Instruction'
                {...(errors.instruction && { error: true, helperText: errors.instruction.message })}
              />
            )}
          />
          <Controller
            name='status'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField select fullWidth id='select_status' label='Select Status' {...field}
                {...(errors.status && { error: true, helperText: errors.status.message })}>
                <MenuItem value='1'>Active</MenuItem>
                <MenuItem value='0'>Inactive</MenuItem>
              </CustomTextField>
            )}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit'>
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

export default AddEditExamInstructionsDrawer
