"use client"

import Link from "next/link"

import { Breadcrumbs, Typography } from "@mui/material"

import AddEditFeedback from "@/views/feedback-forms/AddEditFeedback"

const EditFeedbackFormPage = ({ params }: { params: { id: string } }) => {

  const id = params.id;

  return (
    <div>
      <Breadcrumbs className="mb-4">
        <Link href="/" className="flex">
          <i className="tabler-smart-home mr-1" />
          Dashboard
        </Link>
        <Link href="/feedback-forms/list">
          Feedback Forms
        </Link>
        <Typography>
          Edit
        </Typography>
      </Breadcrumbs>
      <AddEditFeedback id={id} />
      {/* Add your form creation components here */}
    </div>
  )
}

export default EditFeedbackFormPage
