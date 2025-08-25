'use client'

// React Imports
import { useMemo, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Alert, AlertTitle, Avatar, CircularProgress, IconButton, LinearProgress, List, ListItem, TablePagination, Typography } from '@mui/material'

import * as XLSX from 'xlsx';

import { createColumnHelper, flexRender, getCoreRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';

import type { ColumnDef, FilterFn } from '@tanstack/react-table';

import { rankItem } from '@tanstack/match-sorter-utils';

import classnames from 'classnames'

// Component Imports
import { toast } from 'react-toastify'





import { string, trim, minLength, optional, check, pipe, pipeAsync, objectAsync, safeParseAsync, maxLength, optionalAsync, number, union } from "valibot"

import type { InferInput } from 'valibot'

import { useDropzone } from 'react-dropzone'

import tableStyles from '@core/styles/table.module.css';
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

// import CustomTextField from '@core/components/mui/TextField'

import AppReactDropzone from '@/libs/styles/AppReactDropzone'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import { ExpectedNOSExcelHeaders } from '@/configs/customDataConfig'


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

// type NOSTypeWithError = {
//   NOS_ID: { value: string, error: string }
//   NOS_Name: { value: string, error: string }
// }

type NOSTypeWithError = {
  [key: string]: { value: string, error: string }
}

// type NOSTypeWithError = {
//   [K in typeof ExpectedNOSExcelHeaders[number]]:
//     K extends 'NOS_ID' | 'NOS_Name' ? { value: string; error: string } : string;
// };

type AddQPDialogData = InferInput<typeof schema>

type BulkUploadNOSDialogProps = {
  open: boolean
  sscID?: number
  qpID?: number

  // setOpen: (open: boolean) => void

  handleClose: () => void

  // data?: AddQPDialogData
  updateNOSList: () => void
}

// const initialData: BulkUploadNOSDialogProps['data'] = {
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
// const initialData: AddQPDialogData = {
//   // selectPC: [],
//   pcId: 0,
//   // questionType: '',
//   questionLevel: '',
//   questionName: '',
//   questionExplanation: '',
//   questionMarks: '',
//   option1: '',
//   option2: '',
//   option3: '',
//   option4: '',
//   option5: '',
//   correctAnswer: '',

//   // isTheoryCutosff: false,
//   // isVivaCutoff: false,
//   // isPracticalCutoff: false,
//   // isOverallCutoff: false,
//   // isWeightedAvailable: false,
//   // theoryCutoffMarks: '',
//   // practicalCutoffMarks: '',
//   // vivaCutoffMarks: '',
//   // overallCutoffMarks: '',
//   // weightedMarks: ''
// }

// const questionType = [
//   {
//     value: 'theory',
//     name: 'Theory'
//   },
//   {
//     value: 'viva',
//     name: 'Viva'
//   },
//   {
//     value: 'practical',
//     name: 'Practical'
//   }
// ];

// const questionLevel = [
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
// ];

// const checkExistPCId = async (input: any, nos_id: any) => {


//   const pc = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pc/pc_id/${encodeURIComponent(input)}?unique=true`).then(function (response) { return response.json() });

//   return pc ? false : true;

// }

const checkExistPCId = async (pcId: string, nosId: string): Promise<boolean> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/pc/pc_id/${encodeURIComponent(pcId)}?nosId=${encodeURIComponent(nosId)}&unique=true`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    // Your API should return something like { exists: true } or false
    return result ? false : true; // true means available, false means taken
  } catch (error) {
    console.error('Error checking PC ID:', error);

    return true; // Fail open — don't block upload if check fails
  }
};

// const checkExistQPId = async (input: any) => {

//   const student = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/check-batch-id?sscId=${sscID}`).then(function (response) { return response.json() });

//   return student.isBatchExist;

// }

