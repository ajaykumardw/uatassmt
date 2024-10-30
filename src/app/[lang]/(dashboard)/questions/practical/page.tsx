// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import QuestionsList from "@views/agency/questions/practical/list"
import SkeletonTable from '@/components/skeleton/SkeletonTable'

const Question = () => {
  // Vars
  const [data, setQuestions] = useState([])
  const [loading, setLoading] = useState(true);

  const getQuestionsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/practical`)

    if (!res.ok) {
      throw new Error('Failed to fetch Practical Questions')
    }

    const questionsData = await res.json();

    setQuestions(questionsData);
    setLoading(false);

  }

  useEffect(() => {

    getQuestionsData()
  }, []);

  const updateQuestionsList = () => {
    getQuestionsData();
  };

  // console.log(data);

  if(!loading){
    return <QuestionsList questionsData={data} updateQuestionsList={updateQuestionsList} />
  }else{
    return <SkeletonTable />
  }
}

export default Question
