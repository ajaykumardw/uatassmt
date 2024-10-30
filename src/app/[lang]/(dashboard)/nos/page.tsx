"use client"

// Component Imports

import { useEffect, useState } from "react"

import NOSList from "@/views/agency/nos/list"
import SkeletonTable from '@/components/skeleton/SkeletonTable'

const NOS = () => {
  // Vars
  const [data, setNOS] = useState([])
  const [loading, setLoading] = useState(true);

  const getNOSData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos`)

    if (!res.ok) {
      throw new Error('Failed to fetch NOS')
    }

    const nosData = await res.json();

    setNOS(nosData);
    setLoading(false);

  }

  useEffect(() => {

    getNOSData()
  }, []);

  const updateNOSList = () => {
    getNOSData();
  };

  if(!loading){
    return <NOSList nosData={data} updateNOSList={updateNOSList} />
  }else{
    return <SkeletonTable />
  }
}

export default NOS
