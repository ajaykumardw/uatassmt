"use client"

// Component Imports

import { useEffect, useState } from "react"

import UserList from "@/views/agency/sector-skill-council/list"
import SkeletonTable from '@/components/skeleton/SkeletonTable'

const SectorSkillCouncilList = () => {
  // Vars
  // const data = await getData()

  const[data, setSscUsers] = useState([])
  const [loading, setLoading] = useState(true);

  const getSSCData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const userData = await res.json();

    setSscUsers(userData);
    setLoading(false);

  }

  useEffect(() => {

    getSSCData()
  }, []);

  const updateSSCList = () => {
    getSSCData();
  };

  if(!loading){
    return <UserList userData={data} updateSSCList={updateSSCList} />
  }else{
    return <SkeletonTable />
  }
}

export default SectorSkillCouncilList
