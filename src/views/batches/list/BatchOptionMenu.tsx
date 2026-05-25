'use client'

import {FC, useRef, useState, useEffect } from 'react'

import { toast } from "react-toastify";

import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography"
import OptionMenu from "@/@core/components/option-menu";

type RowType = {
  id: number;
  question_paper?: string | null;
  omr_sheet?: string | null;
};

type Props = {
  row: { original: RowType };
};

type JobType = {
  id: number
  reference_id: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  file_path?: string
}


const handleGeneratePaper = async (
  batchId: number,
  startPolling: (batchId: number) => void
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

    startPolling(result.job.reference_id);

    toast.success(

      result.message ||

      "Question paper generation started.",

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

    console.log("result:", result)

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

const BatchOptionMenu: FC<Props> = ({
  row,
}) => {

  const [job, setJob] = useState<JobType | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const data = row.original;

  // 🔁 polling
  const startPolling = (batchId: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/job?type=generate_question_paper`
      )

      const result = await res.json()
      const data = result.job;

      setJob(data)

      console.log("Polling job data:", data)

      const status = data?.status?.trim().toLowerCase();

      if (status === 'completed' || status === 'failed') {
        clearInterval(intervalRef.current!)
        intervalRef.current = null

        if (status === 'completed') {

          toast.success('Question Paper generated.')

        } else {

          toast.error('Question Paper generation failed')
        }
      }
    }, 2000)
  }

  // 🔄 Check for existing job on mount
  const fetchExistingJob = async () => {

    try {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches/${data?.id}/zip/job?type=generate_question_paper`
      )

      const result = await res.json()

      if (result.job && (result.job.status !== 'completed' && result.job.status !== 'failed')) {

        setJob(result.job)
        startPolling(result.job.reference_id) // Resume polling

      } else if (result.job?.status === 'completed') {

        setJob(result.job)
      } else {
        setJob(null)
      }
    } catch (err) {

      setJob(null)

      console.error('Error fetching existing zip job:', err)
    }
  }

  useEffect(() => {

    setJob(null) // Reset job state when batchId changes

    fetchExistingJob()

    return () => {

      if (intervalRef.current) clearInterval(intervalRef.current)
    }

  }, [data.id])

  const loading = job && (job.status === 'pending' || job.status === 'processing') || false

  const options = [
    {
      text: data.question_paper ? "Regenerate Paper" : "Generate Paper",
      icon: "tabler-file-text text-[22px]",
      menuItemProps: {
        className: "flex items-center gap-2 text-textSecondary",
        onClick: () => handleGeneratePaper(data.id, startPolling),
        disabled: loading
      },
    },

    ...(job?.status === 'pending' ? [
      {
        text: "Pending Generation",
        icon: "tabler-loader text-[22px] animate-spin",
        menuItemProps: {
          className: "flex items-center gap-2 text-textSecondary cursor-not-allowed",
          disabled: true
        },
      }
    ] : []),

     ...(job?.status === 'processing'
      ? [
          {
            text: (
              <div className="w-full">
                <LinearProgress
                  variant="determinate"
                  value={job.progress || 0}
                />
                <Typography>
                  {job.progress || 0}%
                </Typography>
              </div>
            ),
            // icon: 'tabler-loader text-[22px] animate-spin',
            menuItemProps: {
              className:
                'flex items-center gap-2 text-textSecondary',
              readOnly: true
            },
          },
        ]
      : []),

    ...(data.question_paper
      ? [
        {
          text: "View Paper",
          icon: "tabler-eye text-[22px]",
          menuItemProps: {
            className: "flex items-center gap-2 text-textSecondary",
            onClick: () => {
              window.open(
                `${process.env.NEXT_PUBLIC_APP_URL}/${data.question_paper}`,
                "_blank"
              );
            },
          },
        },
      ]
      : []),

    {
      text: data.omr_sheet
        ? "Regenerate OMR Sheet"
        : "Generate OMR Sheet",
      icon: "tabler-file-text text-[22px]",
      menuItemProps: {
        disabled: !data.question_paper || loading,
        className: "flex items-center gap-2 text-textSecondary",
        onClick: () =>
          generateOMRHTML(data.id, 100, ["A", "B", "C", "D"]),
      },
    },

    ...(data.omr_sheet
      ? [
        {
          text: "View OMR Sheet",
          icon: "tabler-eye text-[22px]",
          menuItemProps: {
            className: "flex items-center gap-2 text-textSecondary",
            onClick: () => {
              window.open(
                `${process.env.NEXT_PUBLIC_APP_URL}/${data.omr_sheet}`,
                "_blank"
              );
            },
          },
        },
      ]
      : []),
  ];

  return (
    <OptionMenu
      iconClassName="text-[22px] text-textSecondary"
      options={options}
    />
  );
};

export default BatchOptionMenu;
