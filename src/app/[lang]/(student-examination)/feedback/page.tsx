"use client";

// import { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   Grid,
//   Typography,
//   TextField,
//   Button,
//   RadioGroup,
//   FormControlLabel,
//   Radio,
//   FormHelperText,
//   Skeleton,
// } from "@mui/material";
// import { useForm, Controller } from "react-hook-form";
// import { feedback_forms, feedback_questions } from "@prisma/client";
// import { FeedbackFormTypes } from "@/configs/customDataConfig";
// import SuccessAnimation from "@/components/SuccessAnimation";

// type FeedbackFormWithQuestions = feedback_forms & {
//   feedback_questions: feedback_questions[];
// };

const FeedBackPage = () => {

  return <div>Feedback Page Disabled Temporarily</div>;

  // const [feedbackForm, setFeedbackForm] =
  //   useState<FeedbackFormWithQuestions | null>(null);

  // const [loading, setLoading] = useState(true);
  // const [submitted, setSubmitted] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const [allowed, setAllowed] = useState<boolean | null>(null);

  // useEffect(() => {
  //   const ref = document.referrer;

  //   console.log("Referrer:", ref);

  //   // Allow only if user came from exam page
  //   if (ref && ref.includes("/examination")) {
  //     setAllowed(true);
  //   } else {
  //     setAllowed(false);
  //   }
  // }, []);

  // // Back prevent
  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   history.pushState(null, "", location.href);

  //   const handleBack = () => window.close();

  //   window.addEventListener("popstate", handleBack);

  //   return () => window.removeEventListener("popstate", handleBack);
  // }, []);

  // // Fetch
  // const fetchFeedbackForm = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/feedback_forms?type=candidate`
  //     );
  //     if (!res.ok) throw new Error("Failed to fetch feedback form");

  //     const data = await res.json();
  //     setFeedbackForm(data.feedbackForm ?? null);
  //   } catch (err: any) {
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchFeedbackForm();
  // }, []);

  // // Form Setup
  // const {
  //   control,
  //   handleSubmit,
  //   formState: { errors }
  // } = useForm();

  // const onSubmit = async (formData: any) => {
  //   if (!feedbackForm) return;

  //   const answers = feedbackForm.feedback_questions.map((q) => ({
  //     question_id: q.id,
  //     answer: formData[`question_${q.id}`],
  //   }));

  //   const userType = +Object.keys(FeedbackFormTypes)
  //     .find(key => FeedbackFormTypes[+key] === "Candidate")!;

  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/feedback-responses`,
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           feedback_form_id: feedbackForm.id,
  //           user_type: userType,
  //           answers,
  //         }),
  //       }
  //     );

  //     if (!res.ok) throw new Error("Failed to submit feedback");

  //     setSubmitted(true);
  //   } catch (err: any) {
  //     setError(err.message);
  //   }
  // };

  // if (allowed === false) {
  //   return (
  //     <div className="p-4 flex justify-center">
  //       <Card className="p-6">
  //         <Typography variant="h6" color="error">
  //           Access Denied — You can only open this feedback form after completing the examination.
  //         </Typography>
  //       </Card>
  //     </div>
  //   );
  // }

  // if (submitted) {
  //   return (
  //     <div className="p-4 flex justify-center h-screen items-center">
  //       <Card className="p-6">
  //         <SuccessAnimation />

  //         {/* Optional success text */}
  //         <Typography variant="h6">Feedback submitted successfully!</Typography>
  //       </Card>
  //     </div>
  //   );
  // }

  // if (loading){
  //   return (
  //     <Skeleton variant="rectangular">
  //       <Card></Card>
  //     </Skeleton>
  //   );
  // }
  // if (error)
  //   return (
  //     <Typography color="error" className="p-4">
  //       {error}
  //     </Typography>
  //   );

  // return (
  //   <div className="p-4 flex justify-center">
  //     <Card className="w-full max-w-3xl">
  //       <CardContent>
  //         <form onSubmit={handleSubmit(onSubmit)}>
  //           <Grid container spacing={4}>
  //             <Grid item xs={12}>
  //               <Typography variant="h6">{feedbackForm?.form_name}</Typography>
  //             </Grid>

  //             {/* ========================================
  //               QUESTIONS
  //             ======================================== */}
  //             {feedbackForm?.feedback_questions?.map((q, index) => (
  //               <Grid item xs={12} key={q.id}>
  //                 <Typography className="mb-2">
  //                   {index + 1}. {q.question}
  //                 </Typography>

  //                 {/* YES / NO QUESTION */}
  //                 {q.question_type === 1 && (
  //                   <Controller
  //                     name={`question_${q.id}`}
  //                     control={control}
  //                     rules={{ required: "This question is required" }}
  //                     render={({ field }) => (
  //                       <>
  //                         <RadioGroup row {...field}>
  //                           <FormControlLabel
  //                             value="Yes"
  //                             control={<Radio />}
  //                             label="Yes"
  //                           />
  //                           <FormControlLabel
  //                             value="No"
  //                             control={<Radio />}
  //                             label="No"
  //                           />
  //                         </RadioGroup>

  //                         {errors[`question_${q.id}`] && (
  //                           <FormHelperText error>
  //                             {errors[`question_${q.id}`]?.message as string}
  //                           </FormHelperText>
  //                         )}
  //                       </>
  //                     )}
  //                   />
  //                 )}

  //                 {/* MULTIPLE CHOICE QUESTION */}
  //                 {q.question_type === 2 && (
  //                   <Controller
  //                     name={`question_${q.id}`}
  //                     control={control}
  //                     rules={{ required: "Please select an option" }}
  //                     render={({ field }) => (
  //                       <>
  //                         <RadioGroup row {...field}>
  //                           {q.option1 && (
  //                             <FormControlLabel
  //                               value={q.option1}
  //                               control={<Radio />}
  //                               label={q.option1}
  //                             />
  //                           )}
  //                           {q.option2 && (
  //                             <FormControlLabel
  //                               value={q.option2}
  //                               control={<Radio />}
  //                               label={q.option2}
  //                             />
  //                           )}
  //                           {q.option3 && (
  //                             <FormControlLabel
  //                               value={q.option3}
  //                               control={<Radio />}
  //                               label={q.option3}
  //                             />
  //                           )}
  //                           {q.option4 && (
  //                             <FormControlLabel
  //                               value={q.option4}
  //                               control={<Radio />}
  //                               label={q.option4}
  //                             />
  //                           )}
  //                         </RadioGroup>

  //                         {errors[`question_${q.id}`] && (
  //                           <FormHelperText error>
  //                             {errors[`question_${q.id}`]?.message as string}
  //                           </FormHelperText>
  //                         )}
  //                       </>
  //                     )}
  //                   />
  //                 )}
  //               </Grid>
  //             ))}

  //             {/* Submit */}
  //             <Grid item xs={12}>
  //               <Button type="submit" variant="contained" color="primary">
  //                 Submit Feedback
  //               </Button>
  //             </Grid>
  //           </Grid>
  //         </form>
  //       </CardContent>
  //     </Card>
  //   </div>
  // );
};

export default FeedBackPage;
