'use client'; // This ensures the component runs on the client side

import React, { useEffect, useState } from 'react';

import { Card, CardHeader, CardContent, Typography, Button, CardActions, Alert, AlertTitle } from "@mui/material";

import Grid from "@mui/material/Grid";

import CustomIconButton from '@/@core/components/mui/IconButton';


const Buttons = () => {
  return (
    <div className='flex gap-2 flex-wrap'>
      {Array.from({ length: 50 }, (_, index) => (
        <CustomIconButton size='small' color={index===0 ? 'primary' : 'secondary'} variant='tonal' key={`i-${index}`}>{index + 1}</CustomIconButton>
      ))}
    </div>
  )
}

const Examination: React.FC = () => {

  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds (3600 seconds)

  useEffect(() => {
    // If the timer reaches zero, we stop the countdown
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    // Cleanup interval on component unmount or when the timer reaches zero
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Calculate hours, minutes, and seconds from the timeLeft in seconds
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  // Determine color based on remaining time
  const getColor = () => {
    if (timeLeft <= 600) return 'text-error';   // Less than 10 minutes
    if (timeLeft <= 1800) return 'text-warning'; // Between 10 to 30 minutes

    return 'text-success';  // More than 30 minutes
  };

  // useEffect(() => {
  //   // Disable right-click (context menu)
  //   const disableRightClick = (e: MouseEvent) => {
  //     e.preventDefault();
  //   };

  //   // Disable F5, Ctrl+R, Cmd+R, and other reload shortcuts
  //   const disableReloadShortcuts = (e: KeyboardEvent) => {
  //     // Detect F5, Ctrl+R, Cmd+R, and others
  //     if (
  //       e.key === 'F5' ||
  //       (e.ctrlKey && e.key === 'r') ||
  //       (e.metaKey && e.key === 'r') ||
  //       (e.ctrlKey && e.key === 'R') ||
  //       (e.metaKey && e.key === 'R')
  //     ) {
  //       e.preventDefault();
  //     }
  //   };

  //   // Prevent page reload via the "beforeunload" event (in most browsers)
  //   const preventPageReload = (e: BeforeUnloadEvent) => {
  //     e.preventDefault();
  //     e.returnValue = ''; // Chrome requires this for blocking the action
  //   };

  //   // Add event listeners
  //   document.addEventListener('contextmenu', disableRightClick); // Disable right-click
  //   document.addEventListener('keydown', disableReloadShortcuts); // Disable reload shortcuts
  //   window.addEventListener('beforeunload', preventPageReload); // Disable reload on refresh or back

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



  return (
    <div className='p-4'>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Alert severity='error'>
            <AlertTitle>Warning</AlertTitle>
            Do Not Press Back/Refresh Button
          </Alert>
        </Grid>
        <Grid item xs={12} sm={7}>
          <Card>
            <CardHeader title="Question 1 of 50" />
            <CardContent>
              <Typography variant='h4'>Where Was The Universal Life Policy Introduced First?</Typography>
            </CardContent>
            <CardActions>
              <Button variant="contained">
                Start Exam
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} sm={5}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Time Status" />
                <CardContent>
                  <Typography variant="h2" component="div" className={getColor()}>
                    {/* Display hours:minutes:seconds with leading zeros */}
                    {String(hours).padStart(2, '0')}:
                    {String(minutes).padStart(2, '0')}:
                    {String(seconds).padStart(2, '0')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Total Time" />
                <CardContent>
                  <Typography variant="h2" component="div">
                    {/* Display hours:minutes:seconds with leading zeros */}
                    00:60:00 (hh:mm:ss)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Summary" />
                <CardContent>
                  <Buttons />
                </CardContent>
                {/* <CardActions>
                  <Button variant="contained">
                    Start Exam
                  </Button>
                </CardActions> */}
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Examination;
