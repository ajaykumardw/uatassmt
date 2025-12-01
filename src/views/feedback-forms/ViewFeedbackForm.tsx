import React, { useEffect, useState } from "react";

import type { feedback_forms, feedback_questions } from "@prisma/client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Skeleton, Typography } from "@mui/material";

import DialogCloseButton from "@/components/dialogs/DialogCloseButton";

const ViewFeedbackForm = ({ open, handleClose, id }: { open: boolean; handleClose: () => void; id: number | null }) => {

  const [data, setData] = useState<feedback_forms & { feedback_questions: feedback_questions[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFeedbackFormData = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback_forms/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch feedback form data');
      }

      const fetchedData = await response.json();

      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching feedback form data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      setData(null);
      fetchFeedbackFormData(id);
    }
  }, [id]);

  return (
    <Dialog open={open} onClose={handleClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      maxWidth="md"
    >
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>{loading ? <Skeleton className="w-full" /> : data ? data.form_name : "No Data"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={4}>
          {loading ? (
            <>
              <Grid item xs={12}>
                <Skeleton className="w-full h-6 mb-2" />
                <Skeleton width={100} />
                <Skeleton width={100} />
              </Grid>
              <Grid item xs={12}>
                <Skeleton className="w-full h-6 mb-2" />
                <Skeleton width={100} />
                <Skeleton width={100} />
              </Grid>
              <Grid item xs={12}>
                <Skeleton className="w-full h-6 mb-2" />
                <Skeleton width={100} />
                <Skeleton width={100} />
              </Grid>
            </>
          ) : data && data.feedback_questions.length > 0 ? (
            data.feedback_questions.map((question, index) => (<React.Fragment key={index}>
              <Grid item xs={12} key={index}>
                <div>
                  <strong>Q{index + 1}:</strong> {question.question}
                </div>
                {question.question_type === 1 && (
                  <div className="ps-4">
                    <Typography>Yes</Typography>
                    <Typography>No</Typography>
                  </div>
                )}
              </Grid>
              {question.question_type === 2 && (
                <div className="ps-4">
                  <Typography>{question.option1}</Typography>
                  <Typography>{question.option2}</Typography>
                  <Typography>{question.option3}</Typography>
                  <Typography>{question.option4}</Typography>
                </div>
              )}
            </React.Fragment>))
          ) : (
            <Grid item xs={12}>
              No questions available for this feedback form.
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions className='pt-4'>
        <Button onClick={handleClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ViewFeedbackForm;
