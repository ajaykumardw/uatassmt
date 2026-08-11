// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { questions } from '@prisma/client'

// Component Imports
import VivaQuestionsListTable from './VivaQuestionsListTable'

// import UserListCards from './UserListCards'

const QuestionsList = ({ questionsData, languages, updateQuestionsList }: { questionsData?: questions[], languages?: any[], updateQuestionsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <VivaQuestionsListTable tableData={questionsData} languages={languages} updateQuestionsList={updateQuestionsList} />
      </Grid>
    </Grid>
  )
}

export default QuestionsList
