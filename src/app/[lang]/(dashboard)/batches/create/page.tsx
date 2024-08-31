"use client"

// Component Imports
import Grid from "@mui/material/Grid"

import AddEditBatchForm from "@/views/batches/addEditForm"
import SkeletonForm from "@/components/skeleton/SkeletonForm"
import { useEffect, useState } from "react"
import { SSCType } from "@/types/sectorskills/sscType"
import { schemes, users } from "@prisma/client"
import { SchemesType } from "@/types/schemes/schemesType"

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


const AgencyCreateApp = () => {

  const [ssc, setSSCData] = useState<SSCType[]>([]);
  const [tp, setTPData] = useState<users[]>([]);
  const [schemes, setSchemesData] = useState<SchemesType[]>([]);

  const getSSCData = async () => {

    // Vars
    const sscData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`).then(function (response) { return response.json() });

    setSSCData(sscData);

  }

  const getTPData = async () => {

    // Vars
    const tpData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-partner`).then(function (response) { return response.json() });

    setTPData(tpData);

  }

  const getSchemes = async () => {
    const trainingPartners = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes`).then(function (response) { return response.json() });

    if (trainingPartners.length > 0) {

      setSchemesData(trainingPartners)

    } else {

      setSchemesData([])

    }
  }

  useEffect(() => {
    getSSCData();
    getTPData();
    getSchemes();
  }, []);

  // Vars
  // const stateData = await getStateData();

  // const ssc = await getSSCData();
  // const tp = await getTPData();

  if(ssc){

    return (

      <Grid item xs={12}>
        <AddEditBatchForm sscData={ssc} tpData={tp} schemesData={schemes} />
      </Grid>

    );
  }else{

    return <SkeletonForm />
  }



}

export default AgencyCreateApp
