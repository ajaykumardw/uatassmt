// "use client"

// import { Grid } from "@mui/material";

// const FeedBackPage = () => {

//   return (
//     <div className='p-4'>
//       <Grid container spacing={6}>
//         <Grid item xs={12}>
//           Feedback Page
//         </Grid>
//         <Grid item sm={12} md={7}>
//           Thank you!!
//         </Grid>
//       </Grid>
//     </div>
//   );

// }

// export default FeedBackPage


"use client";

import { useEffect } from "react";

import { Grid } from "@mui/material";

const FeedBackPage = () => {

  useEffect(() => {
    // Push a new state so back button doesn't immediately go to previous page
    history.pushState(null, "", location.href);

    const handleBack = () => {
      // When user presses back → close window
      window.close();
    };

    // Listen to back/forward
    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, []);


  return (
    <div className='p-4'>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          Feedback Page
        </Grid>
        <Grid item sm={12} md={7}>
          Thank you!!
        </Grid>
      </Grid>
    </div>
  );

}

export default FeedBackPage;
