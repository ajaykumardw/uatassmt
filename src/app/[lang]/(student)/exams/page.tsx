'use client'; // This ensures the component runs on the client side

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { Card, CardHeader, CardContent, Typography, Button, CardActions, Divider } from "@mui/material";

import Grid from "@mui/material/Grid";

import type { exam_sets } from '@prisma/client';

import type { Locale } from '@configs/i18n'

import { getLocalizedUrl } from "@/utils/i18n";

const ExamTest = () => {
  const { lang: locale } = useParams();
  const [isClient, setIsClient] = useState(false);
  const [examSet, setExamSet] = useState<exam_sets | null>(null);

  const getExamInstructions = async() => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-exam-set`).then(function(res){return res.json()});

    setExamSet(data.batch.exam_set);

    console.log("data", data);
  }

  // Set isClient to true once the component has mounted on the client-side
  useEffect(() => {
    setIsClient(true);
    getExamInstructions();
  }, []);

  const handleStartExam = (url: string) => {
    if (typeof window !== "undefined") {
      // Open a new window with the given URL, and additional window options
      const newWindow = window.open(url, '_blank', "width="+window.screen.availWidth+",height="+window.screen.availHeight+",toolbar=1,location=0,scrollbars=no,resizable=no");

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
                {/* <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-user text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Access all Features</Typography>
                </div> */}
              </Grid>
              <Grid item xs={12} sm={6} className='flex flex-col max-sm:mbs-[26px] sm:pis-5 sm:border-is gap-[26px]'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-align-left text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Total Questions: {examSet?.total_questions}</Typography>
                </div>
                {/* <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-user text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Lifetime Free Update</Typography>
                </div> */}
              </Grid>
            </Grid>
            <Divider className='mbs-7 mbe-7' />
            <Typography variant='h5' className='mbe-2'>Instruction</Typography>
            <Typography color='text.secondary'>
              {examSet?.instruction ? examSet?.instruction : "Here, I focus on a range of items and features that we use in life without giving them a second thought such as Coca Cola, body muscles and holding ones own breath. Though, most of these notes are not fundamentally necessary, they are such that you can use them for a good laugh, at a drinks party or for picking up women or men."}
            </Typography>
          </CardContent>
          <CardActions>
            {/* Pass the URL as a string */}
            <Button variant="contained" onClick={() => handleStartExam(examPageUrl)}>
              Start Exam
            </Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
}

export default ExamTest;
