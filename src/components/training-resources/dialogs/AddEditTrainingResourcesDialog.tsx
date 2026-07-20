'use client'

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ChangeEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Checkbox from '@mui/material/Checkbox'

// Third-party Imports
import classnames from 'classnames'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef
, type FilterFn } from '@tanstack/react-table'




import { CircularProgress, IconButton, InputAdornment } from '@mui/material'

import { styled } from '@mui/material/styles'

// Component Imports
import { toast } from 'react-toastify'


import { Controller, useForm } from 'react-hook-form'

import type { SubmitHandler } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, trim, minLength, maxLength, pipe, maxSize, instance, optional } from "valibot"

import type { InferInput } from 'valibot'

import type { role, user_training_resources, users } from '@prisma/client'

import { rankItem } from '@tanstack/match-sorter-utils'

// Util Imports
import { getInitials } from '@/utils/getInitials'

import { agencyUsersFilePath, TableRowLimit, userRoleObj } from '@/configs/customDataConfig'

import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

import tableStyles from '@core/styles/table.module.css'


import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import TableFilters from './TableFilters'

type AddQPDialogData = InferInput<typeof schema> & {
  users: number[]
}

type AddQPDialogProps = {
  open: boolean
  trainingResourceId?: number

  // setOpen: (open: boolean) => void

  handleClose: () => void
  data?: AddQPDialogData
  updateTrainingResourceList: () => void
}

