// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import { Grid } from "@mui/material"

import ExamInstructionsList from "@/views/agency/exam-instructions/list"
import SkeletonTable from "@/components/skeleton/SkeletonTable"

const ExamInstructionsApp = () => {

  const[data, setExamInstructionsData] = useState([])
  const [loading, setLoading] = useState(true);

  const getExamInstructionsData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-instructions`)

    if (!res.ok) {
      throw new Error('Failed to fetch Exam Instructions Data')
    }

    const examInstructionsData = await res.json();

    setExamInstructionsData(examInstructionsData);
    setLoading(false);
  }

  useEffect(() => {

    getExamInstructionsData()
  }, []);

  const updateExamInstructionsList = () => {
    getExamInstructionsData();
  };

  if(!loading){
    return <ExamInstructionsList examInstructionData={data} updateExamInstructionsList={updateExamInstructionsList} />
  }else{
    return (
      <Grid container spacing={6}>
        {/* <Grid item xs={12}>
          <SkeletonListCards />
        </Grid> */}
        <Grid item xs={12}>
          <SkeletonTable />
        </Grid>
      </Grid>
    );
  }
}

export default ExamInstructionsApp
