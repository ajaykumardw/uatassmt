'use client'

import { useState } from 'react'

import { toast } from 'react-toastify'

import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material'

import { getCandidateResetPreview, resetCandidate } from './action'
import type { ResetPreview } from './action'

const resetTableLabels: { key: keyof ResetPreview['counts']; label: string }[] = [
  { key: 'feedback_response_answers', label: 'Feedback Answers' },
  { key: 'feedback_responses', label: 'Feedback Responses' },
  { key: 'student_captured_images', label: 'Captured Images' },
  { key: 'exam_set_results', label: 'Exam Set Results' },
  { key: 'student_exam_set_results', label: 'Student Exam Set Result (Attempts)' },
  { key: 'student_question_attempts', label: 'Question Attempts' },
  { key: 'offline_candidate_papers', label: 'Offline Candidate Papers' },
  { key: 'media_files', label: 'Media Files' },
  { key: 'log_sessions', label: 'Login Sessions' }
]

const Page = () => {
  const [candidateId, setCandidateId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [preview, setPreview] = useState<ResetPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<{ deleted: ResetPreview['counts']; student: { candidate_id: string; candidate_name: string } } | null>(null)

  const handleFind = async () => {
    if (!candidateId.trim()) {
      toast.error('Please enter candidate ID')

      return
    }

    if (!password) {
      toast.error('Please enter your password')

      return
    }

    try {
      setLoading(true)
      setError(null)
      setPreview(null)
      setResult(null)

      const res = await getCandidateResetPreview(candidateId, password)

      if ('error' in res) {
        setError(res.error)

        toast.error(res.error)

        return
      }

      setPreview(res)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async () => {
    try {
      setResetting(true)

      const res = await resetCandidate(candidateId, password)

      if ('error' in res) {
        toast.error(res.error)

        return
      }

      setResult(res)
      setPreview(null)
      setConfirmOpen(false)
      toast.success('Candidate reset successfully')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Reset Candidate</h1>

      <p className="mb-2">
        Enter a candidate ID to reset them to a fresh state. All exam attempts, feedback, images, media and login sessions
        will be deleted. The student record itself is kept.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <TextField
              label="Candidate ID"
              size="small"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFind()
              }}
              fullWidth
            />

            <Button variant="contained" onClick={handleFind} disabled={loading}>
              {loading ? 'Loading...' : 'Find Candidate'}
            </Button>
          </div>

          <TextField
            label="Enter your password"
            size="small"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFind()
            }}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <i className="tabler-eye" /> : <i className="tabler-eye-off" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {loading && <LinearProgress className="w-full" />}

          {error && !preview && (
            <Alert severity="error">{error}</Alert>
          )}

          {preview && (
            <div className="flex flex-col gap-4">
              <Alert severity="info">
                <b>{preview.student.candidate_id}</b> — {preview.student.candidate_name}
                {preview.student.batch_name ? ` (Batch: ${preview.student.batch_name})` : ''}
                <br />
                Attendance: {preview.student.attendance} &nbsp;|&nbsp; Result: {preview.student.result} &nbsp;|&nbsp; Certificate:{' '}
                {preview.student.certificate_no || 'None'}
              </Alert>

              <Typography variant="h6">Record count found for this candidate</Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Data</b></TableCell>
                      <TableCell align="right"><b>Records</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resetTableLabels.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell align="right">{preview.counts[row.key]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <div>
                <Button variant="contained" color="error" onClick={() => setConfirmOpen(true)}>
                  Reset Candidate
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-4">
              <Alert severity="success">
                <b>{result.student.candidate_id}</b> — {result.student.candidate_name} reset successfully.
              </Alert>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Data</b></TableCell>
                      <TableCell align="right"><b>Deleted</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resetTableLabels.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell align="right">{result.deleted[row.key]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => !resetting && setConfirmOpen(false)}>
        <DialogTitle>Reset Candidate?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-2">
            This will permanently delete all exam attempts, feedback, captured images, media files and login sessions for{' '}
            <b>{preview?.student.candidate_id}</b>
            {preview?.student.candidate_name ? ` (${preview.student.candidate_name})` : ''}.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The student record will be reset to a fresh, never-attempted state. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions className="gap-2">
          <Button onClick={() => setConfirmOpen(false)} disabled={resetting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmReset} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Yes, Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Page