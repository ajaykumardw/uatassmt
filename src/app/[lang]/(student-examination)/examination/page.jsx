'use client'; // Ensures the component runs on the client side

import React, { useEffect, useRef, useState } from 'react';


import { Card, CardHeader, CardContent, Typography, Button, CardActions, Alert, AlertTitle, RadioGroup, FormControlLabel, Radio, ButtonGroup, Grid, Skeleton } from "@mui/material";

// import { Controller, useForm } from 'react-hook-form';

// import { valibotResolver } from '@hookform/resolvers/valibot';

// import { boolean, object } from 'valibot';

import { DateTime } from 'luxon';

import Webcam from 'react-webcam';

import { format } from 'date-fns';

import FeedBackPage from '@/components/FeedbackPage';

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
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [isActiveExam, setIsActiveExam] = useState(false);
  const [holdTimer, setHoldTimer] = useState(0);
  const [lockedQuestions, setLockedQuestions] = useState({}); // Questions locked on exam resume (browser close/open)
  const webcamRef = useRef(null);


  useEffect(() => {
    // Disable right-click (context menu)
    const disableRightClick = (e) => {
      e.preventDefault();
    };

    // Disable F5, Ctrl+R, Cmd+R, and other reload shortcuts
    const disableReloadShortcuts = (e) => {
      // Detect F5, Ctrl+R, Cmd+R, and others
      if (
        e.key === 'F5' ||
        e.key === 'F12' || // Disable F12 (DevTools)
        (e.ctrlKey && e.key === 'r') ||
        (e.metaKey && e.key === 'r') ||
        (e.ctrlKey && e.key === 'R') ||
        (e.metaKey && e.key === 'R') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') // Disable Ctrl+Shift+I (DevTools)
      ) {
        e.preventDefault();
      }
    };

    // Prevent page reload via the "beforeunload" event (in most browsers)
    const preventPageReload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires this for blocking the action
    };

    // Add event listeners
    document.addEventListener('contextmenu', disableRightClick); // Disable right-click
    document.addEventListener('keydown', disableReloadShortcuts); // Disable reload shortcuts
    window.addEventListener('beforeunload', preventPageReload); // Disable reload on refresh or back

    window.onresize = function() {
      window.resizeTo(window.screen.availWidth, window.screen.availHeight); // Resizes the window back to the original size
    };

    window.onfocus = function() {
      console.log('Window gained focus (likely not minimized)');
    };

    // window.addEventListener("focus", function() {
    //   // Create a new div element
    //   const d = document.createElement('div');
    //   // Set the text content of the new div
    //   d.textContent = "Window gained focus!!!";
    //   // Append the div to the document body
    //   document.body.appendChild(d);
    // });
    // window.addEventListener("blur", function() {
    //   // Create a new div element
    //   const d = document.createElement('div');
    //   // Set the text content of the new div
    //   d.textContent = "Window lost focus!!!";
    //   // Append the div to the document body
    //   document.body.appendChild(d);
    // });


    // window.addEventListener("blur", function(){
    //   alert("window focus lost");
    // });

    // Disable text selection (optional, but useful)

    document.body.style.userSelect = 'none'; // Disable text selection

    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableReloadShortcuts);
      window.removeEventListener('beforeunload', preventPageReload);

      // Re-enable text selection when component is unmounted
      document.body.style.userSelect = 'initial';
    };
  }, []);

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

    const now = DateTime.now().setZone('Asia/Kolkata');
    const start = DateTime.fromISO(data.batch.assessment_start_datetime).setZone('Asia/Kolkata');
    const end = DateTime.fromISO(data.batch.assessment_end_datetime).setZone('Asia/Kolkata');

    setExamData(data.batch.theory_exam_set);
    setIsActiveExam(now >= start && now <= end);
    setCaptureImageInSeconds(data.batch.capture_image_in_seconds);

    // sessionStorage flag = alive only during current browser tab session
    // Tab close → flag gone → exam resume mode (lock previously answered questions)
    // F5/refresh → flag persists → same session (all questions editable, but show previous answers)
    const sessionKey = `exam_active_${data.batch.theory_exam_set?.id}`;
    const isResumedExam = !sessionStorage.getItem(sessionKey);

    if (data.batch.theory_exam_set?.exam_sets_questions) {
      const prevAnswers = {};

      // Pre-populate answer data from previous session
      data.batch.theory_exam_set.exam_sets_questions.forEach((q, idx) => {
        if (q.status === 'answered' && q.student_answer != null) {
          let answer = q.student_answer;

          // When options are shuffled, old student_answer may be a DISPLAY POSITION
          // (from before this shuffle code was deployed). Convert position → original option ID
          // so the RadioGroup matches by option ID, not display position.
          if (q.shuffled_options) {
            const optIds = q.shuffled_options.map(o => o.id);

            if (!optIds.includes(answer)) {
              // answer is a display position → map to original option ID
              const optKeys = Object.keys(q.questions)
                .filter(k => k.startsWith('option') && q.questions[k]);

              const optKey = optKeys[answer - 1];

              if (optKey) {
                answer = parseInt(optKey.replace('option', ''));
              }
            }
          }

          prevAnswers[idx] = answer;
        }
      });

      // Only lock questions on resume (browser closed/reopened), NOT on F5/refresh
      if (isResumedExam && Object.keys(prevAnswers).length > 0) {
        const locked = {};

        data.batch.theory_exam_set.exam_sets_questions.forEach((q, idx) => {
          if (q.status === 'answered') {
            locked[idx] = true;
          }
        });
        setLockedQuestions(locked);
      }

      // Pre-populate not-answered data from previous session (visited but no answer)
      const prevNotAnswered = {};

      data.batch.theory_exam_set.exam_sets_questions.forEach((q, idx) => {
        if (q.status === 'visited') {
          prevNotAnswered[idx] = idx;
        }
      });
      setNotAnsweredData(prevNotAnswered);

      setAnswerData(prevAnswers);
      setSelectedOption(prevAnswers);

      // Don't pre-populate visitedQuestions — notVisited is calculated from answerData + notAnsweredData instead
    }

    // Set flag so F5 won't trigger resume mode again
    sessionStorage.setItem(sessionKey, '1');
  };

  useEffect(() => {
    // If capture_image_in_seconds is not set or 0, skip image capture entirely
    if (!captureImageInSeconds) return;

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

      setExamSubmitted(true);

      // router.push(getLocalizedUrl('/feedback', locale), {headers: {'Referrer': '/examination'}});
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

    setExamSubmitted(true);

    // router.push(getLocalizedUrl('/feedback', locale), {headers: {'Referrer': '/examination'}});

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

    // Locked questions (resume mode) don't need hold timer — user can't change answer anyway
    if (lockedQuestions[currentQuestionIndex]) {
      setHoldTimer(0);
    } else {
      const randomHold = Math.floor(Math.random() * 6) + 10;

      setHoldTimer(randomHold);
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (holdTimer <= 0) return;

    const intervalId = setInterval(() => {
      setHoldTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [holdTimer]);

  useEffect(() => {
    if (examData) {
      const total = examData.exam_sets_questions.length;
      const answered = Object.keys(answerData).length;
      const notAnswered = Object.keys(notAnsweredData).filter(k => !answerData.hasOwnProperty(k)).length;
      const notVisited = total - answered - notAnswered;

      setNotVisitedQuestions(notVisited >= 0 ? notVisited : 0);
    }
  }, [answerData, notAnsweredData, examData]);

  const submitQuestion = async (data) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-question-attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Assuming you're sending JSON data
      },
      body: JSON.stringify(data)
    });

    return res;
  };

  const handleNextQuestion = async (type) => {
    if (holdTimer > 0) return;

    const currentIdx = currentQuestionIndex;
    const isLocked = lockedQuestions[currentIdx];

    if (!isLocked) {
      // Only submit answer for unlocked questions
      const endTime = getFormattedTime();
      const submitData = [examData?.id, examData?.exam_sets_questions[currentIdx].question_id, selectedOption[currentIdx], [selectedOption[currentIdx] ? 1 : 0, startTime, endTime]];

      if (!selectedOption[currentIdx] || selectedOption[currentIdx] == null) {
        if (type === 'a' && !(currentIdx in markedQuestions) && !answerData.hasOwnProperty(currentIdx)) {
          setNotAnsweredData(prevData => ({ ...prevData, [currentIdx]: currentIdx }));
        }
      }

      submitQuestion(submitData);
    }

    if (currentIdx < (examData?.exam_sets_questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentIdx + 1);
    }

    setActiveStep(prevActiveStep => prevActiveStep + 1);
    setVisitedQuestions((prev) => ({ ...prev, [currentIdx]: currentIdx }));
  };

  const handlePreviousQuestion = async () => {
    if (holdTimer > 0) return;

    const currentIdx = currentQuestionIndex;
    const isLocked = lockedQuestions[currentIdx];

    if (!isLocked) {
      // Only submit answer for unlocked questions
      const endTime = getFormattedTime();
      const submitData = [examData?.id, examData?.exam_sets_questions[currentIdx].question_id, selectedOption[currentIdx], [selectedOption[currentIdx] ? 1 : 0, startTime, endTime]];

      if (!selectedOption[currentIdx] || selectedOption[currentIdx] == null) {
        if (!(currentIdx in markedQuestions) && !answerData.hasOwnProperty(currentIdx)) {
          setNotAnsweredData(prevData => ({ ...prevData, [currentIdx]: currentIdx }));
        }
      }

      submitQuestion(submitData);
    }

    setVisitedQuestions((prev) => ({ ...prev, [currentIdx]: currentIdx }));

    if (currentIdx > 0) {
      setCurrentQuestionIndex(currentIdx - 1);
    }

    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleJumpQuestion = async (index) => {
    if (holdTimer > 0) return;

    const currentIdx = currentQuestionIndex;
    const isLocked = lockedQuestions[currentIdx];

    if (!isLocked) {
      // Only submit answer for unlocked questions
      const endTime = getFormattedTime();
      const submitData = [examData?.id, examData?.exam_sets_questions[currentIdx].question_id, selectedOption[currentIdx], [selectedOption[currentIdx] ? 1 : 0, startTime, endTime]];

      if (!selectedOption[currentIdx] || selectedOption[currentIdx] == null) {
        if (!(currentIdx in markedQuestions) && !answerData.hasOwnProperty(currentIdx)) {
          setNotAnsweredData(prevData => ({ ...prevData, [currentIdx]: currentIdx }));
        }
      }

      submitQuestion(submitData);
    }

    setVisitedQuestions((prev) => ({ ...prev, [currentIdx]: currentIdx }));
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
        disabled={holdTimer > 0}
        endIcon={lockedQuestions[index] ? <i className='tabler-lock' /> : currentQuestionIndex === index ? <i className='tabler-point-filled text-primary' /> : null}
        onClick={() => holdTimer > 0 ? null : handleJumpQuestion(index)} // Set the index of the clicked question
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
    // Locked questions cannot be changed (exam resume mode)
    if (lockedQuestions[currentQuestionIndex]) return;

    setSelectedOption((prev) => ({ ...prev, [currentQuestionIndex]: value }));
    setVisitedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: currentQuestionIndex }));

    // Update answer data
    setAnswerData((prev) => ({
      ...prev,
      [currentQuestionIndex]: value,
    }));

    // Remove currentQuestionIndex from not-answered list (if it was previously visited without answer)
    setNotAnsweredData((prev) => {
      const newData = { ...prev };

      delete newData[currentQuestionIndex];

      return newData;
    });

    // Remove currentQuestionIndex from marked questions, because the answer has been selected
    setMarkedQuestions((prev) => {
      const newData = { ...prev };

      delete newData[currentQuestionIndex]; // Removes currentQuestionIndex from marked questions

      return newData;
    });

  };

  const handleMarkedQuestions = () => {
    if (holdTimer > 0) return;

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

  if(examSubmitted){
    return (<FeedBackPage />)
  }

  if(!isActiveExam){
    return (
      <div className='p-4'>
        <Alert severity='info'>
          <AlertTitle>Info</AlertTitle>
          The exam is not active at this moment.
        </Alert>
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
            {captureImageInSeconds > 0 && (
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
            )}
          </div>
        </Grid>
        <Grid item sm={12} md={7}>
          <Card>
            <CardHeader title={`Question ${activeStep + 1} of ${examData?.exam_sets_questions.length}`} />
            <CardContent>
              {format}
            </CardContent>
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
                          {holdTimer > 0 && (
                            <Grid item xs={12}>
                              <Typography color="warning.main" fontWeight={600}>
                                Next question available in {holdTimer} seconds
                              </Typography>
                            </Grid>
                          )}
                          {/* Lock badge — shown when exam is resumed after browser close */}
                          {lockedQuestions[currentQuestionIndex] && (
                            <Grid item xs={12}>
                              <Typography color="error" fontWeight={600}>
                                🔒 This question was already answered in a previous session and cannot be changed.
                              </Typography>
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            {/* RadioGroup for displaying options */}
                            <RadioGroup
                              value={answerData[currentQuestionIndex] || ""}
                              onChange={(e) => selectAnswer(e.target.value)}
                            >
                              {/*
                                Two rendering paths:
                                1. shuffled_options[] — backend created this when option_random=1.
                                   Each item has {id: originalOptionNumber, value: optionText}.
                                   Rendered in shuffled order; submits opt.id for correct grading.
                                2. Fallback — legacy path, renders option1-option5 in key order.
                              */}
                              {(question.shuffled_options || Object.keys(question.questions)
                                .filter(key => key.startsWith('option') && question.questions[key]))
                                .map((item, idx) => {
                                  // Determine the display value and label
                                  const optId = item.id != null ? item.id : idx + 1;
                                  const optLabel = item.value != null ? item.value : question.questions[item];

                                  return (
                                    <FormControlLabel
                                      key={`opt-${question.question_id}-${optId}`}
                                      value={optId} // Original option ID — grading compares against correct_answer
                                      disabled={lockedQuestions[currentQuestionIndex]}
                                      control={<Radio id={`option-${question.question_id}-${optId}`} />}
                                      name={`questionAnswer[${question.question_id}][]`}
                                      label={optLabel}
                                    />
                                  );
                                })}
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
                    <Button onClick={handlePreviousQuestion} disabled={activeStep === 0 || holdTimer > 0}>Previous</Button>
                    <Button onClick={() => handleNextQuestion("a")} disabled={currentQuestionIndex === (examData?.exam_sets_questions.length || 0) - 1 || holdTimer > 0}>
                      Next
                    </Button>

                  </ButtonGroup>
                </Grid>
                <Grid item>
                  <ButtonGroup variant='contained'>
                    <Button
                      onClick={handleMarkedQuestions}
                      color="warning"
                      disabled={holdTimer > 0}
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
