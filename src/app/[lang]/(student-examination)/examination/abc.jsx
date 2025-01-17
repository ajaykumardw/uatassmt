// 'use client'; // This ensures the component runs on the client side

// import React, { useEffect, useState } from 'react';

// import { Card, CardHeader, CardContent, Typography, Button, CardActions, Alert, AlertTitle, Chip, RadioGroup, FormControlLabel, Radio, ButtonGroup } from "@mui/material";

// import Grid from "@mui/material/Grid";

// import CustomIconButton from '@/@core/components/mui/IconButton';
// import { exam_sets, exam_sets_questions, questions } from '@prisma/client';


// const Buttons = ({total}:{total?: number}) => {
//   return (
//     <div className='flex gap-2 flex-wrap'>
//       {Array.from({ length: total || 0 }, (_, index) => (
//         <Button size='small' color={index<=7 ? 'success' : ( index>7 && index <= 9 ? 'error' : ( index > 9 && index <=12 ? 'info' : ( index===13 ? 'primary' : 'secondary')))} variant='tonal' key={`i-${index}`}>{index + 1}</Button>
//       ))}
//     </div>
//   )
// }

// const Examination: React.FC = () => {

//   const [timeLeft, setTimeLeft] = useState(0); // 60 minutes in seconds (3600 seconds)
//   const [totalTime, setTotalTime] = useState(0); // 60 minutes in seconds (3600 seconds)
//   const [examData, setExamData] = useState< exam_sets & {exam_sets_questions: exam_sets_questions[] & {questions: questions}} | null>(null);

//   const getExamInstructions = async() => {
//     const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-exam-set`).then(function(res){return res.json()});
//     setExamData(data.batch.exam_set);

//     console.log("data", data);
//   }

//   useEffect(() => {
//     getExamInstructions();
//   }, []);

//   useEffect(() => {
//     if(examData){
//       console.log("examData", examData.exam_sets_questions.length);
//       setTotalTime(examData.exam_duration * 60);
//       setTimeLeft(examData.exam_duration * 60);
//     }
//   }, [examData]);

//   useEffect(() => {
//     // If the timer reaches zero, we stop the countdown
//     if (timeLeft <= 0) return;

//     const intervalId = setInterval(() => {
//       setTimeLeft(prevTime => prevTime - 1);
//     }, 1000);

//     // Cleanup interval on component unmount or when the timer reaches zero
//     return () => clearInterval(intervalId);
//   }, [timeLeft]);

//   // Calculate hours, minutes, and seconds from the timeLeft in seconds
//   const hours = Math.floor(timeLeft / 3600);
//   const minutes = Math.floor((timeLeft % 3600) / 60);
//   const seconds = timeLeft % 60;

//   const totalHours = Math.floor(totalTime / 3600);
//   const totalMinutes = Math.floor((totalTime % 3600) / 60);
//   const totalSeconds = totalTime % 60;

//   // Determine color based on remaining time
//   const getColor = () => {
//     if (timeLeft <= 600) return 'text-error';   // Less than 10 minutes
//     if (timeLeft <= 1800) return 'text-warning'; // Between 10 to 30 minutes

//     return 'text-success';  // More than 30 minutes
//   };

//   // useEffect(() => {
//   //   // Disable right-click (context menu)
//   //   const disableRightClick = (e: MouseEvent) => {
//   //     e.preventDefault();
//   //   };

//   //   // Disable F5, Ctrl+R, Cmd+R, and other reload shortcuts
//   //   const disableReloadShortcuts = (e: KeyboardEvent) => {
//   //     // Detect F5, Ctrl+R, Cmd+R, and others
//   //     if (
//   //       e.key === 'F5' ||
//   //       (e.ctrlKey && e.key === 'r') ||
//   //       (e.metaKey && e.key === 'r') ||
//   //       (e.ctrlKey && e.key === 'R') ||
//   //       (e.metaKey && e.key === 'R')
//   //     ) {
//   //       e.preventDefault();
//   //     }
//   //   };

