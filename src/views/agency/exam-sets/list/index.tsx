// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { exam_sets } from '@prisma/client'

import ExamSetsListTable from './ExamSetsListTable'

// import UserListCards from './UserListCards'

const ExamSetsList = ({ questionsData, updateExamSetsList }: { questionsData?: exam_sets[], updateExamSetsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <ExamSetsListTable tableData={questionsData} updateExamSetsList={updateExamSetsList} />
      </Grid>
    </Grid>
  )
}

export default ExamSetsList
