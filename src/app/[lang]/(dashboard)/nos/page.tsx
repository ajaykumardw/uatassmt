// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import NOSList from "@/views/agency/nos/list"

// const getData = async () => {
//   // Vars
//   const res = await fetch(`${process.env.API_URL}/sectorskills`)

//   if (!res.ok) {
//     throw new Error('Failed to fetch userData')
//   }

//   return res.json()
// }

const NOS = () => {
  // Vars
  // const data = await getData()

  const [data, setQP] = useState([])

  // const[sscData, setSscUsers] = useState([])

  const getNOSData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos`)

    if (!res.ok) {
      throw new Error('Failed to fetch NOS')
    }

    const nosData = await res.json();

    setQP(nosData);

    // return res.json()
  }

  useEffect(() => {

    getNOSData()
  }, []);

  // console.log(sscData);

  const updateNOSList = () => {
    getNOSData();
  };

  // console.log(data);

  return <NOSList nosData={data} updateNOSList={updateNOSList} />
}

export default NOS
