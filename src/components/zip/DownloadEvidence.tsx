import { type FormEvent, useState } from "react";

import Grid from "@mui/material/Grid";

import { Button, Checkbox, Chip, Dialog, DialogContent, DialogTitle, DialogActions, FormControlLabel, Card, CardContent, Typography } from "@mui/material";

import { type FolderKey, folders } from "@/configs/customDataConfig";

import DialogCloseButton from "../dialogs/DialogCloseButton";

// import { toast } from "react-toastify";

type FileCount = {
  id: string;
  name: string;
  count: number;
};

const DownloadEvidence = ({ open, onClose, onSubmit, files }: { open: boolean; onClose: () => void, onSubmit: (folders: FolderKey[]) => void, files: FileCount[] }) => {
  const [selectedFolders, setSelectedFolders] = useState<FolderKey[]>(folders.filter(folder => folder.status === 1).map(folder => folder.id));
  const [intermediateCheckbox, setIntermediateCheckbox] = useState<boolean>(false);

  const getCount = (folderId: string) => {
    // const folder = folders.find(f => f.id === folderId);

    // if (!folder) return 0;

    return files?.find((f: FileCount) => f.id === folderId)?.count || 0;
  };

  // const intervalRef = useRef<NodeJS.Timeout | null>(null);

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


  // return (
  //   <Dialog
  //     fullWidth
  //     maxWidth='md'
  //     open={open}
  //     onClose={handleClose}
  //     sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
  //   >
  //     <DialogCloseButton onClick={handleClose} disableRipple>
  //       <i className='tabler-x' />
  //     </DialogCloseButton>
  //     <DialogTitle>Download Evidence</DialogTitle>
  //     <DialogContent>
  //       <form onSubmit={handleSubmit}>
  //         <Grid container>
  //           <Grid item xs={12}>
  //             <FormControlLabel
  //               control={
  //                 <Checkbox
  //                   checked={selectedFolders.length === folders.length}
  //                   indeterminate={intermediateCheckbox}
  //                   onChange={() => {
  //                     if (selectedFolders.length === folders.filter(folder => folder.status === 1).length) {
  //                       setSelectedFolders([]);
  //                     } else {
  //                       setSelectedFolders(folders.filter(folder => folder.status === 1).map(folder => folder.id));
  //                     }
  //                   }}
  //                 />
  //               }
  //               label="Select All"
  //             />
  //           </Grid>
  //           {folders.map(folder => (
  //             <Grid item xs={12} sm={6} key={folder.id}>
  //               <FormControlLabel
  //                 control={
  //                   <Checkbox disabled={folder.status === 0} checked={selectedFolders.includes(folder.id)} onChange={() => handleFolderClick(folder.id)} />
  //                 }
  //                 sx={{
  //                   width: '100%',
  //                   '& .MuiFormControlLabel-label': {
  //                     flexGrow: 1,
  //                   },
  //                 }}
  //                 label={<div className="flex justify-between items-center gap-2">{folder.name} <Chip label={getCount(folder.id)} size="small" className="mr-3" variant="outlined" color={getCount(folder.id) > 0 ? "success" : "default"} /></div>}
  //               />
  //             </Grid>
  //           ))}
  //         </Grid>
  //         <Grid>
  //           <Button type="submit" variant="contained" sx={{ mt: 2 }}>
  //             Generate
  //           </Button>
  //         </Grid>
  //       </form>
  //     </DialogContent>
  //   </Dialog>
  // )

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

      <DialogTitle>
        <div className='flex items-center justify-between'>
          <span>Download Evidence</span>

          <Chip
            color='primary'
            label={`${selectedFolders.length} Selected`}
          />
        </div>
      </DialogTitle>

      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          <Card variant='outlined' className='mb-4'>
            <CardContent className='py-3'>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      selectedFolders.length ===
                      folders.filter(f => f.status === 1).length
                    }
                    indeterminate={intermediateCheckbox}
                    onChange={() => {
                      if (
                        selectedFolders.length ===
                        folders.filter(f => f.status === 1).length
                      ) {
                        setSelectedFolders([]);
                      } else {
                        setSelectedFolders(
                          folders
                            .filter(f => f.status === 1)
                            .map(f => f.id)
                        );
                      }
                    }}
                  />
                }
                label={
                  <Typography fontWeight={600}>
                    Select All Documents
                  </Typography>
                }
              />
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {folders.map(folder => {
              const selected = selectedFolders.includes(folder.id);
              const count = getCount(folder.id);

              return (
                <Grid item xs={12} sm={6} key={folder.id}>
                  <Card
                    variant='outlined'
                    onClick={() => {
                      if (folder.status === 1) {
                        handleFolderClick(folder.id);
                      }
                    }}
                    sx={{
                      cursor:
                        folder.status === 0
                          ? 'not-allowed'
                          : 'pointer',
                      borderColor: selected
                        ? 'primary.main'
                        : 'divider',
                      bgcolor: selected
                        ? 'action.selected'
                        : 'background.paper',
                      opacity:
                        folder.status === 0
                          ? 0.5
                          : 1,
                      transition: 'all .2s ease',
                      '&:hover': {
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <CardContent
                      sx={{
                        py: 2,
                        '&:last-child': {
                          pb: 2
                        }
                      }}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            checked={selected}
                            disabled={folder.status === 0}
                          />

                          <Typography variant='body2'>
                            {folder.name}
                          </Typography>
                        </div>

                        <Chip
                          size='small'
                          label={count}
                          color={
                            count > 0
                              ? 'success'
                              : 'default'
                          }
                          variant={
                            count > 0
                              ? 'filled'
                              : 'outlined'
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <DialogActions sx={{ mt: 4, px: 0 }}>
            <Button
              variant='outlined'
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              type='submit'
              variant='contained'
              disabled={!selectedFolders.length}
            >
              Generate ZIP
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  )

}

export default DownloadEvidence;
