// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

// import UserList from "@/views/agency/sector-skill-council/list"
import TrainingResourcesList from "@/views/agency/training-resources/list"

// const getData = async () => {
//   // Vars
//   const res = await fetch(`${process.env.API_URL}/sectorskills`)

//   if (!res.ok) {
//     throw new Error('Failed to fetch userData')
//   }

//   return res.json()
// }

const TrainingResourcesListApp = () => {
  // Vars
  // const data = await getData()

  const[data, setTrainingResources] = useState([])

  const getTrainingResourcesData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-resources`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const resourcesData = await res.json();

    setTrainingResources(resourcesData);

    // return res.json()
  }

  useEffect(() => {

    getTrainingResourcesData()
  }, []);

  const updateTrainingResourceList = () => {
    getTrainingResourcesData();
  };

  // console.log(data);

  return <TrainingResourcesList userData={data} updateTrainingResourceList={updateTrainingResourceList} />
}

export default TrainingResourcesListApp
