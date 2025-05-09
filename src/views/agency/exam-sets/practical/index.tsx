// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { exam_sets } from '@prisma/client'

import PracticalExamSetsListTable from './PracticalExamSetsListTable'

// import UserListCards from './UserListCards'

const PracticalExamSetsList = ({ questionsData, updateExamSetsList }: { questionsData?: exam_sets[], updateExamSetsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <PracticalExamSetsListTable tableData={questionsData} updateExamSetsList={updateExamSetsList} />
      </Grid>
    </Grid>
  )
}

export default PracticalExamSetsList
