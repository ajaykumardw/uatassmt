// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import QuestionsList from "@views/agency/questions/viva/list"

const Question = () => {
  // Vars
  const [data, setQuestions] = useState([])

  const getQuestionsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/viva`)

    if (!res.ok) {
      throw new Error('Failed to fetch Viva Questions')
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