//   //   // Prevent page reload via the "beforeunload" event (in most browsers)
//   //   const preventPageReload = (e: BeforeUnloadEvent) => {
//   //     e.preventDefault();
//   //     e.returnValue = ''; // Chrome requires this for blocking the action
//   //   };

//   //   // Add event listeners
//   //   document.addEventListener('contextmenu', disableRightClick); // Disable right-click
//   //   document.addEventListener('keydown', disableReloadShortcuts); // Disable reload shortcuts
//   //   window.addEventListener('beforeunload', preventPageReload); // Disable reload on refresh or back
//   //   window.onresize = function() {
//   //     window.resizeTo(window.screen.availWidth, window.screen.availHeight); // Resizes the window back to the original size
//   //   };
//   //   window.onfocus = function() {
//   //     console.log('Window gained focus (likely not minimized)');
//   //   };
//   //   // Disable text selection (optional, but useful)
//   //   document.body.style.userSelect = 'none'; // Disable text selection

//   //   // Cleanup event listeners on component unmount
//   //   return () => {
//   //     document.removeEventListener('contextmenu', disableRightClick);
//   //     document.removeEventListener('keydown', disableReloadShortcuts);
//   //     window.removeEventListener('beforeunload', preventPageReload);

//   //     // Re-enable text selection when component is unmounted
//   //     document.body.style.userSelect = 'initial';
//   //   };
//   // }, []);



