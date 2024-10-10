'use client'
import React, { useEffect, useMemo, useState } from 'react';

import { Button, Typography, Card, CardHeader, CardContent, Alert, Avatar, List, ListItem, IconButton, LinearProgress, TablePagination, AlertTitle } from '@mui/material';

import * as XLSX from 'xlsx';

import { useDropzone } from 'react-dropzone';

import { toast } from 'react-toastify';

import * as v from "valibot"

import { createColumnHelper, flexRender, getCoreRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';

import type { ColumnDef, FilterFn } from '@tanstack/react-table';

import { rankItem } from '@tanstack/match-sorter-utils';

import classnames from 'classnames'

import tableStyles from '@core/styles/table.module.css';

import AppReactDropzone from '@/libs/styles/AppReactDropzone';

import TablePaginationComponent from '@/components/TablePaginationComponent';

import { ExpectedStudentExcelHeaders } from '@/configs/customDataConfig';

type StudentsTypeWithError = {
  BatchName: {value: string, error: string}
  CandidateId: {value: string, error: string}
  Password: {value: string, error: string}

  // NameOfTrainingAgency: {value: string, error: string}

  CandidateName: {value: string, error: string}
  Gender: {value: string, error: string}
  Category: {value: string, error: string}
  DOB: {value: string, error: string}
  FatherName: {value: string, error: string}
  MotherName: {value: string, error: string}
  Address: {value: string, error: string}
  City: {value: string, error: string}
  State: {value: string, error: string}
  MobileNo: {value: number, error: string}
}

const checkUnique = async (input: any) => {

  const student = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-unique?candidateId=${input}`).then(function (response) { return response.json() });

  return student.isUnique;

}

const checkExistBatchId = async (input: any) => {

  const student = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-batch-id?batchId=${input}`).then(function (response) { return response.json() });

  return student.isBatchExist;

}

// const checkBatchSize = async (input: any) => {

//   // console.log('index', index);
//   const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-batch-id?batchId=${input}`).then(function (response) { return response.json() });

//   // console.log("batch not exceeds",result.batchSizeNotExceeds)

//   return result.batchSizeNotExceeds;
// }

