import Link from "next/link"
import { Breadcrumbs, Typography } from "@mui/material"

const CreateFeedbackFormPage = () => {
  return (
    <div>
      <Breadcrumbs>
        <Link href="/">
          <i className="tabler-smart-home mr-1" />
          Dashboard
        </Link>
        <Link href="/feedback-forms/list">
          Feedback Forms
        </Link>
        <Typography>
          Create
        </Typography>
      </Breadcrumbs>
      <h1>Create Feedback Form Page</h1>
      {/* Add your form creation components here */}
    </div>
  )
}

export default CreateFeedbackFormPage
