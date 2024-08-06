// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import QuestionsListTable from './QuestionsListTable'

import type { SSCType } from '@/types/sectorskills/sscType'


// import UserListCards from './UserListCards'

const QuestionsList = ({ questionsData, updateQuestionsList }: { questionsData?: SSCType[], updateQuestionsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <QuestionsListTable tableData={questionsData} updateQuestionsList={updateQuestionsList} />
      </Grid>
    </Grid>
  )
}

export default QuestionsList
