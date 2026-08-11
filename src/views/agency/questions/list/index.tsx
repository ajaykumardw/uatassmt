// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import QuestionsListTable from './QuestionsListTable'

import type { SSCType } from '@/types/sectorskills/sscType'


// import UserListCards from './UserListCards'

const QuestionsList = ({ questionsData, languages, updateQuestionsList }: { questionsData?: SSCType[], languages?: any[], updateQuestionsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <QuestionsListTable tableData={questionsData} languages={languages} updateQuestionsList={updateQuestionsList} />
      </Grid>
    </Grid>
  )
}

export default QuestionsList
