import { useState } from "react";

import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

interface CandidateDetailProps {
  candidateDetails: any;
}

const CandidateDetail = ({ candidateDetails }: CandidateDetailProps) => {

  const [visibleImages, setVisibleImages] = useState({
    ssc: true,
    tp: true,
    agency: true
  });

  return (
    <Grid container className='mb-4' spacing={2}>
      <Grid item xs={12} className="flex gap-4">
        {candidateDetails?.ssc_image && visibleImages.ssc && (
          <img src={candidateDetails?.ssc_image} alt="SSC Logo" className="object-contain" width={100} height={100} onError={() => setVisibleImages(prev => ({ ...prev, ssc: false }))} />
        )}
        {candidateDetails?.agency_image && visibleImages.agency && (
          <img src={candidateDetails?.agency_image} alt="Assessment Agency Logo" className="object-contain" width={100} height={100} onError={() => setVisibleImages(prev => ({ ...prev, agency: false }))} />
        )}
        {candidateDetails?.tp_image && visibleImages.tp && (
          <img src={candidateDetails?.tp_image} alt="TP Logo" className="object-contain" width={100} height={100} onError={() => setVisibleImages(prev => ({ ...prev, tp: false }))} />
        )}
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Batch : {candidateDetails?.batch}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Scheme : {candidateDetails?.scheme}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Sub-Scheme : {candidateDetails?.sub_scheme}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Assessment Date : {candidateDetails?.assessment_date}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Job Role : {candidateDetails?.qp}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          TP/PIA{"'"}s Name : {candidateDetails?.partner}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Candidate{"'"}s Name : {candidateDetails?.name}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Candidate{"'"}s ID : {candidateDetails?.candidate_id}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Aadhaar No. : {candidateDetails?.aadhaar}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Total Marks : {candidateDetails?.total_marks}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Obtained Marks : {candidateDetails?.obtained_marks}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Result Status: {candidateDetails?.result_status}
        </Typography>
      </Grid>
      <Grid item xs={6} sm={6}>
        <Typography variant='h6' className='mb-2'>
          Percentage (%): {candidateDetails?.percentage}
        </Typography>
      </Grid>
    </Grid>
  )

}

export default CandidateDetail
