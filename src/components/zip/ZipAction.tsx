'use client'

import { useRef, useState, useEffect } from 'react'

import { Button, Chip, CircularProgress } from '@mui/material'

import { toast } from 'react-toastify'

import DownloadEvidence from './DownloadEvidence'
import type { FolderKey } from '@/configs/customDataConfig'
import { getFiles } from '@/views/batches/completed/actions'

type JobType = {
  id: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  file_path?: string
}

const ZipAction = ({ batchId }: { batchId: number }) => {
  const [job, setJob] = useState<JobType | null>(null)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (open) {

      const fetchFiles = async () => {

        const res = await getFiles(batchId)

        console.log("Files for batch", batchId, res)

        setFiles(res?.files || {});
      }

      fetchFiles()
    }

  }, [open])

  // 🔁 polling
  const startPolling = (jobId: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/job/${jobId}`
      )

      const data = await res.json()

      setJob(data.job)

      const status = data.job.status?.trim().toLowerCase();

      if (status === 'completed' || status === 'failed') {
        clearInterval(intervalRef.current!)
        intervalRef.current = null

        if (status === 'completed') {

          toast.success('Zip ready')

        } else {

          toast.error('Zip generation failed')

        }
      }
    }, 2000)
  }

  // 🚀 called from dialog
  const handleGenerate = async (folders: FolderKey[]) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folders })
        }
      )

      const data = await res.json()

      if (!data?.job) {
        toast.error('Failed to create job')

        return
      }

      setJob(data.job)
      startPolling(data.job.id)
      toast.success('Zip generation started')
    } catch (err) {
      toast.error('Error generating zip')
    }
  }

  // 🔄 Check for existing job on mount
  const fetchExistingJob = async () => {

    try {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/job`
      )

      const data = await res.json()

      if (data.job && (data.job.status !== 'completed' && data.job.status !== 'failed')) {

        setJob(data.job)
        startPolling(data.job.id) // Resume polling

      } else if (data.job?.status === 'completed') {

        setJob(data.job)
      }
    } catch (err) {
      console.error('Error fetching existing zip job:', err)
    }
  }

  useEffect(() => {

    fetchExistingJob()

    return () => {

      if (intervalRef.current) clearInterval(intervalRef.current)
    }

  }, [])

  // Function to handle file download
  const handleDownload = async () => {

    if (!job?.file_path) {

      toast.error('File path not found');

      return;
    }

    try {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/download`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/zip',
          },
        });

      if (!res.ok) {
        throw new Error('Failed to download zip');
      }

      // Get the filename from the Content-Disposition header
      const disposition = res.headers.get('Content-Disposition');
      let filename = 'download.zip'; // Default fallback filename

      if (disposition && disposition.indexOf('attachment') !== -1) {

        const regex = /filename="([^"]+)"/;
        const matches = regex.exec(disposition);

        if (matches != null && matches[1]) {
          filename = matches[1]; // Extract filename from the header
        }
      }

      // Create a blob from the response
      const blob = await res.blob();

      // Create a link element and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = filename; // Use the extracted filename
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Clean up the URL object after the download
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (err) {
      toast.error('Error downloading zip');
    }
  };

  // ✅ Determine if Generate button should be disabled
  const isGeneratingDisabled = job?.status === 'pending' || job?.status === 'processing'

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        disabled={isGeneratingDisabled}
        size='small'
      >
        {job?.status === 'completed' ? 'Regenerate Zip' : 'Generate Zip'}
      </Button>
      {
        job?.status === 'pending' && <Chip className='capitalize' label="Pending" color='warning' variant='tonal' />
      }

      {
        job?.status === 'processing' && <Chip className='capitalize' label={`Processing ${job.progress || 0}%`} icon={<CircularProgress size={16} />} color='info' variant='tonal' />
      }

      {
        job?.status === 'failed' && <Chip className='capitalize' label="Failed" color='error' variant='tonal' />
      }

      {job?.status === 'completed' && job.file_path && (
        <Button
          variant="contained"
          color="success"
          onClick={handleDownload}
          size='small'
        >
          Download Zip
        </Button>
      )}

      <DownloadEvidence
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleGenerate}
        files={files}
      />
    </div>
  )
}

export default ZipAction
