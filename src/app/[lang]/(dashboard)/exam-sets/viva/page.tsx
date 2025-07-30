"use client"

// Component Imports

import { useEffect, useState } from "react"

import VivaExamSetsList from "@/views/agency/exam-sets/viva"
import SkeletonTable from '@/components/skeleton/SkeletonTable'

const ExamSets = () => {
  // Vars
  const [data, setQuestions] = useState([])
  const [loading, setLoading] = useState(true);

  const getExamSetsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-sets?setType=V`)

    if (!res.ok) {
      throw new Error('Failed to fetch Exam Sets')
    }

    const questionsData = await res.json();

    setQuestions(questionsData);
    setLoading(false);

  }

  useEffect(() => {

    getExamSetsData()
  }, []);

  const updateExamSetsList = () => {
    getExamSetsData();
  };

  if(!loading){
    return <VivaExamSetsList questionsData={data} updateExamSetsList={updateExamSetsList} />
  }else{
    return <SkeletonTable />
  }
}

export default ExamSets
