"use client"

// Component Imports

import { useEffect, useState } from "react"

import QualificationPackList from "@/views/agency/qualification-packs/list"
import SkeletonTable from '@/components/skeleton/SkeletonTable'

const QualificationPack = () => {
  // Vars
  const [data, setQP] = useState([])
  const [loading, setLoading] = useState(true);

  const getQPData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qualification-packs`)

    if (!res.ok) {
      throw new Error('Failed to fetch Qualification Packs')
    }

    const qpData = await res.json();

    setQP(qpData);
    setLoading(false);

  }

  useEffect(() => {

    getQPData()
  }, []);


  const updateQPList = () => {
    getQPData();
  };

  if(!loading){
    return <QualificationPackList qPackData={data} updateQPList={updateQPList} />
  }else{
    return <SkeletonTable />
  }
}

export default QualificationPack