//   return (
//     <div className='p-4'>
//       <Grid container spacing={6}>
//         <Grid item xs={12}>
//           <Alert severity='error'>
//             <AlertTitle>Warning</AlertTitle>
//             Do Not Press Back/Refresh Button
//           </Alert>
//         </Grid>
//         <Grid item sm={12} md={7}>
//           <Card>
//             <CardHeader title="Question 14 of 50" />
//             <CardContent>
//               <Grid container spacing={6}>
//                 <Grid item xs={7} sm={7} md={10}>
//                   <Typography variant='h4'>Transaction list option you will get from which menu?</Typography>
//                 </Grid>
//                 <Grid item textAlign='end' xs={5} sm={5} md={2}>
//                   <Button variant='tonal'>
//                     4 Mark
//                   </Button>
//                 </Grid>
//                 <Grid item xs={12}>
//                   <RadioGroup>
//                     <FormControlLabel value='1' control={<Radio />} label='Reports'/>
//                     <FormControlLabel value='2' control={<Radio />} label='Company'/>
//                     <FormControlLabel value='3' control={<Radio />} label='Setup'/>
//                     <FormControlLabel value='4' control={<Radio />} label='Activities'/>
//                   </RadioGroup>
//                 </Grid>
//               </Grid>
//             </CardContent>
//             <CardActions>
//               <Grid container spacing={4}>
//                 <Grid item>
//                   <ButtonGroup variant='contained'>
//                     <Button>Previous</Button>
//                     <Button color='info'>Mark for review & Next</Button>
//                   </ButtonGroup>
//                 </Grid>
//                 <Grid item>
//                   <ButtonGroup variant='contained'>
//                     <Button>Next</Button>
//                     <Button variant='contained' disabled>Finish</Button>
//                   </ButtonGroup>
//                 </Grid>
//               </Grid>
//               {/* <Button disabled variant="tonal" color='secondary'>
//                 Previous
//               </Button>
//               <Button variant="contained" color='info'>
//                 Mark for review & next
//               </Button>
//               <Button variant="tonal" color='success'>
//                 Next
//               </Button>
//               <Button disabled variant="contained">
//                 Finish
//               </Button> */}
//             </CardActions>
//           </Card>
//         </Grid>
//         <Grid item sm={12} md={5}>
//           <Grid container spacing={6}>
//             <Grid item xs={12}>
//               <Card>
//                 <CardHeader title="Time Status" />
//                 <CardContent>
//                   <Typography variant="h4" component="div" className={getColor()}>
//                     {/* Display hours:minutes:seconds with leading zeros */}
//                     {String(hours).padStart(2, '0')}:
//                     {String(minutes).padStart(2, '0')}:
//                     {String(seconds).padStart(2, '0')}
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//             <Grid item xs={12}>
//               <Card>
//                 <CardHeader title="Total Time" />
//                 <CardContent>
//                   <Typography variant="h4" component="div">
//                     {/* Display hours:minutes:seconds with leading zeros */}
//                     {String(totalHours).padStart(2, '0')}:
//                     {String(totalMinutes).padStart(2, '0')}:
//                     {String(totalSeconds).padStart(2, '0')}
//                     (hh:mm:ss)
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//             <Grid item xs={12}>
//               <Card>
//                 <CardHeader title="Summary" />
//                 <CardContent>
//                   <Grid container spacing={6}>
//                     <Grid item xs={12}>
//                       <Buttons total={examData?.exam_sets_questions.length} />
//                     </Grid>
//                     <Grid item md={12} lg={6}>
//                       <div className='flex gap-2 items-center'>
//                         <Button color='success' variant='tonal'>
//                           8
//                         </Button>
//                         <Typography variant='h5'>
//                           Answered
//                         </Typography>
//                       </div>
//                     </Grid>
//                     <Grid item md={12} lg={6}>
//                       <div className='flex gap-2 items-center'>
//                         <Button color='info' variant='tonal'>
//                           3
//                         </Button>
//                         <Typography variant='h5'>
//                           Marked
//                         </Typography>
//                       </div>
//                     </Grid>
//                     <Grid item md={12} lg={6}>
//                       <div className='flex gap-2 items-center'>
//                         <Button color='error' variant='tonal'>
//                           2
//                         </Button>
//                         <Typography variant='h5'>
//                           Not Answered
//                         </Typography>
//                       </div>
//                     </Grid>
//                     <Grid item md={12} lg={6}>
//                       <div className='flex gap-2 items-center'>
//                         <Button color='secondary' variant='tonal'>
//                           37
//                         </Button>
//                         <Typography variant='h5'>
//                           Not Visited
//                         </Typography>
//                       </div>
//                     </Grid>
//                   </Grid>
//                 </CardContent>
//                 {/* <CardActions>
//                   <Button variant="contained">
//                     Start Exam
//                   </Button>
//                 </CardActions> */}
//               </Card>
//             </Grid>
//           </Grid>
//         </Grid>
//       </Grid>
//     </div>
//   );
// };

// export default Examination;




'use client'; // Ensures the component runs on the client side

import React, { useEffect, useState } from 'react';

import { Card, CardHeader, CardContent, Typography, Button, CardActions, Alert, AlertTitle, RadioGroup, FormControlLabel, Radio, ButtonGroup, Grid } from "@mui/material";

