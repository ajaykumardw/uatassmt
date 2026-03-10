'use client'

import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  icon?: string;
  successMessage: string;
  cancelMessage: string;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  open,
  setOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  successMessage = 'Action completed successfully!',
  cancelMessage = 'Action cancelled!',
  icon = 'tabler-alert-circle',
  onConfirm = async () => {},
  onCancel = () => {}
}: ConfirmDialogProps) => {
  const [secondDialog, setSecondDialog] = useState(false)
  const [userInput, setUserInput] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSecondDialogClose = () => {
    setSecondDialog(false)
    setOpen(false)
  }

  const handleConfirmation = async (value: boolean) => {
    if (value) {
      setLoading(true)

      try {
        await onConfirm() // wait for async action (like API call)
        setUserInput(true)
      } catch (e) {

        setUserInput(false)
      }

      setLoading(false)
      setSecondDialog(true)
      setOpen(false)
    } else {

      setUserInput(false)
      setSecondDialog(true)
      setOpen(false)
      onCancel()
    }
  }

  return (
    <>
      {/* Main confirmation dialog */}
      <Dialog fullWidth maxWidth="sm" open={open} onClose={() => setOpen(false)} closeAfterTransition={false}>
        <DialogContent className="flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
          <i className={`${icon} text-[88px] mbe-6 text-warning`} />
          <Typography variant="h4">{title}</Typography>
          <Typography color="text.primary">{message}</Typography>
        </DialogContent>
        <DialogActions className="justify-center pbs-0 sm:pbe-16 sm:pli-16">
          <Button
            variant="contained"
            onClick={() => handleConfirmation(true)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
          <Button
            variant="tonal"
            color="secondary"
            onClick={() => handleConfirmation(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback dialog */}
      <Dialog fullWidth maxWidth="sm" open={secondDialog} onClose={handleSecondDialogClose} closeAfterTransition={false}>
        <DialogContent className="flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
          <i
            className={classnames('text-[88px] mbe-6', {
              'tabler-circle-check text-success': userInput,
              'tabler-circle-x text-error': !userInput
            })}
          />
          <Typography variant="h4" className="mbe-2">
            {userInput ? 'Success' : 'Cancelled'}
          </Typography>
          <Typography color="text.primary">{userInput ? successMessage : cancelMessage}</Typography>
        </DialogContent>
        <DialogActions className="justify-center pbs-0 sm:pbe-16 sm:pli-16">
          <Button variant={userInput ? "contained" : "tonal"} color={userInput ? 'success' : 'secondary'} onClick={handleSecondDialogClose}>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmDialog
