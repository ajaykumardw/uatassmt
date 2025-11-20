'use client'; // Ensures the component runs on the client side

import React, { useEffect, useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Card, CardHeader, CardContent, Typography, Button, CardActions, Alert, AlertTitle, RadioGroup, FormControlLabel, Radio, ButtonGroup, Grid, Skeleton } from "@mui/material";

// import { Controller, useForm } from 'react-hook-form';

// import { valibotResolver } from '@hookform/resolvers/valibot';

// import { boolean, object } from 'valibot';

import { DateTime } from 'luxon';

import Webcam from 'react-webcam';

import { getLocalizedUrl } from '@/utils/i18n';

// const questionSchema = object({
//   question: boolean()
// });

const Examination = () => {
  const [timeLeft, setTimeLeft] = useState();
  const [totalTime, setTotalTime] = useState(0);
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track current question index
  const [selectedOption, setSelectedOption] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [answerData, setAnswerData] = useState({});
  const [notAnsweredData, setNotAnsweredData] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [notVisitedQuestions, setNotVisitedQuestions] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [captureImageInSeconds, setCaptureImageInSeconds] = useState(null);
  const webcamRef = useRef(null);

  const router = useRouter();
  const { lang: locale } = useParams();


  // useEffect(() => {
  //   // Disable right-click (context menu)
  //   const disableRightClick = (e) => {
  //     e.preventDefault();
  //   };

  //   // Disable F5, Ctrl+R, Cmd+R, and other reload shortcuts
  //   const disableReloadShortcuts = (e) => {
  //     // Detect F5, Ctrl+R, Cmd+R, and others
  //     if (
  //       e.key === 'F5' ||
  //       e.key === 'F12' || // Disable F12 (DevTools)
  //       (e.ctrlKey && e.key === 'r') ||
  //       (e.metaKey && e.key === 'r') ||
  //       (e.ctrlKey && e.key === 'R') ||
  //       (e.metaKey && e.key === 'R') ||
  //       (e.ctrlKey && e.shiftKey && e.key === 'I') // Disable Ctrl+Shift+I (DevTools)
  //     ) {
  //       e.preventDefault();
  //     }
  //   };

  //   // Prevent page reload via the "beforeunload" event (in most browsers)
  //   const preventPageReload = (e) => {
  //     e.preventDefault();
  //     e.returnValue = ''; // Chrome requires this for blocking the action
  //   };

  //   // Add event listeners
  //   document.addEventListener('contextmenu', disableRightClick); // Disable right-click
  //   document.addEventListener('keydown', disableReloadShortcuts); // Disable reload shortcuts
  //   window.addEventListener('beforeunload', preventPageReload); // Disable reload on refresh or back

  //   window.onresize = function() {
  //     window.resizeTo(window.screen.availWidth, window.screen.availHeight); // Resizes the window back to the original size
  //   };

  //   window.onfocus = function() {
  //     console.log('Window gained focus (likely not minimized)');
  //   };
  //   // window.addEventListener("focus", function() {
  //   //   // Create a new div element
  //   //   const d = document.createElement('div');
  //   //   // Set the text content of the new div
  //   //   d.textContent = "Window gained focus!!!";
  //   //   // Append the div to the document body
  //   //   document.body.appendChild(d);
  //   // });
  //   // window.addEventListener("blur", function() {
  //   //   // Create a new div element
  //   //   const d = document.createElement('div');
  //   //   // Set the text content of the new div
  //   //   d.textContent = "Window lost focus!!!";
  //   //   // Append the div to the document body
  //   //   document.body.appendChild(d);
  //   // });


  //   // window.addEventListener("blur", function(){
  //   //   alert("window focus lost");
  //   // });

  //   // Disable text selection (optional, but useful)

  //   document.body.style.userSelect = 'none'; // Disable text selection

  //   // Cleanup event listeners on component unmount
  //   return () => {
  //     document.removeEventListener('contextmenu', disableRightClick);
  //     document.removeEventListener('keydown', disableReloadShortcuts);
  //     window.removeEventListener('beforeunload', preventPageReload);

  //     // Re-enable text selection when component is unmounted
  //     document.body.style.userSelect = 'initial';
  //   };
  // }, []);

  const getIp = async () => {

    const res = await fetch('https://api.ipify.org');

    const data = await res.text();

    setIpAddress(data);

    return data
  }

  const handleUserMediaError = (error) => {
    console.error('Error accessing webcam:', error);

    if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
      // setCameraError('Camera access was denied. Please allow camera permissions to continue.');
    } else {
      // setCameraError('An error occurred while accessing the camera.');
    }
  };

  useEffect(() => {

    getIp();

    if(ipAddress){

      console.log("user_agent and ip address:", ipAddress, navigator.userAgent)
    }
  }, [ipAddress])

  // Fetch exam data from the API
  const getExamData = async () => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-exam-set`).then(res => res.json());

    setExamData(data.batch.theory_exam_set);
    setCaptureImageInSeconds(data.batch.capture_image_in_seconds);
  };

  useEffect(() => {
    // Start capturing images as soon as the component mounts
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();

        if (imageSrc) {
          // Send the base64 image data to the API route
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-capture-image`, {
            method: 'POST',
            body: JSON.stringify({ captured_image: imageSrc }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then((res) => res.json())
            .then((data) => console.log('Image saved:', data))
            .catch((error) => console.error('Error saving image:', error));
        }
      }
    }, captureImageInSeconds * 1000); // Capture every "captureImageInSeconds" seconds

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [captureImageInSeconds]);

  const setStudentExamResult = async () => {

    const ip = await getIp();

    const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-exam-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Assuming you're sending JSON data
      },
      body: JSON.stringify({"examSetId": examData.id, "examDurations": examData.exam_duration, "totalQuestions": examData.total_questions, "ip": ip, "userAgent": navigator.userAgent})
    }).then(res => res.json());

    console.log("data in frontend:", data);
  }

  useEffect(() => {
    getExamData();
  }, []);

  useEffect(() => {
    if (examData) {
      setTotalTime(examData.exam_duration * 60); // Total time in seconds
      setTimeLeft(examData.exam_duration * 60);
      console.log("hi from examData");
      setStudentExamResult();
      setLoading(false);
    }
  }, [examData]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      const endTime = getFormattedTime();
      const submitData = [examData?.id, examData?.exam_sets_questions[currentQuestionIndex].question_id, selectedOption[currentQuestionIndex], [selectedOption[currentQuestionIndex] ? 1 : 0 , startTime, endTime]];

      // if (answerData.hasOwnProperty(currentQuestionIndex)) {

        submitQuestion(submitData);

      // }

      router.push(getLocalizedUrl('/feedback', locale));
    }
  }, [timeLeft]);

  // const {
  //   control,
  //   handleSubmit: handleQuestionFinish,
  //   formState: { errors }
  // } = useForm({
  //   resolver: valibotResolver(questionSchema),
  // });

  const onSubmit = async () => {
    const endTime = getFormattedTime();
    const submitData = [examData?.id, examData?.exam_sets_questions[currentQuestionIndex].question_id, selectedOption[currentQuestionIndex], [selectedOption[currentQuestionIndex] ? 1 : 0 , startTime, endTime]];

    // if (answerData.hasOwnProperty(currentQuestionIndex)) {

      await submitQuestion(submitData);

    // }

    router.push(getLocalizedUrl('/feedback', locale));

  };

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
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (examData && visitedQuestions) {
      setNotVisitedQuestions(examData.exam_sets_questions.length - Object.keys(visitedQuestions).length);
    }
  }, [visitedQuestions, examData]);

  const submitQuestion = async (data) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-question-attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Assuming you're sending JSON data
      },
      body: JSON.stringify(data)
    });
  };

  const handleNextQuestion = async (type) => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
    setVisitedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }));

    if (!selectedOption[currentQuestionIndex] || selectedOption[currentQuestionIndex] == null) {
      if (type === 'a') {
        setMarkedQuestions(prev => {
          if (!(currentQuestionIndex in prev)) {
            // Add currentQuestionIndex to setNotAnsweredData if not marked already
            if (!answerData.hasOwnProperty(currentQuestionIndex)) {
              setNotAnsweredData(prevData => ({ ...prevData, [currentQuestionIndex]: currentQuestionIndex }));
            }
          }

          return { ...prev }; // Continue with the current state of setMarkedQuestions
        });
      }
    }

    const endTime = getFormattedTime();
    const submitData = [examData?.id, examData?.exam_sets_questions[currentQuestionIndex].question_id, selectedOption[currentQuestionIndex], [selectedOption[currentQuestionIndex] ? 1 : 0 , startTime, endTime]];

    // if (answerData.hasOwnProperty(currentQuestionIndex)) {

      await submitQuestion(submitData);

    // }

    if (currentQuestionIndex < (examData?.exam_sets_questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = async () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);

    if (!selectedOption[currentQuestionIndex] || selectedOption[currentQuestionIndex] == null) {
      // Check if currentQuestionIndex is not already in setMarkedQuestions
      setMarkedQuestions(prev => {
        if (!(currentQuestionIndex in prev)) {
          if (!answerData.hasOwnProperty(currentQuestionIndex)) {
            // Add currentQuestionIndex to setNotAnsweredData if not marked already
            setNotAnsweredData(prevData => ({ ...prevData, [currentQuestionIndex]: currentQuestionIndex }));
          }
        }

        return { ...prev }; // Continue with the current state of setMarkedQuestions
      });
    }

    // if (answerData.hasOwnProperty(currentQuestionIndex)) {

      const endTime = getFormattedTime();
      const submitData = [examData?.id, examData?.exam_sets_questions[currentQuestionIndex].question_id, selectedOption[currentQuestionIndex], [selectedOption[currentQuestionIndex] ? 1 : 0 , startTime, endTime]];

      await submitQuestion(submitData);

    // }

    setVisitedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }));

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpQuestion = async (index) => {
    setVisitedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }));

    if (!selectedOption[currentQuestionIndex] || selectedOption[currentQuestionIndex] == null) {
      setMarkedQuestions(prev => {
        if (!(currentQuestionIndex in prev)) {
          // Add currentQuestionIndex to setNotAnsweredData if not marked already
          setNotAnsweredData(prevData => ({ ...prevData, [currentQuestionIndex]: currentQuestionIndex }));
        }

        return { ...prev }; // Continue with the current state of setMarkedQuestions
      });
    }

    const endTime = getFormattedTime();
    const submitData = [examData?.id, examData?.exam_sets_questions[currentQuestionIndex].question_id, selectedOption[currentQuestionIndex], [ selectedOption[currentQuestionIndex] ? 1 : 0 , startTime, endTime]];

    // if (answerData.hasOwnProperty(currentQuestionIndex)) {

      await submitQuestion(submitData);

    // }

    setCurrentQuestionIndex(index);
    setActiveStep(index);
  };

  const activeClass = (index) => {
    if (markedQuestions.hasOwnProperty(index)) {
      // if (currentQuestionIndex === index) {
      //   return "primary";
      // }
      return "warning";
    } else if (answerData.hasOwnProperty(index)) {
      // if (currentQuestionIndex === index) {
      //   return "primary";
      // }
      return "success";
    } else if (notAnsweredData.hasOwnProperty(index)) {
      // if (currentQuestionIndex === index) {
      //   return "primary";
      // }
      return "error";
    } else if (!visitedQuestions.hasOwnProperty(index)) {
      // if (currentQuestionIndex === index) {
      //   return "primary";
      // }
      return "secondary";
    } else {
      // if (currentQuestionIndex === index) {
      //   return "primary";
      // }
      return "secondary";
    }
  };

  const renderQuestionButtons = () => {
    return examData?.exam_sets_questions.map((_, index) => (
      <Button
        key={index}
        variant={currentQuestionIndex === index ? 'tonal' : 'contained'}
        size="small"
        color={activeClass(index)}
        endIcon={currentQuestionIndex === index ? <i className='tabler-point-filled text-primary' /> : null}
        onClick={() => handleJumpQuestion(index)} // Set the index of the clicked question
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
    setSelectedOption((prev) => ({ ...prev, [currentQuestionIndex]: value }));
    setVisitedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }));

    // Update answer data
    setAnswerData((prev) => ({
      ...prev,
      [currentQuestionIndex]: value,
    }));

    // Remove currentQuestionIndex from marked questions, because the answer has been selected
    setMarkedQuestions((prev) => {
      const newData = { ...prev };

      delete newData[currentQuestionIndex]; // Removes currentQuestionIndex from marked questions

      return newData;
    });

  };

  const handleMarkedQuestions = () => {

    // If an option is selected, mark the question as answered
    if (!selectedOption[currentQuestionIndex] || selectedOption[currentQuestionIndex] == null) {
      setMarkedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }));
    }

    setNotAnsweredData((prev) => {
      const newData = { ...prev };

      delete newData[currentQuestionIndex];  // Removes the currentQuestionIndex key

      return newData;
    });

    // Proceed to the next question
    if (currentQuestionIndex < (examData?.exam_sets_questions.length || 0) - 1) {
      handleNextQuestion("b");
      setCurrentQuestionIndex(currentQuestionIndex + 1); // Move to the next question
    }
  };

  useEffect(() => {
    if (answerData) {
      if (answerData.hasOwnProperty(currentQuestionIndex)) {
        // Remove currentQuestionIndex from not answered data if an answer is selected
        setNotAnsweredData((prev) => {
          const newData = { ...prev };

          delete newData[currentQuestionIndex]; // Removes currentQuestionIndex from not answered data

          return newData;
        });
      }
    }
  }, [answerData])

  if (isLoading) {
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
              <CardHeader title={(<Skeleton variant="text" width={200} height={28} animation="pulse" />)} />
              <CardContent>
                <Grid container spacing={6}>
                  <Grid item xs={7} sm={7} md={10}>
                    {/* Display the question text */}
                    <Typography variant='h4'>
                      <Skeleton animation="pulse" />
                    </Typography>
                  </Grid>
                  <Grid item textAlign='end' xs={5} sm={5} md={2}>
                    <Skeleton variant="rounded" width={90} height={38} animation="pulse" />
                  </Grid>
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Skeleton variant="rounded" width={350} height={28} animation="pulse" />
                      </Grid>
                      <Grid item xs={12}>
                        <Skeleton variant="rounded" width={350} height={28} animation="pulse" />
                      </Grid>
                      <Grid item xs={12}>
                        <Skeleton variant="rounded" width={350} height={28} animation="pulse" />
                      </Grid>
                      <Grid item xs={12}>
                        <Skeleton variant="rounded" width={350} height={28} animation="pulse" />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

              </CardContent>
              <CardActions>
                <Grid container spacing={4}>
                  <Grid item>
                    <Skeleton variant="rounded" width={200} height={38} animation="pulse" />
                  </Grid>
                  <Grid item>
                    <Skeleton variant="rounded" width={150} height={38} animation="pulse" />
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
                      <Skeleton width={150} animation="pulse" />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Total Time" />
                  <CardContent>
                    <Typography variant="h4" component="div">
                      <Skeleton width={150} animation="pulse" />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Summary" />
                  <CardContent>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <div className='flex gap-2 flex-wrap'>
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                          <Skeleton width={50} height={50} animation="pulse" />
                        </div>
                        {/* <Buttons total={examData?.exam_sets_questions.length} answered={answered} marked={marked} /> */}
                      </Grid>
                      <Grid item md={12} lg={6}>
                        <div className='flex gap-2 items-center'>
                          <Skeleton width={70} height={60} animation="pulse" />
                          {/* <Button color='success' variant='contained'>{answerData ? Object.keys(answerData).length : 0}</Button> */}
                          <Typography variant='h5'><Skeleton width={130} animation="pulse" /></Typography>
                        </div>
                      </Grid>
                      <Grid item md={12} lg={6}>
                        <div className='flex gap-2 items-center'>
                          <Skeleton width={70} height={60} animation="pulse" />
                          {/* <Button color='success' variant='contained'>{answerData ? Object.keys(answerData).length : 0}</Button> */}
                          <Typography variant='h5'><Skeleton width={130} animation="pulse" /></Typography>
                        </div>
                      </Grid>
                      <Grid item md={12} lg={6}>
                        <div className='flex gap-2 items-center'>
                          <Skeleton width={70} height={60} animation="pulse" />
                          {/* <Button color='success' variant='contained'>{answerData ? Object.keys(answerData).length : 0}</Button> */}
                          <Typography variant='h5'><Skeleton width={130} animation="pulse" /></Typography>
                        </div>
                      </Grid>
                      <Grid item md={12} lg={6}>
                        <div className='flex gap-2 items-center'>
                          <Skeleton width={70} height={60} animation="pulse" />
                          {/* <Button color='success' variant='contained'>{answerData ? Object.keys(answerData).length : 0}</Button> */}
                          <Typography variant='h5'><Skeleton width={130} animation="pulse" /></Typography>
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
    )
  }

  return (
    <div className='p-4'>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <div className="flex flex-wrap items-start gap-4">
            <Alert severity='error' className='flex-auto'>
              <AlertTitle>Warning</AlertTitle>
              Do Not Press Back/Refresh Button
            </Alert>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={1}
              height={100}
              minScreenshotHeight={500}
              mirrored={false}
              videoConstraints={{
                facingMode: "user",
              }}
              onUserMediaError={handleUserMediaError}
              className="rounded"
            />
          </div>
        </Grid>
        <Grid item sm={12} md={7}>
          <Card>
            <CardHeader title={`Question ${activeStep + 1} of ${examData?.exam_sets_questions.length}`} />
            <CardContent>
              <form method='post' id='questionForm'>
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
                              {/* Dynamically render FormControlLabel for each option */}
                              {Object.keys(question.questions)
                                .filter(key => key.startsWith('option') && question.questions[key]) // Filter options that exist
                                .map((optionKey, index) => (

                                  // <Controller
                                  //   key={optionKey}
                                  //   name={`questionAnswer[${question.question_id}][]`}
                                  //   control={control}
                                  //   render={({ field: { onChange } }) => (

                                      <FormControlLabel
                                        key={optionKey}
                                        value={index + 1} // Use index to set the value for the option

                                        // onChange={onChange}
                                        control={<Radio id={`option-${question.question_id}-${index + 1}`} />}
                                        name={`questionAnswer[${question.question_id}][]`}
                                        label={question.questions[optionKey]}

                                        // {...(errors.question && { error: true, helperText: errors.question.message })}

                                      />

                                  //   )}
                                  // />

                                ))}
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
                    <Button onClick={() => handleNextQuestion("a")} disabled={currentQuestionIndex === (examData?.exam_sets_questions.length || 0) - 1}>
                      Next
                    </Button>

                  </ButtonGroup>
                </Grid>
                <Grid item>
                  <ButtonGroup variant='contained'>
                    <Button
                      onClick={handleMarkedQuestions}
                      color="warning"
                    >
                      Mark for review
                    </Button>
                    <Button variant='contained' onClick={onSubmit} disabled={Object.keys(answerData).length !== (examData?.exam_sets_questions.length || 0)}>Finish</Button>
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
                        <Button color='success' variant='contained'>{answerData ? Object.keys(answerData).length : 0}</Button>
                        <Typography variant='h5'>Answered</Typography>
                      </div>
                    </Grid>
                    <Grid item md={12} lg={6}>
                      <div className='flex gap-2 items-center'>
                        <Button color='warning' variant='contained'>{(Object.keys(markedQuestions).length)}</Button>
                        <Typography variant='h5'>Marked</Typography>
                      </div>
                    </Grid>
                    <Grid item md={12} lg={6}>
                      <div className='flex gap-2 items-center'>
                        <Button color='error' variant='contained'>{(Object.keys(notAnsweredData).length)}</Button>
                        <Typography variant='h5'>Not Answered</Typography>
                      </div>
                    </Grid>
                    <Grid item md={12} lg={6}>
                      <div className='flex gap-2 items-center'>
                        <Button color='secondary' variant='contained'>{notVisitedQuestions != null ? notVisitedQuestions : 0}</Button>
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
