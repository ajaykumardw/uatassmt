import { FormEvent, useEffect, useRef, useState } from "react";

import Grid from "@mui/material/Grid";

import { FolderKey, folders } from "@/configs/customDataConfig";
import { Button, Checkbox, Dialog, DialogContent, DialogTitle, FormControl, FormControlLabel } from "@mui/material";
import DialogCloseButton from "../dialogs/DialogCloseButton";
import { toast } from "react-toastify";

const DownloadEvidence = ({ open, onClose, onSubmit }: { open: boolean; onClose: () => void, onSubmit: (folders: FolderKey[]) => void }) => {
  const [selectedFolders, setSelectedFolders] = useState<FolderKey[]>(folders.filter(folder => folder.status === 1).map(folder => folder.id));
  const [intermediateCheckbox, setIntermediateCheckbox] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // const pollJob = (jobId: number, batchId: number) => {

  //   // ✅ Clear previous interval first
  //   if (intervalRef.current) {
  //     clearInterval(intervalRef.current);
  //   }

  //   intervalRef.current = setInterval(async () => {

  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/job/${jobId}`
  //     );

  //     const job = await res.json();

  //     console.log("Polling:", job.status); // 👈 DEBUG

  //     setJobStatus((prev: any) => ({
  //       ...prev,
  //       [batchId]: job
  //     }));

  //     if (job.status?.trim().toLowerCase() === "completed") {
  //       clearInterval(intervalRef.current!);
  //       intervalRef.current = null;

  //       toast.success("Zip ready");
  //     }

  //   }, 2000);
  // };

  // useEffect(() => {
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   };
  // }, []);

  const handleFolderClick = (folderId: FolderKey) => {
    if (selectedFolders.includes(folderId)) {
      setSelectedFolders(selectedFolders.filter(id => id !== folderId));
    } else {
      setSelectedFolders([...selectedFolders, folderId]);
    }
  };

  // useEffect(() => {
  //   if (selectedFolders.length > 0 && selectedFolders.length < folders.length) {
  //     setIntermediateCheckbox(true);
  //   } else {
  //     setIntermediateCheckbox(false);
  //   }

  // }, [selectedFolders]);

  // const handleSubmit = async (e: FormEvent) => {
  //   e.preventDefault();
  //   // API call to submit selected folders for evidence download
  //   // onClose();

  //   try {

  //     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/zip/generate`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ folders: selectedFolders }),
  //     });

  //     if (!res.ok) {
  //       toast.error("Failed to create zip job. Please try again.");
  //       return;
  //     }

  //     const data = await res.json();

  //     if (!data.job) {
  //       toast.error("Failed to create zip job. Please try again.");
  //       return;
  //     }

  //     setJobStatus((prev: any) => ({
  //       ...prev,
  //       [batchId as number]: data.job

  //     }));

  //     pollJob(data.job.id, batchId as number);

  //     toast.success("Zip job created successfully. You will be notified once it's ready.");
  //     handleClose();
  //   } catch (error) {
  //     console.error("Error creating zip job:", error);
  //     toast.error("An error occurred while creating the zip job. Please try again.");
  //   }
  // };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(selectedFolders);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFolders(folders.filter(folder => folder.status === 1).map(folder => folder.id));
    setIntermediateCheckbox(false);
    onClose();
  };

  // if (batchId === null) {
  //   return null;
  // }


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
