'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

// import { styled } from '@mui/material/styles'

import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import classnames from 'classnames'

import { rankItem } from '@tanstack/match-sorter-utils'

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
  getSortedRowModel
} from '@tanstack/react-table'

import type { ColumnDef, FilterFn } from '@tanstack/react-table'

// import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { batches, exam_sets, schemes, students, users } from '@prisma/client'

import { toast } from 'react-toastify'

import { format } from 'date-fns'

import { Chip, CircularProgress, LinearProgress, Tooltip } from '@mui/material'

import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports

import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import { formatDate } from '@/utils/formateDate'

import type { QPType } from '@/types/qualification-pack/qpType'

import ImportStudents from './ImportStudents'

import { MenuProps, TableRowLimit } from '@/configs/customDataConfig'

import type { UsersType } from '@/types/users/usersType'

import AssignAssessorDialog from '@/components/batches/dialogs/AssignAssessorDialog'

import CustomIconButton from '@/@core/components/mui/IconButton'
import OptionMenu from '@/@core/components/option-menu'
import BatchOptionMenu from './BatchOptionMenu'

// import DownloadEvidence from '@/components/zip/DownloadEvidence'

// import ZipAction from '@/components/zip/ZipAction'


// declare module '@tanstack/table-core' {
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo
//   }
// }

type BatchesTypeWithAction = batches & {
  action?: string
  qualification_pack: QPType
  training_partner: users
  training_center: users
  scheme: schemes
  sub_scheme: schemes
  students?: students[]
  total_students?: number
  assessor: UsersType
  theory_exam_set: exam_sets
  practical_exam_set: exam_sets
  viva_exam_set: exam_sets

  // role: role
}

type BatchesWithQP = batches & { qualification_pack: QPType }

// Styled Components
// const Icon = styled('i')({})

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

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Vars
// const userRoleObj: UserRoleType = {
//   admin: { icon: 'tabler-crown', color: 'error' },
//   author: { icon: 'tabler-device-desktop', color: 'warning' },
//   editor: { icon: 'tabler-edit', color: 'info' },
//   'Assessor': { icon: 'tabler-chart-pie', color: 'success' },
//   subscriber: { icon: 'tabler-user', color: 'primary' }
// }
// const userRoleObj: UserRoleType = {
//   1: { icon: 'tabler-school', color: 'info' },
//   2: { icon: 'tabler-heart-handshake', color: 'warning' },
// }

// const userStatusObj: UserStatusType = {
//   1: 'success',
//   0: 'warning',
// }


// const userShowStatusObj: UserShowStatusType = {

//   1: 'Active',

//   0: 'Inactive'

// }


// Column Definitions
const columnHelper = createColumnHelper<BatchesTypeWithAction>()

