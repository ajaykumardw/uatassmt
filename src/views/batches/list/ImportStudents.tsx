import React, { useEffect, useMemo, useState } from 'react';
import { Button, Typography, Card, CardHeader, CardContent, Alert, Avatar, List, ListItem, IconButton, LinearProgress, TablePagination } from '@mui/material';
import tableStyles from '@core/styles/table.module.css';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { object, minLength, string, custom, toTrimmed, maxLength, optional, number, objectAsync, customAsync } from 'valibot'
import AppReactDropzone from '@/libs/styles/AppReactDropzone';
import TablePaginationComponent from '@/components/TablePaginationComponent';
import { ColumnDef, createColumnHelper, FilterFn, flexRender, getCoreRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

import classnames from 'classnames'

type StudentsTypeWithError = {
  BatchName: {value: number, error: string}
  EnrollmentNo: {value: number, error: string}
  NameOfTrainingAgency: {value: string, error: string}
  NameOfTheTrainee: {value: string, error: string}
  Gender: {value: string, error: string}
  Category: {value: string, error: string}
  DOB: {value: string, error: string}
  FatherName: {value: string, error: string}
  MotherName: {value: string, error: string}
  AddressOfTheTrainee: {value: string, error: string}
  State: {value: string, error: string}
  MobileNo: {value: number, error: string}
}

const studentSchema = objectAsync(
  {
    BatchName: number('Batch Name is required and type of number only'),
    // EnrollmentNo: string([
    //   toTrimmed(),
    //   minLength(1, 'Enrollment No. is required'),
    //   maxLength(191, 'The max length for Enrollment No is 191 characters.')
    // ]),
    EnrollmentNo: number('Enrollment No. is required and type of number only'),
    NameOfTrainingAgency: string([
      toTrimmed(),
      minLength(1, 'Name of Training Agency is required'),
      maxLength(191, 'The max length for this field is 191 characters.')
    ]),
    NameOfTheTrainee: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      maxLength(191, 'The max length for this field is 191 characters.')
    ]),
    Gender: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      custom(value => ['M', 'T'].includes(value), 'Gender must be M, F, or T')
    ]),
    Category: string([
      toTrimmed(),
      minLength(1, 'This field is required'),
      custom(value => ['Gen', 'SC', 'ST', 'BC', 'OBC'].includes(value), 'Category must be Gen, SC, ST, OC, or OBC')
    ]),
    DOB: string([
      toTrimmed(),
      minLength(1, 'DOB is required'),
    ]),
    FatherName: optional(string('Father\'s name type should be string', [
      toTrimmed(),
      maxLength(191, 'The max length for Father Name is 191 characters.')
    ])),
    MotherName: optional(string('Mother\'s name type should be string', [
      toTrimmed(),
      maxLength(191, 'The max length for Mother Name is 191 characters.')
    ])),
    AddressOfTheTrainee: optional(string([
      toTrimmed(),
      maxLength(191, 'The max length for Address is 191 characters.')
    ])),
    State: optional(string('State should be type of string', [
      toTrimmed(),
      maxLength(100, 'The max length for State is 100 characters.')
    ])),
    // MobileNo: string([
    //   toTrimmed(),
    //   minLength(1, 'Mobile No. is required'),
    //   regex(/^[0-9]+$/, 'Mobile No. must contain only numbers'),
    //   minLength(10, 'Mobile No. must be 10 digits'),
    //   maxLength(10, 'Mobile No. must be 10 digits')
    // ])
    MobileNo: number('Mobile No. is required and should be number only')
  }
)
// const studentSchema = object(
//   {
//     BatchName: number('Batch Name is required and type of number only'),
//     // EnrollmentNo: string([
//     //   toTrimmed(),
//     //   minLength(1, 'Enrollment No. is required'),
//     //   maxLength(191, 'The max length for Enrollment No is 191 characters.')
//     // ]),
//     EnrollmentNo: number('Enrollment No. is required and type of number only'),
//     NameOfTrainingAgency: string([
//       toTrimmed(),
//       minLength(1, 'Name of Training Agency is required'),
//       maxLength(191, 'The max length for this field is 191 characters.')
//     ]),
//     NameOfTheTrainee: string([
//       toTrimmed(),
//       minLength(1, 'This field is required'),
//       maxLength(191, 'The max length for this field is 191 characters.')
//     ]),
//     Gender: string([
//       toTrimmed(),
//       minLength(1, 'This field is required'),
//       custom(value => ['M', 'T'].includes(value), 'Gender must be M, F, or T')
//     ]),
//     Category: string([
//       toTrimmed(),
//       minLength(1, 'This field is required'),
//       custom(value => ['Gen', 'SC', 'ST', 'BC', 'OBC'].includes(value), 'Category must be Gen, SC, ST, OC, or OBC')
//     ]),
//     DOB: string([
//       toTrimmed(),
//       minLength(1, 'DOB is required'),
//     ]),
//     FatherName: optional(string('Father\'s name type should be string', [
//       toTrimmed(),
//       maxLength(191, 'The max length for Father Name is 191 characters.')
//     ])),
//     MotherName: optional(string('Mother\'s name type should be string', [
//       toTrimmed(),
//       maxLength(191, 'The max length for Mother Name is 191 characters.')
//     ])),
//     AddressOfTheTrainee: optional(string([
//       toTrimmed(),
//       maxLength(191, 'The max length for Address is 191 characters.')
//     ])),
//     State: optional(string('State should be type of string', [
//       toTrimmed(),
//       maxLength(100, 'The max length for State is 100 characters.')
//     ])),
//     // MobileNo: string([
//     //   toTrimmed(),
//     //   minLength(1, 'Mobile No. is required'),
//     //   regex(/^[0-9]+$/, 'Mobile No. must contain only numbers'),
//     //   minLength(10, 'Mobile No. must be 10 digits'),
//     //   maxLength(10, 'Mobile No. must be 10 digits')
//     // ])
//     MobileNo: number('Mobile No. is required and should be number only')
//   }
// )


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


