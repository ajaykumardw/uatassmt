'use client'

import { useRef, useState, useEffect } from 'react'

import { Button, Chip, CircularProgress, LinearProgress, Box, Typography, Alert } from '@mui/material'

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

type DownloadState = {
  jobId: number
  batchId: number
  filename: string
  totalBytes: number
  loadedBytes: number
  startedAt: number
}

const DOWNLOAD_STATE_KEY = 'evidence_download_state'

const ZipAction = ({ batchId }: { batchId: number }) => {
  const [job, setJob] = useState<JobType | null>(null)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadLoaded, setDownloadLoaded] = useState(0)
  const [downloadTotal, setDownloadTotal] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [savedDownloadState, setSavedDownloadState] = useState<DownloadState | null>(null)

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

  // ✅ Check for incomplete download on mount — show persistent banner
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DOWNLOAD_STATE_KEY)

      if (saved) {
        const state: DownloadState = JSON.parse(saved)

        if (state.batchId === batchId && state.loadedBytes < state.totalBytes) {
          setSavedDownloadState(state)
        }

        localStorage.removeItem(DOWNLOAD_STATE_KEY)
      }
    } catch { }
  }, [])

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

  // 📥 Extract filename from Content-Disposition header
  const extractFilename = (headers: Headers): string => {
    const disposition = headers.get('Content-Disposition')

    if (disposition) {
      const match = /filename="([^"]+)"/.exec(disposition)

      if (match?.[1]) return match[1]
    }

    return 'download.zip'
  }

  // 📥 Save download state to localStorage
  const saveDownloadState = (state: DownloadState) => {
    try {
      localStorage.setItem(DOWNLOAD_STATE_KEY, JSON.stringify(state))
    } catch { }
  }

  // 📥 Clear download state from localStorage
  const clearDownloadState = () => {
    try {
      localStorage.removeItem(DOWNLOAD_STATE_KEY)
    } catch { }

    setSavedDownloadState(null)
  }

  // 📥 Streaming download with progress — hand off to browser via <a> tag
  const startStreamingDownload = async () => {
    if (!job?.file_path) {
      toast.error('File path not found')

      return
    }

    // Abort any existing download
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()

    abortControllerRef.current = abortController

    setIsDownloading(true)
    setDownloadProgress(0)
    setDownloadLoaded(0)
    setDownloadTotal(0)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/download`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/zip' },
          signal: abortController.signal,
        }
      )

      if (!res.ok) throw new Error('Failed to download zip')

      const filename = extractFilename(res.headers)
      const totalBytes = Number(res.headers.get('Content-Length')) || 0

      setDownloadTotal(totalBytes)

      // ✅ Stream chunks + track progress, then hand off to browser
      const reader = res.body!.getReader()
      const chunks: BlobPart[] = []
      let loaded = 0

      saveDownloadState({ jobId: job.id, batchId, filename, totalBytes, loadedBytes: 0, startedAt: Date.now() })

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        loaded += value.byteLength

        setDownloadLoaded(loaded)
        setDownloadProgress(totalBytes ? Math.round((loaded / totalBytes) * 100) : 0)

        // Update localStorage every 500KB
        if (loaded % (500 * 1024) < value.byteLength) {
          saveDownloadState({ jobId: job.id, batchId, filename, totalBytes, loadedBytes: loaded, startedAt: Date.now() })
        }
      }

      // ✅ All chunks received — create blob and trigger browser download
      const blob = new Blob(chunks, { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      clearDownloadState()
      toast.success(`Downloaded: ${filename}`)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        toast.info('Download cancelled')
      } else {
        toast.error('Error downloading zip')
        console.error('Download error:', err)
      }
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
      abortControllerRef.current = null
    }
  }

  // 🛑 Cancel download
  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      clearDownloadState()
    }
  }

  // ✅ Determine if Generate button should be disabled
  const isGeneratingDisabled = job?.status === 'pending' || job?.status === 'processing'

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className='flex flex-col gap-1'>
      {/* Persistent banner for incomplete download after reload */}
      {savedDownloadState && (
        <Alert
          severity='warning'
          onClose={() => setSavedDownloadState(null)}
          action={
            <Button color='inherit' size='small' onClick={() => {
              clearDownloadState()
              startStreamingDownload()
            }}>
              Re-download
            </Button>
          }
        >
          Incomplete download: &quot;{savedDownloadState.filename}&quot; ({Math.round(savedDownloadState.loadedBytes / savedDownloadState.totalBytes * 100)}% received). Click Download to restart.
        </Alert>
      )}

      <div className='flex items-center gap-2'>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          disabled={isGeneratingDisabled || isDownloading}
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

        {job?.status === 'completed' && job.file_path && !isDownloading && (
          <Button
            variant="contained"
            color="success"
            onClick={startStreamingDownload}
            size='small'
          >
            Download Zip
          </Button>
        )}

        {isDownloading && (
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelDownload}
            size='small'
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Download progress bar */}
      {isDownloading && (
        <Box sx={{ width: '100%', minWidth: 250 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant='caption' color='text.secondary'>
              Downloading...
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {downloadProgress}%{downloadTotal > 0 ? ` (${formatBytes(downloadLoaded)} / ${formatBytes(downloadTotal)})` : ''}
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={downloadProgress}
            color='success'
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
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
