"use client"

// Component Imports

import { useEffect, useState } from "react"

import ExamSetsList from "@views/agency/exam-sets/list"
import SkeletonTable from '@/components/skeleton/SkeletonTable'

const ExamSets = () => {
  // Vars
  const [data, setQuestions] = useState([])
  const [loading, setLoading] = useState(true);

  const getExamSetsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-sets`)

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
    return <ExamSetsList questionsData={data} updateExamSetsList={updateExamSetsList} />
  }else{
    return <SkeletonTable />
  }
}

export default ExamSets