const studentSchema = v.objectAsync(
  {
    BatchName: v.unionAsync([
      v.pipeAsync(
        v.number('Batch ID is required.'),
        v.minValue(1, 'This field is required'),
        v.checkAsync(checkExistBatchId, "Batch ID doesn't exist in our records."),

        // v.checkAsync(checkBatchSize, "Batch is full no more students allowed.")
      ),
      v.pipeAsync(
        v.string('Batch ID is required.'),
        v.trim(),
        v.minLength(1, 'This field is required.'),
        v.maxLength(191, 'The max length for this field is 191 characters.'),
        v.checkAsync(checkExistBatchId, "Batch ID doesn't exist in our records."),

        // v.checkAsync(checkBatchSize, "Batch is full no more students allowed.")
      )
    ], 'Batch ID is required.'),
    CandidateId: v.unionAsync([
      v.pipeAsync(
        v.number('Candidate ID is required.'),
        v.minValue(1, 'Candidate ID is required.'),
        v.checkAsync(checkUnique, 'Candidate ID should be unique.'),
        v.check(value => !/\s/.test(value.toString()), 'Candidate ID should not contain any spaces.')
      ),
      v.pipeAsync(
        v.string('Candidate ID is required.'),
        v.trim(),
        v.minLength(1, 'Candidate ID is required.'),
        v.maxLength(60, 'The max length for this field is 60 characters.'),
        v.checkAsync(checkUnique, 'Candidate ID should be unique.'),
        v.check(value => !/\s/.test(value.toString()), 'Candidate ID should not contain any spaces.')
      )
    ], 'Candidate ID is required.'),
    Password: v.union([
      v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, 'Password field is required.'),
        v.minLength(4, 'Your password is too short.'),
        v.maxLength(30, 'Your password is too long. Should be max 30 characters.'),
        v.check(value => !/\s/.test(value), 'Password should not contain any spaces.')
      ),
      v.pipe(
        v.number(),
        v.check(value => value.toString().length >= 4, 'This field is required and must be at least 4 characters.'),
        v.check(value => value.toString().length <= 191, 'Your password is too long. Should be max 30 characters.'),
        v.check(value => !/\s/.test(value.toString()), 'Password should not contain any spaces.')
      ),
    ]),
    CandidateName: v.pipe(v.string(), v.trim() , v.minLength(1, 'This field is required') , v.maxLength(191, 'The max length for this field is 191 characters.')),
    Gender: v.pipe(v.string(), v.trim() , v.minLength(1, 'This field is required') , v.check(value => ['M', 'F', 'T'].includes(value), 'Gender must be M, F, or T')),
    Category: v.pipe(v.string(), v.trim() , v.minLength(1, 'This field is required') , v.check(value => ['Gen', 'SC', 'ST', 'BC', 'OBC', 'OC'].includes(value), 'Category must be Gen, SC, ST, OC, or OBC')),
    DOB: v.pipe(v.string(), v.trim() , v.minLength(1, 'DOB is required') ,),
    FatherName: v.optional(v.pipe(v.string('Father\'s name type should be string'), v.trim() , v.maxLength(191, 'The max length for Father Name is 191 characters.'))),
    MotherName: v.optional(v.pipe(v.string('Mother\'s name type should be string'), v.trim() , v.maxLength(191, 'The max length for Mother Name is 191 characters.'))),
    Address: v.optional(v.pipe(v.string(), v.trim() , v.maxLength(191, 'The max length for Address is 191 characters.'))),
    City: v.optional(v.pipe(v.string('City should be type of string'), v.trim() , v.maxLength(100, 'The max length for City is 100 characters.'))),
    State: v.optional(v.pipe(v.string('State should be type of string'), v.trim() , v.maxLength(100, 'The max length for State is 100 characters.'))),
    MobileNo: v.pipe(
      v.number('Mobile No. is required and should be number only'),
      v.check(value => value.toString().length == 10, 'Mobile No. must be 10 digits.'),
    )
  }
)

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
  BatchName: item['Batch ID'],
  CandidateId: item['Candidate ID'],
  Password: item['Password'],

  // NameOfTrainingAgency: item['Name of Training Agency'],

  CandidateName: item['Candidate Name'],
  Gender: item['Gender(M/F/T)'],
  Category: item['Category(Gen/SC/ST/BC/OBC/OC)'],
  DOB: item['DOB'],
  FatherName: item['Father\'s name'],
  MotherName: item['Mother\'s name'],
  Address: item['Address'],
  City: item['City'],
  State: item['State'],
  MobileNo: item['Mobile No']
}));

const columnHelper = createColumnHelper<StudentsTypeWithError>()

