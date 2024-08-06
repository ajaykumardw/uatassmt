// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import QualificationPackList from "@/views/agency/qualification-packs/list"

// const getData = async () => {
//   // Vars
//   const res = await fetch(`${process.env.API_URL}/sectorskills`)

//   if (!res.ok) {
//     throw new Error('Failed to fetch userData')
//   }

//   return res.json()
// }

const QualificationPack = () => {
  // Vars
  // const data = await getData()

  const [data, setQP] = useState([])

  // const[sscData, setSscUsers] = useState([])

  const getQPData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qualification-packs`)

    if (!res.ok) {
      throw new Error('Failed to fetch Qualification Packs')
    }

    const qpData = await res.json();

    setQP(qpData);

    // return res.json()
  }

  useEffect(() => {

    getQPData()
  }, []);

  // console.log(sscData);

  const updateQPList = () => {
    getQPData();
  };

  // console.log(data);

  return <QualificationPackList qPackData={data} updateQPList={updateQPList} />
}

export default QualificationPack
