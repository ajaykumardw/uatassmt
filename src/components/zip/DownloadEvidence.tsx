import { FormEvent, useEffect, useState } from "react";

import Grid from "@mui/material/Grid";

import { FolderKey, folders } from "@/configs/customDataConfig";
import { Button, Checkbox, Dialog, DialogContent, DialogTitle, FormControl, FormControlLabel } from "@mui/material";
import DialogCloseButton from "../dialogs/DialogCloseButton";

const DownloadEvidence = ({ open, onClose, batchId }:{open: boolean; onClose: () => void, batchId: number | null}) => {
  const [selectedFolders, setSelectedFolders] = useState<FolderKey[]>(folders.filter(folder => folder.status === 1).map(folder => folder.id));
  const [intermediateCheckbox, setIntermediateCheckbox] = useState<boolean>(false);

  const handleFolderClick = (folderId: FolderKey) => {
    if (selectedFolders.includes(folderId)) {
      setSelectedFolders(selectedFolders.filter(id => id !== folderId));
    } else {
      setSelectedFolders([...selectedFolders, folderId]);
    }
  };

  useEffect(() => {
    if (selectedFolders.length > 0 && selectedFolders.length < folders.length) {
      setIntermediateCheckbox(true);
    } else {
      setIntermediateCheckbox(false);
    }

  }, [selectedFolders]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // API call to submit selected folders for evidence download
    // onClose();

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folders: selectedFolders }),
    });
  };

  const handleClose = () => {
    setSelectedFolders(folders.filter(folder => folder.status === 1).map(folder => folder.id));
    setIntermediateCheckbox(false);
    onClose();
  };

  if (batchId === null) {
    return null;
  }


  return (
    <Dialog
      fullWidth
      maxWidth='md'
      open={open}
      onClose={handleClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>Download Evidence</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Grid container>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFolders.length === folders.length}
                    indeterminate={intermediateCheckbox}
                    onChange={() => {
                      if (selectedFolders.length === folders.filter(folder => folder.status === 1).length) {
                        setSelectedFolders([]);
                      } else {
                        setSelectedFolders(folders.filter(folder => folder.status === 1).map(folder => folder.id));
                      }
                    }}
                  />
                }
                label="Select All"
              />
            </Grid>
            {folders.map(folder => (
              <Grid item xs={12} sm={6} key={folder.id}>
                <FormControlLabel
                  control={
                    <Checkbox disabled={folder.status === 0} checked={selectedFolders.includes(folder.id)} onChange={() => handleFolderClick(folder.id)} />
                  }
                  label={folder.name}
                />
              </Grid>
            ))}
          </Grid>
          <Grid>
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Generate
            </Button>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )

}

export default DownloadEvidence;