// import type { exam_sets, exam_sets_questions, questions } from '@prisma/client';
import { Controller, useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { boolean, object } from 'valibot';
import { DateTime } from 'luxon';

// const Buttons = ({ total, answered, marked }: { total?: number, answered: Set<number>, marked: Set<number> }) => {
//   return (
//     <div className='flex gap-2 flex-wrap'>
//       {Array.from({ length: total || 0 }, (_, index) => (
//         <Button
//           size='small'
//           color={
//             answered.has(index) ? 'success' :
//             marked.has(index) ? 'info' :
//             'secondary'
//           }
//           variant='tonal'
//           key={`i-${index}`}
//         >
//           {index + 1}
//         </Button>
//       ))}
//     </div>
//   );
// };

// type FormDataType = {
//   username: string
//   email: string
//   password: string
//   isPasswordShown: boolean
//   confirmPassword: string
//   isConfirmPasswordShown: boolean
//   firstName: string
//   lastName: string
//   country: string
//   language: string[]
//   twitter: string
//   facebook: string
//   instagram: string
//   github: string
// }

const questionSchema = object({
  question: boolean()
})

const Examination = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track current question index

  // const [answered, setAnswered] = useState(new Set());
  const [marked, setMarked] = useState(new Set());
  const [selectedOption, setSelectedOption] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [answerData, setAnswerData] = useState({});
  const [notAnsweredData, setNotAnsweredData] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [notVisitedQuestions, setNotVisitedQuestions] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState({});

  // Fetch exam data from the API
  const getExamInstructions = async () => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-exam-set`).then(res => res.json());

    setExamData(data.batch.exam_set);
  };

  useEffect(() => {
    getExamInstructions();
  }, []);

  useEffect(() => {
    if (examData) {
      setTotalTime(examData.exam_duration * 60); // Total time in seconds
      setTimeLeft(examData.exam_duration * 60);
    }
  }, [examData]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // const [formData, setFormData] = useState<FormDataType>({
  //   username: '',
  //   email: '',
  //   password: '',
  //   isPasswordShown: false,
  //   confirmPassword: '',
  //   isConfirmPasswordShown: false,
  //   firstName: '',
  //   lastName: '',
  //   country: '',
  //   language: [],
  //   twitter: '',
  //   facebook: '',
  //   instagram: '',
  //   github: ''
  // })

  const {
    control,
    handleSubmit: handleQuestionFinish,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(questionSchema),

  })

  const onSubmit = () => {
    console.log("question finished");
  }

  // const handleAnswerQuestion = () => {
  //   if (selectedOption) {
  //     setAnswered(prev => new Set(prev.add(currentQuestionIndex)));
  //   }
  // };

  // const handleMarkForReview = () => {
  //   setMarked(prev => new Set(prev.add(currentQuestionIndex)));
  // };

  // const getCurrentTimestamp = () => {
  //   const timestamp = DateTime.now().setZone('Asia/Kolkata').toMillis();
  //   return timestamp;
  // };


  const getFormattedTime = () => {
    const formattedTime = DateTime.now()
      .setZone('Asia/Kolkata')  // Set the timezone to Asia/Kolkata
      .toFormat('yyyy-LL-dd HH:mm:s');  // Format the time as 'YYYY-MM-DD HH:mms'

    return formattedTime;
  };

  useEffect(() => {

    const time = getFormattedTime();

    if (time) {
      setStartTime(null);
      setStartTime(getFormattedTime());
    }
  }, [currentQuestionIndex])

  useEffect(() => {
    if (examData && visitedQuestions) {
      setNotVisitedQuestions(examData.exam_sets_questions.length - Object.keys(visitedQuestions).length)
    }
  }, [visitedQuestions, examData])

  useEffect(() => {
    if (notAnsweredData && markedQuestions && answerData) {
      setNotVisitedQuestions(notVisitedQuestions - (markedQuestions + Object.keys(answerData).length + Object.keys(notAnsweredData).length))
    }
  }, [notAnsweredData, markedQuestions, answerData])

  const submitQuestion = async (data) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-question-attempt`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json' // Assuming you're sending JSON data

      },

      body: JSON.stringify(data)

    });


    if (res.ok) {
      // toast.success('Students uploaded successfully!', {
      //   hideProgressBar: false
      // });
      // onBack();

      // setLoading(false);
      // handleReset();

      // localStorage.setItem("formSubmitMessage", "New Batch Created Successfully!");

      // router.push(getLocalizedUrl("/batches/list", locale as Locale))

    } else {
      // setLoading(false);
      // toast.error('Something went wrong!', {
      //   hideProgressBar: false
      // });
    }
  }


  const handleNextQuestion = async () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)

    console.log("sele", selectedOption == null);

    setVisitedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }))

    if (selectedOption == null) {
      setNotAnsweredData((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }))
    }


    // const startTime = getFormattedTime();

    const endTime = getFormattedTime();

    const submitData = [examData?.id, examData?.exam_sets_questions[currentQuestionIndex].question_id, selectedOption, [startTime, endTime]];

    await submitQuestion(submitData);

    console.log("question data", [examData?.exam_sets_questions[currentQuestionIndex].question_id, selectedOption, [startTime, endTime]]);



    // console.log("question data:",examData?.exam_sets_questions[currentQuestionIndex], "selected option:", selectedOption);

    // console.log("attempt question:", examData?.exam_sets_questions[currentQuestionIndex].question_id)
    // handleQuestionFinish(onSubmit);

    if (currentQuestionIndex < (examData?.exam_sets_questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const renderQuestionButtons = () => {
    return examData?.exam_sets_questions.map((_, index) => (
      <Button
        key={index}
        variant="tonal"
        size="small"
        color={currentQuestionIndex === index ? 'primary' : (answerData && answerData[index] ? 'success' : 'secondary')}
        onClick={() => { setCurrentQuestionIndex(index); setActiveStep(index) }} // Set the index of the clicked question
      >
        {index + 1}
      </Button>
    ));
  };

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const totalHours = Math.floor(totalTime / 3600);
  const totalMinutes = Math.floor((totalTime % 3600) / 60);
  const totalSeconds = totalTime % 60;

  const getColor = () => {
    if (timeLeft <= 600) return 'text-error';
    if (timeLeft <= 1800) return 'text-warning';

    return 'text-success';
  };

  const selectAnswer = (value) => {
    setSelectedOption(value);
    setAnswerData((prev) => ({
      ...prev,
      [currentQuestionIndex]: value
    }));

  }

  const handleMarkedQuestions = () => {

    console.log("hi marked");


    // If an option is selected, mark the question as answered
    if (selectedOption) {

      // setAnswered(prev => new Set(prev.add(currentQuestionIndex))); // Add the current question to answered set
    } else {
      setMarkedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }))
      
      // If no option is selected, mark it for review
      setMarked(prev => new Set(prev.add(currentQuestionIndex))); // Add the current question to marked set
    }

    // Proceed to the next question
    if (currentQuestionIndex < (examData?.exam_sets_questions.length || 0) - 1) {
      handleNextQuestion();
      setCurrentQuestionIndex(currentQuestionIndex + 1); // Move to the next question
      setSelectedOption(null); // Reset the selected option for the next question
    }

  }

  return (
    <div className='p-4'>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Alert severity='error'>
            <AlertTitle>Warning</AlertTitle>
            Do Not Press Back/Refresh Button
          </Alert>
        </Grid>
        <Grid item sm={12} md={7}>
          <Card>
            <CardHeader title={`Question ${activeStep + 1} of ${examData?.exam_sets_questions.length}`} />
            <CardContent>
              <form method='post' id='questionForm' onSubmit={handleQuestionFinish(onSubmit)}>
                {examData?.exam_sets_questions.map((question, index) => {

                  switch (activeStep) {
                    case (index):
                      return (
                        <Grid key={index} container spacing={6}>
                          <Grid item xs={7} sm={7} md={10}>
                            {/* Display the question text */}
                            <Typography variant="h4">
                              {question.questions.question}
                            </Typography>
                          </Grid>
                          <Grid item textAlign='end' xs={5} sm={5} md={2}>
                            <Button variant='tonal'>
                              {question.marks} Mark
                            </Button>
                          </Grid>
                          <Grid item xs={12}>
                            {/* RadioGroup for displaying options */}
                            <RadioGroup
                              value={answerData[currentQuestionIndex] || ""}
                              onChange={(e) => selectAnswer(e.target.value)}
                            >
                              {/* Manually create FormControlLabels for each option */}
                              {question.questions?.option1 && (
                                <Controller
                                  name='questionAnswer[${question.question_id}][]'
                                  control={control}
                                  render={({ field: { onChange } }) => (
                                    <FormControlLabel
                                      value="1"
                                      onChange={onChange}
                                      control={<Radio id={`option-${question.question_id}-1`} />}
                                      name={`questionAnswer[${question.question_id}][]`}
                                      label={question.questions.option1}
                                      {...(errors.question && { error: true, helperText: errors.question.message })}
                                    />
                                  )}
                                />
                              )}
                              {question.questions?.option2 && (
                                <FormControlLabel
                                  value="2"
                                  name={`questionAnswer[${question.question_id}][]`}
                                  control={<Radio id={`option-${question.question_id}-2`} />}
                                  label={question.questions.option2}
                                />
                              )}
                              {question.questions.option3 && (
                                <FormControlLabel
                                  value="3"
                                  name={`questionAnswer[${question.question_id}][]`}
                                  control={<Radio id={`option-${question.question_id}-3`} />}
                                  label={question.questions.option3}
                                />
                              )}
                              {question.questions.option4 && (
                                <FormControlLabel
                                  value="4"
                                  name={`questionAnswer[${question.question_id}][]`}
                                  control={<Radio id={`option-${question.question_id}-4`} />}
                                  label={question.questions.option4}
                                />
                              )}
                              {question.questions.option5 && (
                                <FormControlLabel
                                  value="5"
                                  name={`questionAnswer[${question.question_id}][]`}
                                  control={<Radio id={`option-${question.question_id}-5`} />}
                                  label={question.questions.option5}
                                />
                              )}
                            </RadioGroup>
                          </Grid>
                        </Grid>
                      )
                  }

                })}
              </form>
            </CardContent>
            <CardActions>
              <Grid container spacing={4}>
                <Grid item>
                  <ButtonGroup variant='contained'>
                    <Button onClick={handlePreviousQuestion} disabled={activeStep === 0}>Previous</Button>
                    <Button
                      onClick={handleMarkedQuestions}
                      color="info"
                    >
                      Mark for review & Next
                    </Button>

                  </ButtonGroup>
                </Grid>
                <Grid item>
                  <ButtonGroup variant='contained'>
                    <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === (examData?.exam_sets_questions.length || 0) - 1}>
                      Next
                    </Button>
                    <Button variant='contained' disabled>Finish</Button>
                  </ButtonGroup>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>
        <Grid item sm={12} md={5}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Time Status" />
                <CardContent>
                  <Typography variant="h4" component="div" className={getColor()}>
                    {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Total Time" />
                <CardContent>
                  <Typography variant="h4" component="div">
                    {String(totalHours).padStart(2, '0')}:{String(totalMinutes).padStart(2, '0')}:{String(totalSeconds).padStart(2, '0')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Summary" />
                <CardContent>
                  <Grid container spacing={6}>
                    <Grid item xs={12}>
                      <div className='flex gap-2 flex-wrap'>
                        {renderQuestionButtons()}
                      </div>
                      {/* <Buttons total={examData?.exam_sets_questions.length} answered={answered} marked={marked} /> */}
                    </Grid>
                    <Grid item md={12} lg={6}>
                      <div className='flex gap-2 items-center'>
                        <Button color='success' variant='tonal'>{answerData ? Object.keys(answerData).length : 0}</Button>
                        <Typography variant='h5'>Answered</Typography>
                      </div>
                    </Grid>
                    <Grid item md={12} lg={6}>
                      <div className='flex gap-2 items-center'>
                        <Button color='info' variant='tonal'>{marked.size}</Button>
                        <Typography variant='h5'>Marked</Typography>
                      </div>
                    </Grid>
                    <Grid item md={12} lg={6}>
                      <div className='flex gap-2 items-center'>
                        <Button color='error' variant='tonal'>{(Object.keys(notAnsweredData).length)}</Button>
                        <Typography variant='h5'>Not Answered</Typography>
                      </div>
                    </Grid>
                    <Grid item md={12} lg={6}>
                      <div className='flex gap-2 items-center'>
                        <Button color='secondary' variant='tonal'>{notVisitedQuestions != null ? notVisitedQuestions : 0}</Button>
                        <Typography variant='h5'>Not Visited</Typography>
                      </div>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Examination;
