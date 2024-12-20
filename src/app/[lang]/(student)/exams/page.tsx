'use client'; // This ensures the component runs on the client side

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent, Typography, Button, CardActions } from "@mui/material";
import Grid from "@mui/material/Grid";

import type { Locale } from '@configs/i18n'
import { getLocalizedUrl } from "@/utils/i18n";

const ExamTest = () => {
  const { lang: locale } = useParams();
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once the component has mounted on the client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartExam = (url: string) => {
    if (typeof window !== "undefined") {
      // Open a new window with the given URL, and additional window options
      const newWindow = window.open(url, '_blank', "width=1024,height=750,toolbar=0,location=0,scrollbars=no,resizable=no");

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
        newWindow.resizeTo(1024, 750);
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

  console.log("examPageUrl", examPageUrl);

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Exam Instructions" />
          <CardContent>
            <Typography>sdgagag</Typography>
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
