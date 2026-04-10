"use client"

import CandidateWiseResultList from "@/views/agency/reports/candidate-result"

// Component Imports

// import { useEffect, useState } from "react"

// import NOSList from "@/views/agency/nos/list"
// import SkeletonTable from '@/components/skeleton/SkeletonTable'

// import PCReportList from "@/views/agency/reports/pc-wise"

const CandidateReport = () => {

  // Vars
  // const [data, setNOS] = useState([])
  // const [loading, setLoading] = useState(true);

  // const getNOSData = async () => {
  //   // Vars
  //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nos`)

  //   if (!res.ok) {
  //     throw new Error('Failed to fetch NOS')
  //   }

  //   const nosData = await res.json();

  //   setNOS(nosData);
  //   setLoading(false);

  // }

  // useEffect(() => {

  //   getNOSData()
  // }, []);

  // const updateNOSList = () => {
  //   getNOSData();
  // };

  // if(!loading){

    return <CandidateWiseResultList />

  // }else{
  //   return <SkeletonTable />
  // }

}

export default CandidateReport
