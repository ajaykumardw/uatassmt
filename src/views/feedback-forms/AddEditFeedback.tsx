"use client";

import { useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { Controller, useFieldArray, useForm } from "react-hook-form";

import { toast } from "react-toastify";

import { valibotResolver } from "@hookform/resolvers/valibot";

import { object, string, minLength, array, pipe } from "valibot";

// Mui
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Button,
  MenuItem,
  Typography
} from "@mui/material";

import CustomTextField from "@core/components/mui/TextField";

import { FeedbackFormTypes, QuestionTypes } from "@/configs/customDataConfig";

/* ------------------ Validation Schema ------------------ */

const QuestionSchema = object({
  question: pipe(string(), minLength(1, "Question is required")),
  question_type: pipe(string(), minLength(1, "Type required")),
  option1: string(),
  option2: string(),
  option3: string(),
  option4: string()
});

const formSchema = object({
  form_name: pipe(string(), minLength(1, "Name required")),
  form_type: pipe(string(), minLength(1, "Type required")),
  questions: array(QuestionSchema)
});

/* ------------------ Component ------------------ */

export default function AddEditFeedbackForm() {
  
  // const router = useRouter();
  
  const searchParams = useSearchParams();

  const editId = searchParams.get("id"); // if exists → edit mode

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(formSchema),
    defaultValues: {
      form_name: "",
      form_type: "",
      questions: [
        { question: "", question_type: "1", option1: "", option2: "", option3: "", option4: "" }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });

  /* ------------ Load for EDIT Mode ------------ */
  useEffect(() => {
    if (!editId) return;

    (async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback_forms/${editId}`);
      const data = await res.json();

      reset({
        form_name: data.form_name,
        form_type: data.form_type.toString(),
        questions: data.feedback_questions
      });
    })();
  }, [editId, reset]);

  /* ------------------ Save Handler ------------------ */

  const onSubmit = async (data: any) => {
    const method = editId ? "PUT" : "POST";

    console.log("Submitting data:", data);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback_forms${editId ? "/" + editId : ""}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      toast.success(editId ? "Feedback Form Updated" : "Feedback Form Created");
      
      // router.push("/feedback/forms");
    } else {
      toast.error("Failed to save");
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant="h6">
            {editId ? "Edit Feedback Form" : "Add Feedback Form"}
          </Typography>
        }
      />

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            {/* ---------------- Form Name ---------------- */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="form_name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    label="Form Name"
                    fullWidth
                    error={!!errors.form_name}
                    helperText={errors.form_name?.message}
                  />
                )}
              />
            </Grid>

            {/* ---------------- Form Type ---------------- */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="form_type"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Form Type"
                    error={!!errors.form_type}
                    helperText={errors.form_type?.message}
                  >
                    {Object.entries(FeedbackFormTypes).map(([key, value]) => (
                      <MenuItem key={key} value={key.toString()}>
                        {value}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* ---------------- Questions ---------------- */}
            <Grid item xs={12}>
              <Typography variant="h6" className="mb-4">
                Questions
              </Typography>
            </Grid>

            {fields.map((field, index) => {
              const questionType = watch(`questions.${index}.question_type`);
              
              return (
                <Grid item xs={12} key={field.id} container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name={`questions.${index}.question`}
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          fullWidth
                          label={`Question ${index + 1}`}
                          error={!!errors.questions?.[index]?.question}
                          helperText={errors.questions?.[index]?.question?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Controller
                      name={`questions.${index}.question_type`}
                      control={control}
                      render={({ field }) => (
                        <CustomTextField {...field} select fullWidth label="Type">
                          {Object.entries(QuestionTypes).map(([key, value]) => (
                            <MenuItem key={key} value={key.toString()}>
                              {value}
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </Grid>

                  {questionType === "1" ? (<>
                    <Grid item xs={12}>
                      <Controller
                        name={`questions.${index}.option1`}
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} fullWidth label="Option 1" value="Yes" disabled InputProps={{
                            readOnly: true
                          }} />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller
                        name={`questions.${index}.option2`}
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} fullWidth label="Option 2" value="No" />
                        )}
                      />
                    </Grid>
                  </>)
                  : (<>

                    {/* Options (only for MCQ) */}
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`questions.${index}.option1`}
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} fullWidth label="Option 1" />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`questions.${index}.option2`}
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} fullWidth label="Option 2" />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`questions.${index}.option3`}
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} fullWidth label="Option 3" />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`questions.${index}.option4`}
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} fullWidth label="Option 4" />
                        )}
                      />
                    </Grid>
                  </>)}
                </Grid>
              )
            })}

            {/* Add Question button */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() =>
                  append({
                    question: "",
                    question_type: "1",
                    option1: "",
                    option2: "",
                    option3: "",
                    option4: ""
                  })
                }
              >
                Add Question
              </Button>
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Button variant="contained" type="submit">
                {editId ? "Update Form" : "Create Form"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
