// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import UserList from "@/views/agency/sector-skill-council/list"

// const getData = async () => {
//   // Vars
//   const res = await fetch(`${process.env.API_URL}/sectorskills`)

//   if (!res.ok) {
//     throw new Error('Failed to fetch userData')
//   }

//   return res.json()
// }

const SectorSkillCouncilList = () => {
  // Vars
  // const data = await getData()

  const[data, setSscUsers] = useState([])

  const getSSCData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const userData = await res.json();

    setSscUsers(userData);

    // return res.json()
  }

  useEffect(() => {

    getSSCData()
  }, []);

  const updateSSCList = () => {
    getSSCData();
  };

  // console.log(data);

  return <UserList userData={data} updateSSCList={updateSSCList} />
}

export default SectorSkillCouncilList
