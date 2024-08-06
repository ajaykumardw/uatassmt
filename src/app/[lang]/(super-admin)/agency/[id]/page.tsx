"use client"

// Component Imports

import { useEffect, useState } from "react";

import type { city, state, users } from "@prisma/client";

import Grid from "@mui/material/Grid"

import { Card, CardContent, CardHeader, Divider, Skeleton, Typography } from "@mui/material";

import AgencyEditForm from "@/views/super-admin/agency/editForm";

const AgencyEditPage = ({ params }: { params: { id: number } }) => {
  // Vars
  const {id} = params;
  const [currentAgency, setCurrentAgency] = useState<users>();
  const [stateData, setStateData] = useState<state[]>([]);
  const [cityData, setCityData] = useState<city[]>([]);


  const getAgency = async (id: number) => {

    // Vars

    const agencyId = Number(id)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency/${agencyId}`)

    if (!res.ok) {
      throw new Error('Failed to fetch agency data')
    }

    const data = await res.json()

    setCurrentAgency(data);
  }

  const getStateData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/state`, {method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Assuming JSON data
      // Add any other headers if needed
    }})

    if (!res.ok) {
      throw new Error('Failed to fetch stateData')
    }

    const data = await res.json()

    setStateData(data);
  }

  const getCityData = async (state: number) => {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/${state}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if(!res.ok){
      throw new Error('Failed to fetch city data')
    }

    const data = await res.json();

    setCityData(data);

  }


  useEffect(() => {
    getAgency(id)
    getStateData()
  }, [id])

  useEffect(() => {
    if (currentAgency?.state_id) {
      getCityData(currentAgency.state_id);
    }
  }, [currentAgency]); // Fetch cities when currentAgency changes

  if(cityData.length>0){


    return (

      <Grid item xs={12}>
        <AgencyEditForm currentAgency={currentAgency} stateData={stateData} citiesData={cityData} />
      </Grid>

      // <div>
      //   {stateData.map((state: any) => {
      //     console.log(state); // Logging the state
      //     // Returning some JSX for each state, adjust as needed
      //     return (
      //       <div key={state.id}>
      //         {/* Example JSX, replace with your actual JSX */}
      //         <p>{state.name}</p>
      //       </div>
      //     );
      //   })}
      //   {/* Other JSX elements can be placed here */}
      // </div>

    );
  }else{
    return (
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Edit Agency' />
          <Divider />
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <Typography variant='body2' className='font-medium'>
                    <Skeleton width={150} animation="pulse" />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='body2' className='font-medium'>
                    <Skeleton width={150} animation="pulse" />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="text" width={190} height={24} animation="pulse" />
                  <Skeleton variant="text" height={40} animation="pulse" />
                </Grid>
                <Grid item xs={12} className='flex gap-4'>
                  <Skeleton variant="rounded" width={90} height={38} animation="pulse" />
                  <Skeleton variant="rounded" width={80} height={38} animation="pulse" />
                </Grid>
              </Grid>
            </CardContent>
        </Card>
      </Grid>
    )
  }
}

export default AgencyEditPage



// const AgencyEditForm = async ({ params }: { params: { id: number } }) => {

//   const {id} = params;

//   const [agency] = await getAgency(id)

//   // Vars

//   return (<div>Agency Company name: {agency.company_name}</div>)

// }

// export default AgencyEditForm
