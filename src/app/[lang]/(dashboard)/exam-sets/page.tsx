// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import ExamSetsList from "@views/agency/exam-sets/list"

const ExamSets = () => {
  // Vars
  const [data, setQuestions] = useState([])

  const getExamSetsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam-sets`)

    if (!res.ok) {
      throw new Error('Failed to fetch Exam Sets')
    }

    const questionsData = await res.json();

    setQuestions(questionsData);

  }

  useEffect(() => {

    getExamSetsData()
  }, []);

  const updateExamSetsList = () => {
    getExamSetsData();
  };

  // console.log(data);


  return <ExamSetsList questionsData={data} updateExamSetsList={updateExamSetsList} />
}

export default ExamSets