const BatchesListTable = ({ tableData, updateBatchList }: { tableData?: BatchesWithQP[], updateBatchList: () => void }) => {

  // States
  // const [addUserOpen, setAddUserOpen] = useState(false)

  const router = useRouter();

  const [rowSelection, setRowSelection] = useState({})
  const [showImportStudents, setShowImportStudents] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(...[tableData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [assignAssessorOpen, setAssignAssessorOpen] = useState(false);
  const [singleBatch, setSingleBatch] = useState<BatchesTypeWithAction | null>(null);
  const [assessorData, setAssessorsData] = useState<UsersType[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [loadingResultIds, setLoadingResultIds] = useState<number[]>([]);

  // download evidence
  // const [downloadEvidenceDialogOpen, setDownloadEvidenceDialogOpen] = useState(false);
  // const [batchId, setBatchId] = useState<number | null>(null);
  // const [jobStatus, setJobStatus] = useState<{ [key: number]: any }>({});

  // Hooks
  const { lang: locale } = useParams()

  useEffect(() => {

    // Check for a notification message from localStorage or other storage
    const message = localStorage.getItem('formSubmitMessage');

    if (message) {
      toast.success(message,{
        hideProgressBar: false
      });
      localStorage.removeItem('formSubmitMessage');
    }
  }, []);


  const handleViewStudentsClick = (row: BatchesTypeWithAction) => {
    localStorage.setItem("ssc_id", row.qualification_pack.ssc.id.toString());
    localStorage.setItem("qp_id", row.qualification_pack.id.toString());
    localStorage.setItem("batch_id", row.id.toString());

    router.push(getLocalizedUrl(`students`, locale as Locale))

  }

  const handleAssignAssessor = async (batch: any) => {

    setSingleBatch(batch);

    const allAssessors = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor`).then(function (response) { return response.json() });

    setAssessorsData(allAssessors);

    setAssignAssessorOpen(!assignAssessorOpen);

  }

  const handleRemoveAssessor = async (batchId: any) => {

    setLoadingId(batchId)

    try {

      if (batchId) {

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/remove-assessor`, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify(data)

        });

        if (res.ok) {
          // reset();
          updateBatchList();
          toast.success('Assessor has been removed successfully!', {
            hideProgressBar: false
          });
          setLoadingId(null);
        } else {
          toast.error('Assessor not removed. Something went wrong here!', {
            hideProgressBar: false
          });
          setLoadingId(null);
        }

      }else{
        toast.error('Batch ID not found!', {
          hideProgressBar: false
        });
        setLoadingId(null);
      }

    } catch (error) {
      toast.error('Something went wrong!', {
        hideProgressBar: false
      });
      setLoadingId(null);
    }

  }

  // const handleDownloadEvidence = (batchId: number) => {
  //   setBatchId(batchId);
  //   setDownloadEvidenceDialogOpen(true);
  // }

  const handleUpdateResult = async (batchId: number) => {

    setLoadingResultIds(prev => [...prev, batchId]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/complete`, {
        method: 'POST',
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || 'Batch Completed.', {
          hideProgressBar: false
        });
      } else {
        toast.error(result.message || 'Failed to complete batch.', {
          hideProgressBar: false
        });
      }

    } catch (error) {
      console.error(error);
      toast.error('Something went wrong!', {
        hideProgressBar: false
      });
    } finally {
      setLoadingResultIds(prev => prev.filter(id => id !== batchId));
    }

  }

  const generateOMRHTML = async (
    batchId: number,
    questions: number,
    options: string[]
  ) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/omr/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions,
          options,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate OMR sheet");
      }

      const result = await res.json();

      toast.success(

        "OMR Sheet generated successfully.",

        {
          hideProgressBar: false
        }
      );

    } catch (error) {
      console.error("OMR generation error:", error);

      return null;
    }
  };

  // const handleGeneratePaper = async (batchId: number) => {
  //   try {
  //     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/omr/paper`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     const result = await res.json();

  //     if (res.ok) {
  //       toast.success(result.message || 'Question paper generated successfully.', {
  //         hideProgressBar: false
  //       });
  //     } else {
  //       toast.error(result.message || 'Failed to generate question paper.', {
  //         hideProgressBar: false
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Question paper generation error:", error);
  //     toast.error('Something went wrong while generating question paper!', {
  //       hideProgressBar: false
  //     });
  //   }
  // };

  const handleGeneratePaper = async (
    batchId: number
  ) => {

    try {


      const res = await fetch(

        `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/omr/paper`,

        {
          method: "POST",
        }
      );

      const result = await res.json();

      if (!res.ok) {

        toast.error(

          result.message ||

          "Failed to generate paper.",

          {
            hideProgressBar: false
          }
        );

        return;
      }

      toast.success(

        result.message || "Question paper generation started.",

        {
          hideProgressBar: false
        }
      );

    } catch (error) {

      console.error(error);


      toast.error(

        "Something went wrong while generating question paper!",

        {
          hideProgressBar: false
        }
      );
    }
  };

  const columns = useMemo<ColumnDef<BatchesTypeWithAction, any>[]>(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.index + 1}</Typography>
      },
      columnHelper.accessor('qualification_pack.ssc.ssc_code', {
        header: () => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                SSC Code
              </Typography>
              <Typography variant='body2'>QP ID</Typography>
            </div>
          </div>
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/* {getAvatar({ avatar: row.original.avatar ? `/uploads/agency/users/${row.original.id}/${row.original.avatar}` : '', first_name: (row.original.first_name || '') + ' ' + (row.original.last_name || '') })} */}
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.qualification_pack.ssc.ssc_code}
              </Typography>
              <Typography variant='body2'>{row.original.qualification_pack.qualification_pack_id}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('batch_name', {
        header: 'Batch Name',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.batch_name}
          </Typography>
        )
      }),
      columnHelper.accessor('batch_size', {
        header: 'Batch Size',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.batch_size}
          </Typography>
        )
      }),
      columnHelper.accessor('students', {
        header: 'Students',
        cell: ({ row }) => {
          if(row.original.total_students && row.original.total_students > 0){
            return (
              <div className='flex items-center gap-1.5'>
                {row.original.total_students && row.original.total_students === Number(row.original.batch_size) ? (
                  null
                ) : (
                  <Tooltip title='Add Students'>
                    <CustomIconButton
                      variant='tonal'
                      size='small'
                      color='success'
                      onClick={() => {setSelectedBatch(row.original.id); setShowImportStudents(true)}}
                      className='is-full sm:is-auto'
                    >
                      <i className='tabler-user-plus' />
                    </CustomIconButton>
                  </Tooltip>
                )}
                <Button
                  variant='tonal'
                  size='small'
                  startIcon={row.original.total_students}

                  // onClick={() => {
                  //   localStorage.setItem("ssc_id", '1');
                  //   localStorage.setItem("qp_id", '1');
                  //   localStorage.setItem("batch_id", '1');
                  // }}

                  onClick={() => handleViewStudentsClick(row.original)}
                  className='is-full sm:is-auto'
                >
                  View
                </Button>
                <Button
                  variant='tonal'
                  size='small'
                  startIcon={<i className='tabler-file-text' />}
                  onClick={() => handleGeneratePaper(row.original.id)}
                  className='is-full sm:is-auto'
                >
                  Paper
                </Button>
                <Button
                  color='success'
                  variant='tonal'
                  size='small'
                  startIcon={<i className='tabler-upload' />}
                  className='is-full sm:is-auto'
                  onClick={() => generateOMRHTML(row.original.id, 100,["A", "B", "C", "D"])}
                  disabled={row.original.question_paper === null}
                >
                  Generate OMR
                </Button>
              </div>
            );
          }
        }
      }),
      columnHelper.accessor('training_partner_id', {
        header: 'Training Partner',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.training_partner.company_name}
          </Typography>
        )
      }),
      columnHelper.accessor('training_centre_id', {
        header: 'Center ID',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.training_center.user_name}
          </Typography>
        )
      }),
      columnHelper.accessor('assessor.first_name', {
        header: 'Assessor',
        cell: ({ row }) => (
          <>
            <Typography color='text.primary' >
              {row.original.assessor?.first_name} {row.original.assessor?.last_name}
            </Typography>
            {row.original.assessor && row.original.assessor.id ? (
              <Tooltip title='Remove Assessor'>
                <CustomIconButton
                  variant='tonal'
                  size='small'
                  color='error'
                  onClick={() => handleRemoveAssessor(row.original.id)}
                  className='is-full sm:is-auto'
                  disabled={loadingId === row.original.id}
                >
                  {loadingId === row.original.id ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-trash' />}
                </CustomIconButton>
              </Tooltip>
            ) :
            (
              <Button
                variant='tonal'
                size='small'
                startIcon={<i className='tabler-plus' />}
                onClick={() => handleAssignAssessor(row.original)}
                className='is-full sm:is-auto'
              >
                Assign
              </Button>
            )}

          </>
        )
      }),
      columnHelper.accessor('theory_exam_set.set_name', {
        header: 'Theory Exam Set',
        cell: ({ row }) => (
          <>
            <Typography color='text.primary' >
              {row.original.theory_exam_set?.set_name}
            </Typography>
            {/* {row.original.theory_exam_set && row.original.theory_exam_set.id ? (
              <Tooltip title='Remove Exam Set'>
                <CustomIconButton
                  variant='tonal'
                  size='small'
                  color='error'
                  onClick={() => handleRemoveAssessor(row.original.id)}
                  className='is-full sm:is-auto'
                  disabled={loadingId === row.original.id}
                >
                  {loadingId === row.original.id ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-trash' />}
                </CustomIconButton>
              </Tooltip>
            ) :
            (
              <Button
                variant='tonal'
                size='small'
                startIcon={<i className='tabler-plus' />}
                onClick={() => handleAssignAssessor(row.original)}
                className='is-full sm:is-auto'
              >
                Assign
              </Button>
            )} */}

          </>
        )
      }),
      columnHelper.accessor('practical_exam_set.set_name', {
        header: 'Practical Exam Set',
        cell: ({ row }) => (
          <>
            <Typography color='text.primary' >
              {row.original.practical_exam_set?.set_name}
            </Typography>
          </>
        )
      }),
      columnHelper.accessor('viva_exam_set.set_name', {
        header: 'Viva Exam Set',
        cell: ({ row }) => (
          <>
            <Typography color='text.primary' >
              {row.original.viva_exam_set?.set_name}
            </Typography>
          </>
        )
      }),

      columnHelper.accessor('assessment_start_datetime', {
        header: 'Start Date Time',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {/* {row.original.assessment_start_datetime && formatDate(row.original.assessment_start_datetime)} */}
            {row.original.assessment_start_datetime && format(row.original.assessment_start_datetime, 'd-MMM-y K:mm a')}
          </Typography>
        )
      }),

      columnHelper.accessor('assessment_end_datetime', {
        header: 'End Date Time',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.assessment_end_datetime && formatDate(row.original.assessment_end_datetime)}
          </Typography>
        )
      }),
      columnHelper.accessor('scheme', {
        header: 'Scheme',
        cell: ({ row }) => (
          <Typography color='text.primary' >
            {row.original.scheme.scheme_name}
          </Typography>
        )
      }),
      columnHelper.accessor('batch_completed', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip label={ row.original.batch_completed === 1 ? 'Completed' : 'Pending'} color={ row.original.batch_completed === 1 ? 'success' : 'warning'} variant='tonal' />
        ),
        enableSorting: false
      }),

      // columnHelper.accessor('email', {
      //   header: 'Email',
      //   cell: ({ row }) => (
      //     <Typography color='text.primary' className='font-medium'>
      //       {row.original.email}
      //     </Typography>
      //   )
      // }),
      // columnHelper.accessor('status', {
      //   header: 'Status',
      //   cell: ({ row }) => (
      //     <div className='flex items-center gap-3'>
      //       <Chip
      //         variant='tonal'
      //         className='capitalize'
      //         label={userShowStatusObj[row.original.status]}
      //         color={userStatusObj[row.original.status]}
      //         size='small'
      //       />
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('created_at', {
      //   header: 'Created On',
      //   cell: ({ row }) => (
      //     <Typography color='text.primary' className='font-medium'>
      //       {formatDate(row.original.created_at)}
      //     </Typography>
      //   )
      // }),

      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({row}) => {
          const isLoading = loadingResultIds.includes(row.original.id);
          const showUpdateButton = row.original.assessment_start_datetime && row.original.assessment_end_datetime && new Date() > new Date(row.original.assessment_end_datetime) && !row.original.batch_completed;

          return (
            <div className='flex items-center'>
              {showUpdateButton && (
                <Tooltip title='Complete Batch'>
                  <CustomIconButton
                    variant='outlined'
                    size='small'
                    color='success'
                    onClick={() => handleUpdateResult(row.original.id)}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} color='inherit' /> : null}
                  >
                    <i className="tabler-check" />
                  </CustomIconButton>
                </Tooltip>
              )}
              <Link href={getLocalizedUrl(`batches/edit/${row.original.id}`, locale as Locale)} className='flex'>
                <IconButton>
                  <i className='tabler-edit text-[22px] text-textSecondary' />
                </IconButton>
              </Link>
              {/* <ZipAction batchId={row.original.id} /> */}
              {/* <Button onClick={() => handleDownloadEvidence(row.original.id)} disabled={jobStatus[row.original.id]?.status === 'pending' || jobStatus[row.original.id]?.status === 'processing'}>
                Generate Zip
              </Button>
              { jobStatus[row.original.id]?.status === 'pending' ?
                'Pending'
                :
                jobStatus[row.original.id]?.status === 'processing' ?
                `Processing ${jobStatus[row.original.id]?.progress || 0}%`
                :
                jobStatus[row.original.id]?.status === 'completed' ?
                `Download Zip`
                : ''
              } */}
              {/* <Button onClick={() => handleDownloadEvidence(row.original.id)}>
                Generate Zip
              </Button> */}
              {/* <IconButton onClick={() => handleDownloadEvidence(row.original.id)}>
                <i className='tabler-download text-[22px] text-textSecondary' />
              </IconButton> */}
              {/* <IconButton>
                <Link href={getLocalizedUrl('apps/user/view', locale as Locale)} className='flex'>
                  <i className='tabler-eye text-[22px] text-textSecondary' />
                </Link>
              </IconButton> */}
              <BatchOptionMenu row={row} />
              {/* <OptionMenu
                iconClassName='text-[22px] text-textSecondary'
                options={[
                  {
                    text: row.original.question_paper ? "Regenerate Paper" : "Generate Paper",
                    icon: 'tabler-file-text text-[22px]',
                    menuItemProps: { className: "flex items-center gap-2 text-textSecondary", onClick:() => handleGeneratePaper(row.original.id) }
                  },
                  ...(row.original.question_paper ? [
                    {
                      text: 'View Paper',
                      icon: 'tabler-eye text-[22px]',
                      menuItemProps: {
                        className: 'flex items-center gap-2 text-textSecondary',

                        onClick: () => {
                          window.open(
                            `${process.env.NEXT_PUBLIC_APP_URL}/${row.original.question_paper}`,
                            "_blank"
                          );
                        }
                      }
                    }
                  ] : []),
                  {
                    text: row.original.omr_sheet ? "Regenerate OMR Sheet" : "Generate OMR Sheet",
                    icon: 'tabler-file-text text-[22px]',
                    menuItemProps: { disabled: !row.original.question_paper, className: "flex items-center gap-2 text-textSecondary", onClick:() => generateOMRHTML(row.original.id, 100,["A", "B", "C", "D"]) }
                  },
                  ...(row.original.omr_sheet ? [
                    {
                      text: 'View OMR Sheet',
                      icon: 'tabler-eye text-[22px]',
                      menuItemProps: {
                        className: 'flex items-center gap-2 text-textSecondary',

                        onClick: () => {
                          window.open(
                            `${process.env.NEXT_PUBLIC_APP_URL}/${row.original.omr_sheet}`,
                            "_blank"
                          );
                        }
                      }
                    }
                  ] : []),
                ]}
              /> */}
            </div>
          )
        },
        enableSorting: false
      })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingResultIds]
  )

  useEffect(() => {
    console.log("selectedBatch", selectedBatch);
  }, [selectedBatch]);

  const table = useReactTable({
    data: data as BatchesWithQP[],
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

  if (showImportStudents) {
    return <ImportStudents batch={selectedBatch} onBack={() => {setShowImportStudents(false); updateBatchList(); setSelectedBatch(null);}} />;
  }

  return (
    <>
      <Card>
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters setData={setData} tableData={tableData} />
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='is-[70px]'
            SelectProps={{ MenuProps }}
          >
            {TableRowLimit && TableRowLimit.rowLimit.length > 0 && TableRowLimit.rowLimit.map((limit, index) => (
              <MenuItem key={index} value={limit}>{limit}</MenuItem>
            ))}
          </CustomTextField>
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Batch'
              className='is-full sm:is-auto'
            />
            <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='is-full sm:is-auto'
            >
              Export
            </Button>
            <Button
              variant='tonal'
              startIcon={<i className='tabler-user-down' />}
              color='error'

              // onClick={() => setAddUserOpen(!addUserOpen)}

              onClick={() => setShowImportStudents(true)}
              className='is-full sm:is-auto'
            >
              Import Students
            </Button>
            <Link href={getLocalizedUrl('batches/create', locale as Locale)} className='flex'>
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}

                // onClick={() => setAddUserOpen(!addUserOpen)}
                className='is-full sm:is-auto'
              >
                Add New Batch
              </Button>
            </Link>
          </div>
        </div>
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
      </Card>
      <AssignAssessorDialog batch={singleBatch} open={assignAssessorOpen} handleClose={() => {setAssignAssessorOpen(!assignAssessorOpen); setSingleBatch(null)}} updateBatchList={updateBatchList} data={assessorData}/>
      {/* <DownloadEvidence open={downloadEvidenceDialogOpen} onClose={() => {setDownloadEvidenceDialogOpen(false); setBatchId(null);}} batchId={batchId} setJobStatus={setJobStatus} /> */}
    </>
  )
}

export default BatchesListTable
