'use client'; // This ensures the component runs on the client side

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { Card, CardHeader, CardContent, Typography, Button, CardActions, Divider } from "@mui/material";

import Grid from "@mui/material/Grid";

import type { batches, exam_sets, student_exam_set_results } from '@prisma/client';

import { format } from 'date-fns';

import type { Locale } from '@configs/i18n'

import { getLocalizedUrl } from "@/utils/i18n";
import DefaultExamInstructions from '@/components/DefaultExamInstructions';

const ExamTest = () => {
  const { lang: locale } = useParams();
  const [isClient, setIsClient] = useState(false);
  const [examSet, setExamSet] = useState<exam_sets | null>(null);
  const [batchData, setBatchData] = useState<batches | null>(null);
  const [studentExamResults, setStudentExamResults] = useState< student_exam_set_results | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(0)

  const getExamInstructions = async () => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-exam-set`).then(function (res) { return res.json() });

    setBatchData(data.batch);
    setStudentExamResults(
      data.exam_set_results ?
        data.exam_set_results.find((studentResult: student_exam_set_results) => studentResult.exam_set_id === data.batch.theory_exam_set_id)
        : null
    );

    setExamSet(data.batch.theory_exam_set);

  }

  useEffect(() => {
    console.log('studentExamResults updated:', studentExamResults);
  }, [studentExamResults])

  useEffect(() => {
    console.log('remainingAttempts updated:', remainingAttempts);
  }, [remainingAttempts])

  useEffect(() => {

    if(batchData?.login_restrict && studentExamResults?.total_attempts){
      setRemainingAttempts(batchData.login_restrict - studentExamResults.total_attempts <= 0 ? 0 : batchData.login_restrict - studentExamResults.total_attempts)
    } else if(batchData?.login_restrict) {
      setRemainingAttempts(batchData.login_restrict)
    }

  }, [batchData, studentExamResults])

  const [currentTime, setCurrentTime] = useState<Date>();

  useEffect(() => {
    const interval = setInterval(() => {
      if (batchData && batchData?.assessment_start_datetime) {
        const now = new Date();

        // Update the current time state
        setCurrentTime(now); // Update current time in Asia/Kolkata timezone
      }
    }, 1000); // Update every second

    return () => clearInterval(interval); // Clean up the interval when the component unmounts
  }, [batchData]);

  // Set isClient to true once the component has mounted on the client-side
  useEffect(() => {
    setIsClient(true);
    getExamInstructions();
  }, []);

  const handleStartExam = (url: string) => {
    if (typeof window !== "undefined") {
      // Open a new window with the given URL, and additional window options
      const newWindow = window.open(url, '_blank', "width=" + window.screen.availWidth + ",height=" + window.screen.availHeight + ",toolbar=1,location=0,scrollbars=no,resizable=no");

      // Check if the window opened successfully
      if (newWindow) {
        // Disable right-click and context menu in the new window
        newWindow.document.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });

        // Disable text selection in the new window
        newWindow.document.body.style.userSelect = 'none';

        // Disable certain keyboard shortcuts like F12 (inspect) and Ctrl+Shift+I, Ctrl+Shift+J
        newWindow.document.addEventListener('keydown', (e) => {
          // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, F1 (help)
          if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || e.key === 'F1') {
            e.preventDefault();
          }
        });

        // Disable resizing the window (it's already in the `window.open()` options, but you can reinforce it)
        // newWindow.resizeTo(1024, 750);
      } else {
        alert('Popup blocked. Please allow popups for this site.');
      }
    }
  };

  // Ensure the code below only runs client-side
  if (!isClient) {
    return null; // Return nothing while waiting for the component to mount
  }

  // Construct the exam page URL dynamically based on the current locale
  const examPageUrl = window.location.origin + getLocalizedUrl('/examination', locale as Locale);

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Exam" />
          <CardContent>
            <Typography variant='h5' className='mbe-2'>
              {examSet?.set_name}
            </Typography>
            <Grid container>
              <Grid item xs={12} sm={6} className='flex flex-col pie-5 gap-[26px]'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-clock text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Exam Duration: {examSet?.exam_duration} Minutes</Typography>
                </div>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-calendar-time text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Exam Start Date Time: {batchData?.assessment_start_datetime ? format(batchData.assessment_start_datetime, 'dd-LL-yyyy hh:mm:ss a') : ""}</Typography>
                </div>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-calendar-time text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Current Date Time: {currentTime ? format(currentTime, 'dd-LL-yyyy hh:mm:ss a') : ""}</Typography>
                </div>
              </Grid>
              <Grid item xs={12} sm={6} className='flex flex-col max-sm:mbs-[26px] sm:pis-5 sm:border-is gap-[26px]'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-align-left text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Total Questions: {examSet?.total_questions}</Typography>
                </div>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-calendar-time text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Exam End Date Time: {batchData?.assessment_end_datetime ? format(batchData.assessment_end_datetime, 'dd-LL-yyyy hh:mm:ss a') : ""}</Typography>
                </div>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-calendar-time text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Remaining Attempts: {remainingAttempts}</Typography>
                </div>
              </Grid>
            </Grid>
            <Divider className='mbs-7 mbe-7' />
            <Typography variant='h5' className='mbe-2'>Instructions</Typography>
            <Grid item xs={12}>{examSet?.instruction || <DefaultExamInstructions /> }</Grid>

          </CardContent>
          {examSet && remainingAttempts > 0 && batchData?.assessment_start_datetime && new Date(batchData?.assessment_start_datetime) <= new Date() &&
            batchData?.assessment_end_datetime && new Date() <= new Date(batchData?.assessment_end_datetime) && (
              <CardActions>
                <Button variant="contained" onClick={() => handleStartExam(examPageUrl)}>
                  {batchData.login_restrict && remainingAttempts < batchData.login_restrict ? 'Resume Exam' : 'Start Exam'}
                </Button>
              </CardActions>
            )
          }

        </Card>
      </Grid>
    </Grid>
  );
}

export default ExamTest;
