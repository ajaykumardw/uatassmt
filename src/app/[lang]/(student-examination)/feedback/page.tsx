"use client"

import { Grid } from "@mui/material";

const FeedBackPage = () => {

  return (
    <div className='p-4'>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          Feedback Page
        </Grid>
        <Grid item sm={12} md={7}>
          Thank you!!
        </Grid>
      </Grid>
    </div>
  );

}

export default FeedBackPage
