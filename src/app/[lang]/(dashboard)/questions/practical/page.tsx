// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import QuestionsList from "@views/agency/questions/practical/list"

const Question = () => {
  // Vars
  const [data, setQuestions] = useState([])

  const getQuestionsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/practical`)

    if (!res.ok) {
      throw new Error('Failed to fetch Practical Questions')
    }

    const questionsData = await res.json();

    setQuestions(questionsData);

  }

  useEffect(() => {

    getQuestionsData()
  }, []);

  const updateQuestionsList = () => {
    getQuestionsData();
  };

  // console.log(data);


  return <QuestionsList questionsData={data} updateQuestionsList={updateQuestionsList} />
}

export default Question
