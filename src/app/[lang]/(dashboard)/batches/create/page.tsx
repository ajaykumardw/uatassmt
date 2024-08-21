// Component Imports

import Grid from "@mui/material/Grid"

import AddEditBatchForm from "@/views/batches/addEditForm"
import SkeletonForm from "@/components/skeleton/SkeletonForm"

// const getStateData = async () => {
//   // Vars
//   const res = await fetch(`${process.env.API_URL}/state`, {method: 'POST',
//   headers: {
//     'Content-Type': 'application/json', // Assuming JSON data
//     // Add any other headers if needed
//   }})

//   if (!res.ok) {
//     throw new Error('Failed to fetch stateData')
//   }

//   return res.json()
// }

const getSSCData = async () => {
  // Vars
  const sscData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`).then(function (response) { return response.json() });

  // if (!res.ok) {
  //   throw new Error('Failed to fetch sector skills council')
  // }

  // const userData = await res.json();

  // setSscUsers(userData);

  // if(sscData.length > 0){

  // }

  return sscData

}

const AgencyCreateApp = async () => {

  // Vars
  // const stateData = await getStateData();

  const ssc = await getSSCData();

  if(ssc){

    return (

      <Grid item xs={12}>
        <AddEditBatchForm sscData={ssc} />
      </Grid>

    );
  }else{

    return <SkeletonForm />
  }



}

export default AgencyCreateApp