const ImportStudents = ({ onBack }: { onBack: () => void }) => {

  const [data, setData] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [missingHeadersData, setMissingHeaders] = useState<any[]>([]);
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
      setMissingHeaders([]);
      setLoading(true); // Start loading
      setProgress(0); // Reset progress
      setData([]);

      const reader = new FileReader();

      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const arrayBuffer = e.target.result as ArrayBuffer;
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const jsonDataWithHeader = XLSX.utils.sheet_to_json(worksheet, {header: 1});

            const headers = jsonDataWithHeader[0] as string[]; // Assuming first row is headers

            // const expectedHeaders = ['Batch Name', 'Enrollment No', 'Name of Training Agency', 'Name of the Trainee', 'Gender(M/F/T)', 'Category(Gen/SC/ST/BC/OBC/OC)', 'DOB', "Father's name", "Mother's name", 'Address of the trainee', 'City', 'State', 'Mobile No']; // Replace with your expected headers
            const expectedHeaders = ExpectedStudentExcelHeaders; // Replace with your expected headers

            // Validate headers

            // // For Exact headers
            // const isValidHeaders = expectedHeaders.every((header, index) => headers[index] === header);

            // for Missing headers
            const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));


            if (missingHeaders.length !== 0) {

              setMissingHeaders(missingHeaders);

              toast.error(`Invalid sheet headings.`, {
                hideProgressBar: false
              });

              setLoading(false); // End loading

              setProgress(0); // Reset progress

              setUploadData([]);
              setData([]);

              return;
            }

            const mappedData = mapKeys(jsonData);

            const candidateIds = mappedData.map((item: any) => item.CandidateId);
            const duplicateIds = candidateIds.filter((id: any, index: number) => candidateIds.indexOf(id) !== index);
            const duplicates = new Set(duplicateIds);

            // const validatedData = await Promise.all(mappedData.map(async(item: any) => {

            //   const result = await v.safeParseAsync(studentSchema,item);

            //   const candidateIdError = duplicates.has(item.CandidateId) ? {
            //     path: [{key:'CandidateId'}],
            //     message: `Candidate ID ${item.CandidateId} is duplicated.`
            //   } : null;

            //   const {batchId} = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-batch-id?batchId=${item.BatchName.toString()}`).then(function (response) { return response.json() });

            //   const augmentedIssues = candidateIdError ? [...(result.issues || []), candidateIdError] : result.issues;



            //   return {
            //     batchId: batchId,
            //     ...item,
            //     result: {
            //       ...result,
            //       issues: augmentedIssues
            //     }
            //   };

            // }));

            // const validatedData = await Promise.all(mappedData.map(async (item: any) => {
            //   // Validate student data using your existing schema
            //   const result = await v.safeParseAsync(studentSchema, item);

            //   // Check for duplicate Candidate IDs
            //   const candidateIdError = duplicates.has(item.CandidateId) ? {
            //     path: [{ key: 'CandidateId' }],
            //     message: `Candidate ID ${item.CandidateId} is duplicated.`
            //   } : null;

            //   // Fetch the batch details including batch size
            //   const { batchId, batchSize } = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-batch-id?batchId=${item.BatchName.toString()}`)
            //     .then(response => response.json());

            //   // Count existing students in the batch
            //   const existingStudentsCount = 3

            //   // Check if adding the new student exceeds the batch size
            //   const exceedsBatchSize = existingStudentsCount + 1  > batchSize;
            //   const batchSizeError = exceedsBatchSize ? {
            //     path: [{ key: 'BatchName' }],
            //     message: `Cannot add student. Batch size of ${batchSize} exceeded.`
            //   } : null;

            //   // Augment issues with any new validation errors
            //   const augmentedIssues = [
            //     ...(result.issues || []),
            //     candidateIdError,
            //     batchSizeError
            //   ].filter(Boolean); // Remove null values

            //   return {
            //     batchId: batchId,
            //     ...item,
            //     result: {
            //       ...result,
            //       issues: augmentedIssues
            //     }
            //   };
            // }));

            // Fetch batch details for each batch and initialize counts
            // Define the structure of each batch's data
            // Define the structure of each batch's data
            // Define the structure of each batch's data
            interface BatchCount {
              batchID: number; // Unique identifier for the batch
              batchSize: number; // Maximum students allowed
              currentCount: number; // Current number of students in the batch
            }

            // Define the type for the batchCounts object
            const batchCounts: { [batchId: number]: BatchCount } = {};

            // Fetch existing student counts and initialize batchCounts
            await Promise.all(mappedData.map(async (item) => {
              const batchName = item.BatchName.toString();

              // Fetch batch details from the database
              const { batchId, batchSize, existingStudentsCount } = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-batch-id?batchId=${batchName}`)
                .then(response => response.json());

              // Check if batchId exists and has not been initialized yet
              if (batchId && !batchCounts[batchId]) {
                // Initialize the batch count in the map
                batchCounts[batchId] = {
                  batchID: batchId,
                  batchSize: batchSize,
                  currentCount: existingStudentsCount
                };
              }
            }));

            // Process students
            const validatedData = [];

            for (const [index, item] of mappedData.entries()) {
              const batchName = item.BatchName.toString();

              // Fetch batch details from the database
              const { batchId } = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-batch-id?batchId=${batchName}`)
                .then(response => response.json());

              // Only proceed if the batchId exists in batchCounts
              const batchDetail = batchId ? batchCounts[batchId] : null;

              if (!batchDetail) {
                validatedData.push({
                  ...item,
                  result: {
                    issues: [{
                      path: [{ key: 'BatchName' }],
                      message: `Batch ID ${batchName} does not exist. Student will not be processed.`
                    }]
                  }
                });
                continue; // Skip to the next iteration
              }

              console.log(`Processing [${index}]: current count of students upload`, batchDetail.currentCount);

              // Calculate remaining capacity
              const remainingCapacity = batchDetail.batchSize - batchDetail.currentCount;

              // Validate student data using your existing schema
              const result = await v.safeParseAsync(studentSchema, item);

              // Check for duplicate Candidate IDs
              const candidateIdError = duplicates.has(item.CandidateId) ? {
                path: [{ key: 'CandidateId' }],
                message: `Candidate ID ${item.CandidateId} is duplicated.`
              } : null;

              // Check if adding the new student exceeds the batch size
              const exceedsBatchSize = remainingCapacity <= 0;

              const batchSizeError = exceedsBatchSize ? {
                path: [{ key: 'BatchName' }],
                message: `Cannot add student. Batch size of ${batchDetail.batchSize} exceeded.`
              } : null;

              // Debugging: Log current counts and capacity
              console.log(`Processing Candidate ID [${index}]: ${item.CandidateId}`);
              console.log(`Current Count: ${batchDetail.currentCount}, Batch Size: ${batchDetail.batchSize}, Remaining Capacity: ${remainingCapacity}`);
              console.log(`Exceeds Batch Size: ${exceedsBatchSize}`);

              // If there's space, increment the current count for the batch
              if (!exceedsBatchSize) {
                batchCounts[batchId].currentCount += 1; // Increment the count since we're allowing this student
                console.log(`Student added [${index}]. New Current Count: ${batchCounts[batchId].currentCount}`);
              }

              // Augment issues with any new validation errors
              const augmentedIssues = [
                ...(result.issues || []),
                candidateIdError,
                batchSizeError
              ].filter(Boolean); // Remove null values

              validatedData.push({
                batchId: batchId,
                ...item,
                result: {
                  ...result,
                  issues: augmentedIssues.length === 0 ? undefined : augmentedIssues
                }
              });
            }







            // Transform data

            console.log("validated data", validatedData);


            const filteredData = validatedData.filter(item => item.result.issues === undefined);

            console.log("filtered data", filteredData);

            const transformedStudents = validatedData.map((trainee: any) => {
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
            setData(transformedStudents); // Update state with parsed data
            setProgress(100); // Set progress to 100%
            setLoading(false); // End loading
            setFileInput(acceptedFiles[0]);
          } catch (error) {
            console.error('Error processing the Excel file:', error);

            toast.error('Error in processing the Excel file.', {
              hideProgressBar: false
            });

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
        header: 'Batch ID',
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

      columnHelper.accessor('CandidateId.value', {
        header: 'Candidate ID',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' className='font-medium'>
              {row.original.CandidateId.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.CandidateId.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('Password.value', {
        header: 'Password',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' className='font-medium'>
              {row.original.Password.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.Password.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('CandidateName.value', {
        header: 'Candidate Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.CandidateName.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.CandidateName.error}</Typography>
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
      columnHelper.accessor('Address.value', {
        header: 'Address',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Address?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.Address.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('City.value', {
        header: 'City',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.City?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.City.error}</Typography>
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


  const handleUploadData = async () => {

    if(uploadData.length > 0) {

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
    } else {
      toast.error('No validated data available!', {
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
            {missingHeadersData.length > 0 &&
              <Alert severity='error'
              action={
                <IconButton size='small' color='inherit' aria-label='close' onClick={() => setMissingHeaders([])}>
                  <i className='tabler-x' />
                </IconButton>
              }
              >
                <AlertTitle>Missing Headers:</AlertTitle>
                 {missingHeadersData.join(', ')}
              </Alert>
            }
            <Typography>Use the same format as given below :</Typography>
          </div>
        </CardContent>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {ExpectedStudentExcelHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={ExpectedStudentExcelHeaders.length} className='text-center'></td>
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
                  <Button variant='contained' onClick={handleUploadData} disabled={uploadData.length === 0}>Upload Students</Button>
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