type UsersTypeWithAction = users & {
  action?: string
  role: role
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const initialData: AddQPDialogData = {
  resourceName: '',

  // file: '',
  file: undefined,
  description: '',
  users: []
}

const schema = object(
  {
    resourceName: pipe(string(), trim(), minLength(1, 'This field is required'), maxLength(100, 'The maximum length for this field is 100 characters.')),
    file: optional(pipe(
      instance(File),
      maxSize(1024 * 1024 * 10, 'Please select a file smaller than 10 MB.')
    )),
    description: optional(pipe(string(), trim() , maxLength(255, 'The maximum length for a Description is 255 characters.')))
  }
)

const columnHelper = createColumnHelper<UsersTypeWithAction>()

const AddEditTrainingResourcesDialog = ({ open, trainingResourceId, handleClose, updateTrainingResourceList, data }: AddQPDialogProps) => {

  // States
  const [userData, setUserData] = useState<AddQPDialogProps['data']>(data || initialData)
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  const [allUsers, setAllUsers] = useState<users[]>([])

  const [filters, setFilters] = useState<{ role: number[] }>({
    role: []
  })

  const getTrainingResource = async (resourceId: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-resources/${resourceId}`)

    if(!res.ok) {
      throw new Error('Failed to fetch Training Resource')
    }

    const resourceData = await res.json();

    console.table(resourceData);

    // handleSSCChange(resourceData.ssc_id.toString());

    setFileName(resourceData.file || "");

    // ✅ 2. HANDLE USER SELECTION (FIXED)
    const userIds = resourceData.user_training_resources.map((resource: user_training_resources) => resource.user_id);

    console.log(userIds);  // Output: [6, 5, 4]

    // setSelectedCheckbox(userIds);

    const selection: Record<string, boolean> = {}

    userIds.forEach((id:number) => {
      selection[id.toString()] = true
    })

    setRowSelection(selection)

    if(resourceData.file){

      const fileUrl = `/uploads/agency/training-resources/${resourceData.id}/${resourceData.file}`;

      const fileRes = await fetch(fileUrl);

      if (!fileRes.ok) {
        throw new Error('Failed to fetch the file');
      }

      // Convert the file to a Blob
      const blob = await fileRes.blob();

      // Create a File object from the Blob (you can specify the filename here)
      const file = new File([blob], resourceData.file, { type: blob.type });

      console.log("file", file);
      setUserData({
        resourceName: resourceData.name,
        description: resourceData.description,
        file: file,
        users: []
      })
    }else{
      setUserData({
        resourceName: resourceData.name,
        description: resourceData.description,
        file: undefined,
        users: []
      })
    }



    // Now set the File object in the form state
    // setValue('file', file);

    // setValue('file', fileUrl);


  }

  useEffect(() => {
    setRowSelection({})
  }, [filters.role])

  useEffect(() => {

    setUserData(data);

    // if(trainingResourceId){
    //   getTrainingResource(trainingResourceId)
    // }
  }, [data]);

  useEffect(() => {

    if(open && trainingResourceId){
      getTrainingResource(trainingResourceId)
    }

  }, [open, trainingResourceId])

  // Hooks
  const {
    control,
    reset,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<AddQPDialogData>({
    resolver: valibotResolver(schema),
    values: userData
  })

  useEffect(() => {
    console.log("form errors:", errors)
  },[errors])

  // Handle File Upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target

    if (files && files.length !== 0) {
      setFileName(files[0].name)
      setValue('file', files[0])
      clearErrors(['file', 'description'])
    }
  }

  const handleFileClear = () => {
    setFileName('');
    setValue('file', undefined)

    // setError('file', {type: "custom", message: "This field is required" })
  }

  const getAllUsers = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);

    if (!res.ok) {
      throw new Error('Failed to fetch users')
    }

    const data = await res.json();

    setAllUsers(data);

  }

  useEffect(() => {

    if(open){

      getAllUsers()

    }
  }, [open])

  const columns = useMemo<ColumnDef<UsersTypeWithAction, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler()
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler()
          }}
        />
      )
    },
    columnHelper.accessor('first_name', {
        header: 'User',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>

            {getAvatar({ avatar: row.original.avatar ? agencyUsersFilePath(row.original.id, row.original.avatar) : '', first_name: (row.original.first_name || '') + ' ' + (row.original.last_name || '') })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.first_name + " " + row.original.last_name}
              </Typography>
              <Typography variant='body2'>{row.original.user_name}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('role_id', {
        header: 'Role',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Icon
              className={userRoleObj[row.original.role.id].icon}
              sx={{ color: `var(--mui-palette-${userRoleObj[row.original.role.id].color}-main)` }}
            />
            <Typography className='capitalize' color='text.primary'>
              {row.original.role.name}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('mobile_no', {
        header: 'Phone',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.mobile_no}
          </Typography>
        )
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.email}
          </Typography>
        )
      }),
  ], [])

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      if (
        filters.role.length > 0 &&
        (user.role_id === null || !filters.role.includes(user.role_id))
      ) {
        return false
      }

      return true
    })
  }, [allUsers, filters])

  const table = useReactTable({
    data: filteredUsers,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: TableRowLimit.pageSize
      }
    },
    enableRowSelection: true, //enable row selection for all rows

    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row

    globalFilterFn: fuzzyFilter,
    getRowId: row => row.id.toString(), // ✅ REQUIRED
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const onSubmit: SubmitHandler<AddQPDialogData> = async (data: AddQPDialogData) => {
    // e.preventDefault();

    // data.assessor = selectedCheckbox

    const selectedUserIds = table.getSelectedRowModel().rows.map(row => row.original.id)

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user for this Training Resource.', {
        hideProgressBar: false
      })

      return
    }

    data.users = selectedUserIds

    if(!data.file && !data.description){
      setError('file', {type: "custom", message: "Either a file or a description must be provided." })
      setError('description', {type: "custom", message: "Either a file or a description must be provided." })

      return
    }else{
      clearErrors(['file', 'description'])
    }

    setLoading(true)

    console.log("submitted data:", data);

    const formData = new FormData();

    // formData.append("sscId", data.sscId);

    formData.append("resourceName", data.resourceName || "");
    formData.append("description", data.description || "");
    formData.append("users", JSON.stringify(data.users || ""));
    formData.append("file", data.file || "")

    if (trainingResourceId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-resources/${trainingResourceId}`, {

        method: 'POST',
        body: formData

      });

      if (res.ok) {
        setLoading(false);
        reset();
        toast.success('Training Resource has been updated successfully!', {
          hideProgressBar: false
        });
        updateTrainingResourceList();
      } else {
        setLoading(false);
        toast.error('Training Resource not updated. Something went wrong here!', {
          hideProgressBar: false
        });
      }

    } else {


      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-resources`, {

        method: 'POST',
        body: formData

      });


      if (res.ok) {
        setLoading(false)
        reset();

        toast.success('New Training Resources has been created successfully!', {
          hideProgressBar: false
        });
        updateTrainingResourceList();

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
    setFileName('');
    setUserData(initialData);

    handleClose();
  }

  const getAvatar = (params: Pick<users, 'avatar' | 'first_name'>) => {
    const { avatar, first_name } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(first_name as string)}</CustomAvatar>
    }
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
        {trainingResourceId ? 'Edit ' : 'Add '}Training Resource
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <TableFilters setFilters={setFilters} />
            <Grid item xs={12} sm={6}>
              <Controller
                control={control}
                name='resourceName'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    required={true}
                    {...field}
                    {...(errors.resourceName && { error: true, helperText: errors.resourceName.message })}
                    label='Resource Name'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              {/* <Controller
                control={control}
                name='trainingResourceId'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    disabled={trainingResourceId ? true : false}
                    type='file'
                    {...field}
                    {...(errors.trainingResourceId && { error: true, helperText: errors.trainingResourceId.message })}
                    label='Select File'
                  />
                )}
              /> */}
              <div className={`flex ${errors.file ? 'items-center' : 'items-end'} gap-4`}>
                <Controller
                  control={control}
                  name='file'
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      placeholder='Choose File'
                      variant='outlined'
                      {...field}

                      // required={true}
                      value={fileName}
                      label='Select File'
                      {...(errors.file && { error: true, helperText: errors.file.message })}
                      InputProps={{
                        readOnly: true,
                        endAdornment: fileName ? (
                          <InputAdornment position='end'>
                            <IconButton size='small' edge='end' onClick={handleFileClear}>
                              <i className='tabler-x' />
                            </IconButton>
                          </InputAdornment>
                        ) : null
                      }}
                    />

                  )}
                />
                <Button component='label' variant='tonal' htmlFor='contained-button-file'>
                  Choose
                  <input hidden id='contained-button-file' type='file' accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} ref={fileInputRef} />
                </Button>
              </div>
            </Grid>
            <Grid item xs={12}>
              <Controller
                control={control}
                name='description'
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={5}

                    // required={true}
                    {...field}
                    {...(errors.description && { error: true, helperText: errors.description.message })}
                    label='Resource Description'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id}>
                            {header.isPlaceholder ? null : (
                              <>
                                <div
                                  className={classnames({
                                    'flex items-center': header.column.getIsSorted(),
                                    'cursor-pointer select-none': header.column.getCanSort()
                                  })}
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {{
                                    asc: <i className='tabler-chevron-up text-xl' />,
                                    desc: <i className='tabler-chevron-down text-xl' />
                                  }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                                </div>
                              </>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  {table.getFilteredRowModel().rows.length === 0 ? (
                    <tbody>
                      <tr>
                        <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                          No data available
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {table
                        .getRowModel()
                        .rows.slice(0, table.getState().pagination.pageSize)
                        .map(row => {
                          return (
                            <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                              {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                              ))}
                            </tr>
                          )
                        })}
                    </tbody>
                  )}
                </table>
              </div>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit' disabled={loading || table.getSelectedRowModel().rows.length === 0}>
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

export default AddEditTrainingResourcesDialog
