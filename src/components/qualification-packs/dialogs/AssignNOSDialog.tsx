'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

// Component Imports
// import DialogCloseButton from '../DialogCloseButton'
// import CustomTextField from '@core/components/mui/TextField'

// Style Imports

import { toast } from 'react-toastify'

import { CircularProgress } from '@mui/material'

import type { SubmitHandler } from 'react-hook-form'

import { Controller, useForm } from 'react-hook-form'

import type { NOSType } from '@/types/nos/nosType'

import type { QPType } from '@/types/qualification-pack/qpType'

import tableStyles from '@core/styles/table.module.css'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

type RoleDialogProps = {
  open: boolean
  title?: string
  qPack?: QPType
  data: NOSType[]
  assigned: number[]
  handleClose: () => void
  updateQPList: () => void
}

type addNosType = {
  nos: number[]
}


const AssignNOSDialog = ({ open, handleClose, qPack, data, assigned, updateQPList }: RoleDialogProps) => {
  // States
  const [selectedCheckbox, setSelectedCheckbox] = useState<number[]>(
    assigned
  )

  useEffect(() => {
    if (assigned.length > 0) {

      setSelectedCheckbox(assigned)
    } else {
      setSelectedCheckbox([])
    }
  }, [assigned])

  const [isIndeterminateCheckbox, setIsIndeterminateCheckbox] = useState<boolean>(false)
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    reset()
    handleClose();
  }

  const togglePermission = (id: number) => {
    const arr = selectedCheckbox

    if (selectedCheckbox.includes(id)) {
      arr.splice(arr.indexOf(id), 1)
      setSelectedCheckbox([...arr])
    } else {
      arr.push(id)
      setSelectedCheckbox([...arr])
    }
  }

  const handleSelectAllCheckbox = () => {
    if (isIndeterminateCheckbox) {
      setSelectedCheckbox([])
    } else {
      data?.forEach(nos => {
        const id = nos.id

        togglePermission(id)
      })
    }
  }

  useEffect(() => {

    if (selectedCheckbox.length > 0 && selectedCheckbox.length < data?.length) {

      setIsIndeterminateCheckbox(true)

    } else {

      setIsIndeterminateCheckbox(false)

    }
  }, [selectedCheckbox, data])

  const {
    control,
    reset,
    handleSubmit,
  } = useForm<addNosType>({
    // resolver: valibotResolver(schema),
  });

  // Handle form submit
  const onSubmit: SubmitHandler<addNosType> = async () => {

    // e.preventDefault();

    setLoading(true);

    const formData = {
      selectedNos: selectedCheckbox
    };


    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qualification-packs/${qPack?.id}`, {

      method: 'PATCH',

      headers: {

        'Content-Type': 'application/json'

      },

      body: JSON.stringify(formData)

    });


    if (res.ok) {

      reset();

      toast.success('NOS assigned successfully!', {
        hideProgressBar: false
      });

      updateQPList();

    } else {
      // setLoading(false)
      toast.error('Something went wrong!', {
        hideProgressBar: false
      });

      updateQPList();

    }

    updateQPList();

    handleReset();

    setLoading(false)
  };

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={handleReset}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleReset} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {'Add NOS'}
        <Typography component='span' className='flex flex-col text-center'>
          Set NOS to Qualification Pack
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible flex flex-col gap-6 pbs-0 sm:pli-16'>
          <Typography variant='h5' className='min-is-[225px]'>
            {qPack?.qualification_pack_id+" ("+qPack?.qualification_pack_name+")"}
          </Typography>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <tbody>
                <tr className='border-bs-0'>
                  <th className='pis-0'>
                    <Typography color='text.primary' className='font-medium whitespace-nowrap flex-grow'>
                      NOS ID
                    </Typography>
                  </th>
                  <th>
                    <Typography color='text.primary' className='font-medium whitespace-nowrap flex-grow min-is-[225px]'>
                      NOS Name
                    </Typography>
                  </th>
                  <th className='!text-end pie-0'>
                    <FormControlLabel
                      className='mie-0 capitalize'
                      control={
                        <Checkbox
                          onChange={handleSelectAllCheckbox}
                          indeterminate={isIndeterminateCheckbox}
                          checked={selectedCheckbox.length === data?.length}
                        />
                      }
                      label='Select All'
                    />
                  </th>
                </tr>
                {data?.map((nos, index) => {
                  // const id = (typeof item === 'string' ? item : item.title).toLowerCase().split(' ').join('-')

                  return (
                    <tr key={index} className='border-be'>
                      <td className='pis-0'>
                        <Typography
                          className='font-medium whitespace-nowrap flex-grow'
                          color='text.primary'
                        >
                          {nos.nos_id}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          className='font-medium whitespace-nowrap flex-grow min-is-[225px]'
                          color='text.primary'
                        >
                          {nos.nos_name}
                        </Typography>
                      </td>
                      <td className='!text-end pie-0'>
                        <FormGroup className='flex-row justify-end flex-nowrap gap-6'>
                          <Controller
                            control={control}
                            name={`nos.${nos.id}`}
                            defaultValue={21}
                            render={({ field }) => (

                              <FormControlLabel
                                {...field}
                                className='mie-0'
                                control={
                                  <Checkbox id={nos.id.toString()}
                                    name={`nos[${index}]`}
                                    onChange={() => togglePermission(nos.id)}
                                    checked={selectedCheckbox.includes(nos.id)} />
                                }
                                label=''
                              />
                            )}
                          />
                        </FormGroup>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit' disabled={selectedCheckbox.length === 0 || loading}>
            {loading && <CircularProgress size={20} color='inherit' />}
            Submit
          </Button>
          <Button variant='tonal' type='reset' color='secondary' onClick={handleReset}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AssignNOSDialog