// Map your keys to the schema
const mapKeys = (data: any[]) => data.map((item: any) => ({
  BatchName: item['Batch Name'],
  EnrollmentNo: item['Enrollment No'],
  NameOfTrainingAgency: item['Name of Training Agency'],
  NameOfTheTrainee: item['Name of the Trainee'],
  Gender: item['Gender(M/F/T)'],
  Category: item['Category(Gen/SC/ST/OBC)'],
  DOB: item['DOB'],
  FatherName: item['Father\'s name'],
  MotherName: item['Mother\'s name'],
  AddressOfTheTrainee: item['Address of the trainee'],
  City: item['City'],
  State: item['State'],
  MobileNo: item['Mobile No']
}));

const columnHelper = createColumnHelper<StudentsTypeWithError>()

const ImportStudents = ({ onBack }: { onBack: () => void }) => {

  const [data, setData] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [progress, setProgress] = useState<number>(0); // Progress state

  useEffect(() => {
    if (data.length > 0) {
      // console.log(data);
    }
  }, [data]);

  const { getRootProps, getInputProps } = useDropzone({
    // maxFiles: 1,
    multiple: false,
    maxSize: 2000000,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: (acceptedFiles: File[]) => {

      setFileInput(null);
      setLoading(true); // Start loading
      setProgress(0); // Reset progress

      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          try {
            const arrayBuffer = e.target.result as ArrayBuffer;
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const jsonDataWithHeader = XLSX.utils.sheet_to_json(worksheet, {header: 1});

            const headers = jsonDataWithHeader[0] as string[]; // Assuming first row is headers

            const expectedHeaders = ['Batch Name', 'Enrollment No', 'Name of Training Agency', 'Name of the Trainee', 'Gender(M/F/T)', 'Category(Gen/SC/ST/OBC)', 'DOB', "Father's name", "Mother's name", 'Address of the trainee', 'City', 'State', 'Mobile No']; // Replace with your expected headers

            // Validate headers
            const isValidHeaders = expectedHeaders.every((header, index) => headers[index] === header);

            if (!isValidHeaders) {
              toast.error('Invalid sheet headings. Please ensure the headers match the expected format.', {
                autoClose: 3000
              });
              setLoading(false); // End loading
              setProgress(0); // Reset progress
              setUploadData([]);
              setData([]);
              return;
            }

            const mappedData = mapKeys(jsonData);
            const validatedData = mappedData.map((item: any) => {
              const result = studentSchema._parse(item);
              // const resolver = valibotResolver(studentSchema, item);
              // console.log('resolver', resolver);
              // const result = parse(studentSchema, item);
              // console.log("result",result.issues);
              return {
                ...item,
                result
              };
            });

            // Transform data

            const filteredData = validatedData.filter(item => item.result.issues === undefined);

            const transformedTrainees = validatedData.map((trainee: any) => {
              const transformed: {[key: string]: { value: any; error: string | null; }} = {};

              for (const [key, value] of Object.entries(trainee)) {
                // Find if there is an issue for the current field
                const issue = trainee.result?.issues?.find((issue: any) => issue.path.some((p: any) => p.key === key));

                // If there is an issue, set the value and error, otherwise just the value
                transformed[key] = {
                  value: value,
                  error: issue ? issue.message : ''
                };
              }

              return transformed;
            });

            // Example usage
            setUploadData(filteredData);
            setData(transformedTrainees); // Update state with parsed data
            setProgress(100); // Set progress to 100%
            setLoading(false); // End loading
            setFileInput(acceptedFiles[0]);
          } catch (error) {
            console.error('Error processing the Excel file:', error);
            setLoading(false); // End loading
            setProgress(0); // Reset progress on error
            setUploadData([]);
            setData([]);
          }
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading the file:', error);
        setLoading(false); // End loading
        setProgress(0); // Reset progress on error
        setUploadData([]);
        setData([]);
      };

      reader.onprogress = (event) => {
        if (event.loaded && event.total) {
          const percentCompleted = Math.round((event.loaded / event.total) * 100);
          setProgress(percentCompleted); // Update progress
        }
      };

      if(acceptedFiles[0]){
        reader.readAsArrayBuffer(acceptedFiles[0]); // Read the file as an ArrayBuffer
      }
    },
    onDropRejected: (rejectedFiles) => {
      setLoading(false); // End loading
      setProgress(0); // Reset progress on error
      setUploadData([]);
      setData([]);
      const errorMessage = rejectedFiles.map(file => {
        console.log(file.errors);
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

  const handleRemoveFile = () => {
    // const uploadedFiles = files
    // const filtered = uploadedFiles.filter((i: FileProp) => i.name !== file.name)

    setData([]);
    setFileInput(null)
    setUploadData([]);
  }

  const columns = useMemo<ColumnDef<StudentsTypeWithError, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('BatchName.value', {
        header: 'Batch Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/* {getAvatar({ avatar: row.original.avatar ? `/uploads/agency/users/${row.original.id}/${row.original.avatar}` : '', first_name: (row.original.first_name || '') + ' ' + (row.original.last_name || '') })} */}
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.BatchName.value}
              </Typography>
              <Typography variant='body2' color="error">{row.original.BatchName.error}</Typography>
            </div>
          </div>
        )
      }),

      columnHelper.accessor('EnrollmentNo.value', {
        header: 'Enrollment No.',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' className='font-medium'>
              {row.original.EnrollmentNo.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.EnrollmentNo.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('NameOfTrainingAgency.value', {
        header: 'Name Of Training Agency',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' >
              {row.original.NameOfTrainingAgency.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.NameOfTrainingAgency.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('NameOfTheTrainee.value', {
        header: 'Name Of The Trainee',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.NameOfTheTrainee.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.NameOfTheTrainee.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('Gender.value', {
        header: 'Gender',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' >
              {row.original.Gender.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.Gender.error}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Category.value', {
        header: 'Category',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' className='font-medium'>
              {row.original.Category.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.Category.error}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('DOB.value', {
        header: 'DOB',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' className='font-medium'>
              {row.original.DOB.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.DOB.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('FatherName.value', {
        header: 'Father\'s Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.FatherName?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.FatherName.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('MotherName.value', {
        header: 'Mother\'s Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.MotherName?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.MotherName.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('AddressOfTheTrainee.value', {
        header: 'Address Of The Trainee',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.AddressOfTheTrainee?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.AddressOfTheTrainee.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('State.value', {
        header: 'State',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.State?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.State.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('MobileNo.value', {
        header: 'Mobile No.',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.MobileNo?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.MobileNo.error}</Typography>
          </div>
        )
      }),

      // columnHelper.accessor('action', {
      //   header: 'Action',
      //   cell: ({row}) => (
      //     <div className='flex items-center'>
      //       {/* <Link href={getLocalizedUrl(`batches/edit/${row.original.id}`, locale as Locale)} className='flex'> */}
      //         <IconButton>
      //           <i className='tabler-edit text-[22px] text-textSecondary' />
      //         </IconButton>
      //       {/* </Link> */}
      //       {/* <IconButton>
      //         <Link href={getLocalizedUrl('apps/user/view', locale as Locale)} className='flex'>
      //           <i className='tabler-eye text-[22px] text-textSecondary' />
      //         </Link>
      //       </IconButton>
      //       <OptionMenu
      //         iconClassName='text-[22px] text-textSecondary'
      //         options={[
      //           {
      //             text: 'Download',
      //             icon: 'tabler-download text-[22px]',
      //             menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
      //           },
      //           {
      //             text: 'Edit',
      //             icon: 'tabler-edit text-[22px]',
      //             menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
      //           }
      //         ]}
      //       /> */}
      //     </div>
      //   ),
      //   enableSorting: false
      // })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )


  const table = useReactTable({
    data: data as [],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    // onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    // onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })


  // const listItems = data.map((student, index) => (
  //   <ListItem key={index}>
  //     {/* <div className='file-details'> */}
  //       {/* <div className='file-preview'></div> */}
  //       <div className='is-full'>
  //         <div className="flex gap-2">
  //           <Typography>{student.BatchName}</Typography>
  //           <Typography>{student.EnrollmentNo}</Typography>
  //           <Typography>{student.NameOfTrainingAgency}</Typography>
  //           <Typography>{student.NameOfTheTrainee}</Typography>
  //           <Typography>{student.Gender}</Typography>
  //           <Typography>{student.Category}</Typography>
  //           <Typography>{student.DOB}</Typography>
  //           <Typography>{student.FatherName}</Typography>
  //           <Typography>{student.MotherName}</Typography>
  //           <Typography>{student.AddressOfTheTrainee}</Typography>
  //           <Typography>{student.City}</Typography>
  //           <Typography>{student.State}</Typography>
  //           <Typography>{student.MobileNo}</Typography>
  //         </div>
  //         <div>
  //           {student.result.issues.map((issue: any, index: number) => (
  //             <Typography key={index} color="error" variant='body2'>{issue.message}</Typography>
  //           ))}
  //         </div>
  //         {/* <Typography className='file-size' variant='body2'>
  //           {Math.round(file.size / 100) / 10 > 1000
  //             ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
  //             : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
  //         </Typography> */}
  //       </div>
  //     {/* </div> */}
  //     <IconButton onClick={() => handleRemoveFile()}>
  //       <i className='tabler-x text-xl' />
  //     </IconButton>
  //   </ListItem>
  // ))

  const tableItems = (
    <>
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
      <TablePagination
        component={() => <TablePaginationComponent table={table} />}
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => {
          table.setPageIndex(page)
        }}
      />
    </>
  )

  // const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return; // Handle case where no file is selected

  //   const reader = new FileReader();

  //   reader.onload = (e) => {
  //     if (e.target?.result) {
  //       try {
  //         const arrayBuffer = e.target.result as ArrayBuffer;
  //         const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

  //         const sheetName = workbook.SheetNames[0];
  //         const worksheet = workbook.Sheets[sheetName];
  //         const jsonData = XLSX.utils.sheet_to_json(worksheet);

  //         setData(jsonData); // Update state with parsed data
  //         setFileInput(file); // Update state with the file
  //         setLoading(false); // End loading
  //         setProgress(100); // Set progress to 100%
  //       } catch (error) {
  //         console.error('Error processing the Excel file:', error);
  //         setLoading(false); // End loading
  //         setProgress(0); // Reset progress on error
  //       }
  //     }
  //   };

  //   reader.onerror = (error) => {
  //     console.error('Error reading the file:', error);
  //   };

  //   reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
  // };


  const handleUploadData = async () => {
    console.log("upload data", uploadData);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json' // Assuming you're sending JSON data

      },

      body: JSON.stringify(uploadData)

    });


    if(res.ok){
      toast.success('Students uploaded successfully!', {
        hideProgressBar: false
      });
      onBack();
      // setLoading(false);
      // handleReset();

      // localStorage.setItem("formSubmitMessage", "New Batch Created Successfully!");

      // router.push(getLocalizedUrl("/batches/list", locale as Locale))

    } else {
      // setLoading(false);
      toast.error('Something went wrong!', {
        hideProgressBar: false
      });
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Import Students'
          action={
            <Button onClick={onBack} variant="outlined" color="primary" size='small'>
              Back
            </Button>
          }
          className='pbe-4'
        />
        <CardContent>
          <div className="flex gap-2 flex-col">
            <Alert severity='info'>
              Note: It will accept only Excel files with *.xls or *.xlsx extension only.
            </Alert>
            <Typography>Use the same format as given below :</Typography>
          </div>
        </CardContent>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Enrollment No.</th>
                <th>Name of Training Agency</th>
                <th>Name of the Trainee</th>
                <th>Gender(M/F/T)</th>
                <th>Category(Gen/SC/ST/OBC)</th>
                <th>DOB</th>
                <th>Father's name</th>
                <th>Mother's name</th>
                <th>Address of the trainee</th>
                <th>City</th>
                <th>State</th>
                <th>Mobile No.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
                <td className='text-center'></td>
              </tr>
            </tbody>
          </table>
        </div>
        <CardContent>
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
            {loading && (
              <div className='flex items-center gap-3'>
                <div className='is-full'>
                  <LinearProgress variant='determinate' value={progress} />
                </div>
                <Typography variant='body2' color='text.secondary' className='font-medium'>{`${progress}%`}</Typography>
              </div>
            )}
            {fileInput ? (
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
                </List>
                <div className='buttons'>
                  <Button color='error' variant='outlined' onClick={handleRemoveFile}>
                    Remove All
                  </Button>
                  <Button variant='contained' onClick={handleUploadData}>Upload Files</Button>
                </div>
              </>
            ) : null}
          </AppReactDropzone>
        </CardContent>
        {data.length > 0 ? tableItems : ''}
      </Card>

    </>

  );
};

export default ImportStudents;
