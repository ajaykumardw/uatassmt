"use client";

import React, { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import {
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Skeleton,
  CardHeader,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";

import type { feedback_forms, feedback_questions } from "@prisma/client";

// import { FeedbackFormTypes } from "@/configs/customDataConfig";

import SuccessAnimation from "@/components/SuccessAnimation";
import SignaturePad from "@/components/SignaturePad";

type FeedbackFormWithQuestions = feedback_forms & {
  feedback_questions: feedback_questions[];
};

const FeedBackPage = () => {
  const [feedbackForm, setFeedbackForm] =
    useState<FeedbackFormWithQuestions | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // Back prevent
  useEffect(() => {
    if (typeof window === "undefined") return;

    history.pushState(null, "", location.href);

    const handleBack = () => window.close();

    window.addEventListener("popstate", handleBack);

    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  // Fetch
  const fetchFeedbackForm = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback_forms?type=candidate`
      );

      const data = await res.json();

      console.log("data: ", data);
      console.log("data: ", data);

      if (!res.ok) throw new Error("Failed to fetch feedback form");


      setFeedbackForm(data.feedbackForm ?? null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackForm();
  }, []);

  // Form Setup
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (formData: any) => {
    if (!feedbackForm) return;

    // const answers = feedbackForm.feedback_questions.map((q) => ({
    //   question_id: q.id,
    //   answer: formData[`question_${q.id}`],
    //   isFile: true,
    // }));

    const answers: any[] = []

    const formDataPayload = new FormData()

    feedbackForm.feedback_questions.forEach((q) => {

      const value =
        formData[`question_${q.id}`]

      if (value instanceof File) {

        answers.push({

          question_id: q.id,

          answer: null,

          isFile: true

        })

        formDataPayload.append(

          `file_${q.id}`,

          value

        )

      } else {

        answers.push({

          question_id: q.id,

          answer: value || "",

          isFile: false

        })

      }

    })


    // const formDataPayload = new FormData();

    // answers.forEach((ans, index) => {
    //   formDataPayload.append(`answers[${index}][question_id]`, ans.question_id.toString());
    //   formDataPayload.append(`answers[${index}][answer]`, ans.answer);
    //   formDataPayload.append(`answers[${index}][isFile]`, ans.isFile.toString());

    //   if (ans.answer instanceof File) {
    //     formDataPayload.append(`file_[${index}][question_id]`, ans.answer);
    //   }
    // });

    formDataPayload.append("feedback_form_id", feedbackForm.id.toString());
    formDataPayload.append("answers", JSON.stringify(answers));

    console.log("answers", answers);

    // return;

    // const userType = +Object.keys(FeedbackFormTypes)
    //   .find(key => FeedbackFormTypes[+key] === "Candidate")!;

    try {
      // const res = await fetch(
      //   `${process.env.NEXT_PUBLIC_API_URL}/feedback-responses`,
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       feedback_form_id: feedbackForm?.id,
      //       user_type: userType,
      //       answers,
      //     }),
      //   }
      // );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students/feedback`,
        {
          method: "POST",
          headers: {
            // "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: formDataPayload,
        }
      );

      const resData = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(resData.message)
      }

      // if (!res.ok) throw new Error("Failed to submit feedback");

      // setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 flex justify-center h-screen items-center">
        <Card className="p-6">
          <SuccessAnimation />

          {/* Optional success text */}
          <Typography variant="h6">Feedback submitted successfully!</Typography>
          <Button onClick={() => window.close()} variant="contained" className="mt-4">Close Window</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader title={<Skeleton width={400} />} />
          <CardContent>
            <Grid container spacing={4}>
              {Array.from({ length: 10 }).map((_, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12}>
                    <Skeleton variant="rounded" />
                  </Grid>
                  <Grid item xs={12}>
                    <div className="flex gap-4">
                      <Skeleton variant="rounded" width={100} />
                      <Skeleton variant="rounded" width={100} />
                    </div>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error)
    return (
      <Typography color="error" className="p-4">
        {error}
      </Typography>
    );

  return (
    <div className="p-4 flex flex-col justify-center items-center gap-4">
      <div className="flex items-center">
        <SuccessAnimation size={30} />
        <Typography variant="h6">The exam was submitted successfully. Please fill out the feedback form to complete the exam.</Typography>
      </div>
      <Card className="w-full max-w-3xl">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6">{feedbackForm?.form_name}</Typography>
              </Grid>

              {/* ========================================
                QUESTIONS
              ======================================== */}
              {feedbackForm?.feedback_questions?.filter(q => q.question_type !== 4).map((q, index) => (
                <Grid item xs={12} key={q.id}>
                  <Typography className="mb-2">
                    {index + 1}. {q.question}
                  </Typography>

                  {/* YES / NO QUESTION */}
                  {q.question_type === 1 && (
                    <Controller
                      name={`question_${q.id}`}
                      control={control}
                      rules={{ required: "This question is required" }}
                      render={({ field }) => (
                        <>
                          <RadioGroup row {...field}>
                            <FormControlLabel
                              value="Yes"
                              control={<Radio />}
                              label="Yes"
                            />
                            <FormControlLabel
                              value="No"
                              control={<Radio />}
                              label="No"
                            />
                          </RadioGroup>

                          {errors[`question_${q.id}`] && (
                            <FormHelperText error>
                              {errors[`question_${q.id}`]?.message as string}
                            </FormHelperText>
                          )}
                        </>
                      )}
                    />
                  )}

                  {/* MULTIPLE CHOICE QUESTION */}
                  {q.question_type === 2 && (
                    <Controller
                      name={`question_${q.id}`}
                      control={control}
                      rules={{ required: "Please select an option" }}
                      render={({ field }) => (
                        <>
                          <RadioGroup row {...field}>
                            {q.option1 && (
                              <FormControlLabel
                                value={q.option1}
                                control={<Radio />}
                                label={q.option1}
                              />
                            )}
                            {q.option2 && (
                              <FormControlLabel
                                value={q.option2}
                                control={<Radio />}
                                label={q.option2}
                              />
                            )}
                            {q.option3 && (
                              <FormControlLabel
                                value={q.option3}
                                control={<Radio />}
                                label={q.option3}
                              />
                            )}
                            {q.option4 && (
                              <FormControlLabel
                                value={q.option4}
                                control={<Radio />}
                                label={q.option4}
                              />
                            )}
                          </RadioGroup>

                          {errors[`question_${q.id}`] && (
                            <FormHelperText error>
                              {errors[`question_${q.id}`]?.message as string}
                            </FormHelperText>
                          )}
                        </>
                      )}
                    />
                  )}
                </Grid>
              ))}

              {feedbackForm?.feedback_questions?.filter((q) => q.question_type === 4).map((q) => (
                <Grid item xs={12} key={q.id}>
                  <Typography className="mb-2">
                    {q.question}
                  </Typography>

                  <Controller
                    name={`question_${q.id}`}
                    control={control}

                    rules={{
                      required: "Signature required"
                    }}

                    render={({ field }) => (

                      <SignaturePad
                        value={field.value}
                        onChange={(file) => field.onChange(file)}
                        error={errors[`question_${q.id}`]?.message as string}
                      />

                    )}
                  />
                </Grid>
              ))}

              {/* Submit */}
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Submit Feedback
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedBackPage;
