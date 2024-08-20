// Component Imports

import Grid from "@mui/material/Grid"

import AddEditBatchForm from "@/views/batches/addEditForm"

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

const AgencyCreateApp = async () => {

  // Vars
  // const stateData = await getStateData();

  return (

    <Grid item xs={12}>
      <AddEditBatchForm />
    </Grid>

  );
}

export default AgencyCreateApp