const schema = objectAsync(
  {
    // selectPC: array(string(), 'This field is required'),
    QP_ID: pipe(string('This field is required'), trim(), minLength(1, 'This field is required'),),
    NOS_ID: pipe(string('This field is required'), trim(), minLength(1, 'This field is required'), check(value => !/\s/.test(value.toString()), 'NOS ID should not contain any spaces.')),

    // questionType: pipe(string(), trim() , minLength(1, 'This field is required')),
    // Question_Level: pipe(string('This field is required'), trim(), minLength(1, 'This field is required')),
    NOS_Name: pipe(string('This field is required'), trim(), minLength(1, 'This field is required'), minLength(3, 'NOS name must be at least 3 characters long'), maxLength(255, 'The max length for this field is 255.')),
    PC_ID: optionalAsync(pipeAsync(string('This field should be string'), trim(), check(value => !value || !/\s/.test(value.toString()), 'PC ID should not contain any spaces.'))),
    PC_Name: optional(pipe(string('This field should be string'), trim(), maxLength(500, 'The max length for this field is 500.'))),
    Theory_Marks: union([
      number('This field is required'),
      pipe(string('This field is required'), trim(), minLength(1, 'This field is required'), maxLength(10, 'Theory_Marks must not exceed 10 characters'), check((value) => !value || /^\d+(\.\d+)?$/.test(value), 'Theory_Marks must be a valid number.')),
    ]),
    Practical_Marks: union([
      number('This field is required'),
      pipe(string('This field is required'), trim(), minLength(1, 'This field is required'), maxLength(10, 'Practical_Marks must not exceed 10 characters'), check((value) => !value || /^\d+(\.\d+)?$/.test(value), 'Practical_Marks must be a valid number.'),)
    ]),
    Viva_Marks: union([
      number('This field is required'),
      pipe(string('This field is required'), trim(), minLength(1, 'This field is required'), maxLength(10, 'Viva_Marks must not exceed 10 characters'), check((value) => !value || /^\d+(\.\d+)?$/.test(value), 'Viva_Marks must be a valid number.'),)
    ]),

    // Question_Explanation: pipe(string('This field is required'), trim(), minLength(1, 'This field is required'), minLength(3, 'Question name must be at least 3 characters long')),
    // Marks: pipe(string('This field is required'), trim(), minLength(1, 'This field is required'), check((value) => !value || /^(?:[1-9]|1\d|2[0-5])(\.\d+)?$/.test(value), 'Marks must be between 1 and 25.'),),
    // Option1: pipe(string('This field is required'), trim(), minLength(1, 'This field is required')),
    // Option2: pipe(string('This field is required'), trim(), minLength(1, 'This field is required')),
    // Status: optional(string(), 'optional field'),
    // Option4: optional(string(), 'optional field'),
    // Option5: optional(string(), 'optional field'),
    // Correct_Answer: pipe(
    //   string('This field is required'),
    //   trim(),
    //   regex(/^[0-5]+$/, 'Correct Answer must contain value from 1 to 5')
    // )
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

// const mapKeys = (data: any[]) => data.map((item: any) => ({
//   QP_ID: item['QP_ID'],
//   NOS_ID: item['NOS_ID'],
//   NOS_Name: item['NOS_Name'],
//   PC_ID: item['PC_ID'],
//   PC_Name: item['PC_Name'],
//   Theory_Marks: item['Theory_Marks'],
//   Practical_Marks: item['Practical_Marks'],
//   Viva_Marks: item['Viva_Marks']
// }));

const mapKeys = (data: any[]) => data.map((item: any) => ({
  QP_ID: item['QP Code'],
  NOS_ID: item['NOS Code'],
  NOS_Name: item['NOS Name'],
  PC_ID: item['Elements and Performance Criteria'],
  PC_Name: item['Assessment Criteria for Outcomes'],
  Theory_Marks: item['Theory Marks'],
  Practical_Marks: item['Practical Marks'],
  Viva_Marks: item['Viva Marks']
}));

const columnHelper = createColumnHelper<NOSTypeWithError>()

const BulkUploadNOSDialog = ({ open, sscID, handleClose, updateNOSList }: BulkUploadNOSDialogProps) => {

  // States
  // const [userData, setUserData] = useState<BulkUploadNOSDialogProps['data']>(data || initialData)
  const [loading, setLoading] = useState(false);
  const [missingHeadersData, setMissingHeaders] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(0); // Progress state
  const [data, setData] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [fileInput, setFileInput] = useState<File | null>(null);

  const handleReset = () => {

    setData([]);
    setFileInput(null)
    setUploadData([]);
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
      setMissingHeaders([]);
      setLoading(true); // Start loading
      setProgress(0); // Reset progress
      // setData([]);

      const reader = new FileReader();

      reader.onload = async (e) => {
        if (e.target?.result) {
          try {

            const arrayBuffer = e.target.result as ArrayBuffer;
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData: AddQPDialogData[] = XLSX.utils.sheet_to_json(worksheet);

            const jsonDataWithHeader = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = jsonDataWithHeader[0] as string[]; // Assuming first row is headers

            const expectedHeaders = ExpectedNOSExcelHeaders; // Replace with your expected headers

            // for Missing headers
            const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));

            if (missingHeaders.length !== 0) {
              setMissingHeaders(missingHeaders);
              toast.error(`Invalid sheet headings.`, {
                hideProgressBar: false
              });
              setLoading(false); // End loading
              // setProgress(0); // Reset progress
              // setUploadData([]);
              // setData([]);

              return;
            }

            const mappedData = mapKeys(jsonData);

            // Assuming `combinedKeys` is an array of strings
            const combinedKeys: string[] = mappedData.map((item: any) => `${item.NOS_ID}_${item.PC_ID}`);

            // Create a frequency map to count occurrences of each combined key (nos_id + pc_id)
            const frequencyMapNew: { [key: string]: number } = combinedKeys.reduce((acc, key) => {
              acc[key] = (acc[key] || 0) + 1; // Increment the count for each combined key

              return acc;
            }, {} as { [key: string]: number }); // Explicitly type the accumulator

            // Find the duplicates: Keys that appear more than once
            const duplicates: string[] = Object.entries(frequencyMapNew)
              .filter(([, count]) => count > 1)  // Find keys with more than 1 occurrence
              .map(([key]) => key);  // Get the list of duplicate keys

            const duplicateNosPC = new Set(duplicates);

            // console.log("duplicate pc id with nos_id:", duplicates, duplicateNosPC);

            // const pcIds = mappedData.map((item: any) => item.PC_ID);

            // const duplicatePCIds = pcIds.filter((id: any, index: number) => pcIds.indexOf(id) !== index);
            // Create a frequency map to count occurrences of each PC_ID
            // const frequencyMap = pcIds.reduce((acc, id) => {
            //   acc[id] = (acc[id] || 0) + 1; // Increment the count for each PC_ID

            //   return acc;
            // }, {});

            // Filter to get only the duplicates
            // const duplicatePCIds = Object.keys(frequencyMap).filter(id => frequencyMap[id] > 1);
            // const duplicatesPC = new Set(duplicatePCIds);

            // console.log("duplicate pc:", duplicatePCIds, duplicatesPC);

            // Process questions
            const validatedData = [];

            for (const [index, item] of mappedData.entries()) {

              console.log("index", index);

              // const pcIds = item.PC_ID.toString().split(',').map((id: string) => id.trim());
              // const duplicatePCIds = pcIds.filter((id: any, index: number) => pcIds.indexOf(id) !== index && pcIds.lastIndexOf(id) === index);

              // const options = [item.Option1, item.Option2, item.Option3, item.Option4, item.Option5];

              // const correctAnswer = (item?.Correct_Answer) - 1;


              // const answerErr = options[correctAnswer] === undefined;

              // const answerError = answerErr ? {
              //   path: [{ key: 'Correct_Answer' }],
              //   message: `Provided Answer not exist.`
              // } : null;

              // const nullOrUndefinedIndices = [];

              // for (let i = 0; i <= correctAnswer; i++) {
              //   if (options[i] == null) { // checks for both null and undefined
              //     nullOrUndefinedIndices.push(i);
              //   }
              // }

              // const Option1Error = nullOrUndefinedIndices.length != 0 && nullOrUndefinedIndices.find(value => value+1 === 1) ? {
              //   path: [{ key: `Option1` }],
              //   message: 'This field is required.'
              // } : null;
              // const Option2Error = nullOrUndefinedIndices.length != 0 && nullOrUndefinedIndices.find(value => value+1 === 2) ? {
              //   path: [{ key: `Option2` }],
              //   message: 'This field is required.'
              // } : null;
              // const Option3Error = nullOrUndefinedIndices.length != 0 && nullOrUndefinedIndices.find(value => value+1 === 3) ? {
              //   path: [{ key: `Option3` }],
              //   message: 'This field is required.'
              // } : null;
              // const Option4Error = nullOrUndefinedIndices.length != 0 && nullOrUndefinedIndices.find(value => value+1 === 4) ? {
              //   path: [{ key: `Option4` }],
              //   message: 'This field is required.'
              // } : null;
              // const Option5Error = nullOrUndefinedIndices.length != 0 && nullOrUndefinedIndices.find(value => value+1 === 5) ? {
              //   path: [{ key: `Option5` }],
              //   message: 'This field is required.'
              // } : null;

              // const nonExistingPcIds = await Promise.all(
              //   pcIds.map(async (pcId: string) => {
              //     // Fetch batch details from the database
              const qp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qualification-packs/qp_id/${encodeURIComponent(item.QP_ID)}?sscId=${sscID}`)
                .then(response => response.json());

              const qpIDError = !qp ? {
                path: [{ key: 'QP_ID' }],
                message: `QP ID doesn't exist in our records.`
              } : null;

              const pcIdProvided = item.PC_ID && item.PC_ID.length > 0;
              const pcNameProvided = item.PC_Name && item.PC_Name.length > 0;

              const pcIdAndPCNameProvidedORNot = (pcIdProvided && pcNameProvided) || (!pcIdProvided && !pcNameProvided)

              console.log("pcIdAndPCNameProvidedORNot", pcIdAndPCNameProvidedORNot)

              const pcIdPCNameError = !pcIdAndPCNameProvidedORNot ? {
                path: [{ key: 'PC_ID' }, { key: 'PC_Name' }],
                message: 'Both PC ID and PC Name must be provided together or not at all.'
              } : null;

              // Check for duplicate Candidate IDs
              // const pcIdError = duplicatesPC.has(item.PC_ID) ? {
              //   path: [{ key: 'PC_ID' }],
              //   message: `PC ID "${item.PC_ID}" is duplicated.`
              // } : null;

              const combinedKey = `${item.NOS_ID}_${item.PC_ID}`;

              // Check for duplicate Candidate IDs
              const pcIdError = duplicateNosPC.has(combinedKey) ? {
                path: [{ key: 'PC_ID' }],
                message: `PC ID "${item.PC_ID}" is duplicated with same NOS ID.`
              } : null;

              // Check if PC ID exists for this NOS ID
              const pcIDExistsForNOS = item.PC_ID && item.NOS_ID
                ? !(await checkExistPCId(item.PC_ID, item.NOS_ID))
                : false;

              const pcIdExistError = pcIDExistsForNOS ? {
                path: [{ key: 'PC_ID' }],
                message: `PC ID "${item.PC_ID}" already exists for NOS ID "${item.NOS_ID}".`
              } : null;

              const totalMarksError = (item.Theory_Marks + item.Practical_Marks + item.Viva_Marks ) == 0 ? {
                path: [{ key: 'Theory_Marks' }, { key: 'Practical_Marks' }, { key: 'Viva_Marks' }],
                message: 'Sum of the Theory_Marks, Practical_Marks and Viva_Marks must be greater then 0.'
              } : null;

              const nos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos/nos_id/${encodeURIComponent(item.NOS_ID)}`)
                .then(response => response.json());


              const nosIDExist = nos ? true : false;


              //     // Check if the PC ID exists
              //     if (!pc) {
              //       return pcId; // Return the non-existing PC ID
              //     }
              //     return null; // Return null if it exists
              //   })
              // );

              // // Filter out the null values to get the array of non-existing PC IDs
              // const pcResult = nonExistingPcIds.filter(pcId => pcId !== null);

              // const pcIdsError = pcResult.length !== 0 ? {
              //   path: [{ key: 'PC_ID' }],
              //   message: `PC ID "${pcResult.join(", ")}" does not exist.`
              // } : null;

              // const duplicatePCError = duplicatePCIds.length !== 0 ? {
              //   path: [{ key: 'PC_ID' }],
              //   message: `Duplicate PC ID "${duplicatePCIds.join(", ")}".`
              // } : null;

              // Validate student data using your existing schema
              const result = await safeParseAsync(schema, item);

              // Augment issues with any new validation errors
              const augmentedIssues = [
                ...(result.issues || []),
                qpIDError,
                pcIdPCNameError,
                pcIdError,
                pcIdExistError,
                totalMarksError

                // nosIDError
                // pcIdsError,
                // duplicatePCError,
                // Option1Error,
                // Option2Error,
                // Option3Error,
                // Option4Error,
                // Option5Error,
                // answerError,
                // candidateIdError,
                // batchSizeError
              ].filter(Boolean); // Remove null values

              validatedData.push({
                // batchId: batchId,
                ...item,
                nosIDExist,
                result: {
                  ...result,
                  issues: augmentedIssues.length === 0 ? undefined : augmentedIssues
                }
              });
            }

            console.log("validatedData", validatedData);

            // Transform data
            const filteredData = validatedData.filter(item => item.result.issues === undefined);

            const transformedStudents = validatedData.map((trainee: any) => {
              const transformed: { [key: string]: { value: any; error: string | null; } } = {};

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

          const percentCompleted = Math.round((event.loaded / event.total) * 100);

          setProgress(percentCompleted); // Update progress

        }
      };

      if (acceptedFiles[0]) {
        reader.readAsArrayBuffer(acceptedFiles[0]); // Read the file as an ArrayBuffer
      }
    },
    onDropRejected: (rejectedFiles) => {

      // setLoading(false); // End loading
      // setProgress(0); // Reset progress on error
      // setUploadData([]);
      // setData([]);

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

    }
  });

  const handleRemoveFile = () => {

    setData([]);
    setFileInput(null)
    setUploadData([]);

    // handleClose();
  }

  const columns = useMemo<ColumnDef<NOSTypeWithError, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('QP_ID.value', {
        header: 'QP_ID',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.QP_ID?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.QP_ID.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('NOS_ID.value', {
        header: 'NOS_ID',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.NOS_ID?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.NOS_ID.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('NOS_Name.value', {
        header: 'NOS_Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.NOS_Name.value}
              </Typography>
              <Typography variant='body2' color="error">{row.original.NOS_Name.error}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('PC_ID.value', {
        header: 'PC_ID',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.PC_ID?.value}
            </Typography>
            <Typography variant='body2' color="error">{row.original.PC_ID.error}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('PC_Name.value', {
        header: 'PC_Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.PC_Name.value}
              </Typography>
              <Typography variant='body2' color="error">{row.original.PC_Name.error}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('Theory_Name.value', {
        header: 'Theory_Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.Theory_Marks.value}
              </Typography>
              <Typography variant='body2' color="error">{row.original.Theory_Marks.error}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('Practical_Marks.value', {
        header: 'Practical_Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.Practical_Marks.value}
              </Typography>
              <Typography variant='body2' color="error">{row.original.Practical_Marks.error}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('Viva_Marks.value', {
        header: 'Viva_Marks',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.Viva_Marks.value}
              </Typography>
              <Typography variant='body2' color="error">{row.original.Viva_Marks.error}</Typography>
            </div>
          </div>
        )
      }),

      // columnHelper.accessor('Option1.value', {
      //   header: 'Option1',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' className='font-medium'>
      //         {row.original.Option1?.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Option1?.error}</Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('Option2.value', {
      //   header: 'Option2',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' className='font-medium'>
      //         {row.original.Option2?.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Option2?.error}</Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('Option3.value', {
      //   header: 'Option3',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' >
      //         {row.original.Option3?.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Option3?.error}</Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('Option4.value', {
      //   header: 'Option4',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' >
      //         {row.original.Option4?.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Option4?.error}</Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('Option5.value', {
      //   header: 'Option5',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' >
      //         {row.original.Option5?.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Option5?.error}</Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('Correct_Answer.value', {
      //   header: 'Correct_Answer',
      //   cell: ({ row }) => (
      //     <div className='flex flex-col'>
      //       <Typography color='text.primary' >
      //         {row.original.Correct_Answer.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Correct_Answer.error}</Typography>
      //     </div>
      //   )
      // }),

      // columnHelper.accessor('Question_Level', {
      //   header: 'Question_Level(E/M/H)',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' className='font-medium'>
      //         {row.original.Question_Level.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Question_Level.error}</Typography>
      //     </div>
      //   )
      // }),

      // columnHelper.accessor('Question_Explanation.value', {
      //   header: 'Question_Explanation',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' className='font-medium'>
      //         {row.original.Question_Explanation.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Question_Explanation.error}</Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('Status.value', {
      //   header: 'Status',
      //   cell: ({ row }) => (
      //     <div className="flex flex-col">
      //       <Typography color='text.primary' >
      //         {row.original.Status?.value}
      //       </Typography>
      //       <Typography variant='body2' color="error">{row.original.Status.error}</Typography>
      //     </div>
      //   )
      // }),
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
          <thead className='capitalize'>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className='first:w-52 even:w-52'>
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
  );

  const handleUploadData = async () => {

    if (uploadData.length > 0) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Assuming you're sending JSON data
        },
        body: JSON.stringify({ uploadData, sscID })
      });

      if (res.ok) {

        toast.success('NOS & PC uploaded successfully!', {
          hideProgressBar: false
        });

        updateNOSList();
        setLoading(false);
        handleReset();

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
        Import NOS
      </DialogTitle>
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <Grid container spacing={6}>
          <Grid item xs={12}>
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
              <Typography>Use the same format as given below : <Button className='ml-2' variant='contained' href="/uploads/sample/bulk_nos_pc_sample_file.xlsx" download>Download</Button></Typography>
            </div>
          </Grid>
          <Grid item xs={12}>
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead className='capitalize'>
                  <tr>
                    {ExpectedNOSExcelHeaders.map((header, index) => (
                      <th key={index} className='first:w-52 even:w-52'>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={ExpectedNOSExcelHeaders.length} className='text-center'></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Grid>
          <Grid item xs={12}>
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
                  </List>
                </>
              ) : null}
            </AppReactDropzone>
          </Grid>
          <Grid item xs={12}>
            {data.length > 0 ? tableItems : ''}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
        <Button variant='contained' type='submit' onClick={handleUploadData} disabled={uploadData.length === 0}>
          {loading && <CircularProgress size={20} color='inherit' />}
          Upload Question
        </Button>
        <Button variant='tonal' color='secondary' type='reset' onClick={handleReset}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BulkUploadNOSDialog
