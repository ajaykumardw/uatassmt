// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import QuestionsList from "@views/agency/questions/viva/list"
import SkeletonTable from '@/components/skeleton/SkeletonTable'

const Question = () => {
  // Vars
  const [data, setQuestions] = useState([])
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true);

  const getQuestionsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/viva`)

    if (!res.ok) {
      throw new Error('Failed to fetch Viva Questions')
    }

    const result = await res.json();

    setQuestions(result.data || []);
    setLanguages(result.languages || []);
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
    return <QuestionsList questionsData={data} languages={languages} updateQuestionsList={updateQuestionsList} />
  }else{
    return <SkeletonTable />
  }
}

export default Question
