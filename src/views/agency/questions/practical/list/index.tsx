// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { questions } from '@prisma/client'

import PracticalQuestionsListTable from './PracticalQuestionsListTable'

// import UserListCards from './UserListCards'

const QuestionsList = ({ questionsData, languages, updateQuestionsList }: { questionsData?: questions[], languages?: any[], updateQuestionsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <PracticalQuestionsListTable tableData={questionsData} languages={languages} updateQuestionsList={updateQuestionsList} />
      </Grid>
    </Grid>
  )
}

export default QuestionsList
