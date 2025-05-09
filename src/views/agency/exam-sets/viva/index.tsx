// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { exam_sets } from '@prisma/client'

import VivaExamSetsListTable from './VivaExamSetsListTable'

// import UserListCards from './UserListCards'

const VivaExamSetsList = ({ questionsData, updateExamSetsList }: { questionsData?: exam_sets[], updateExamSetsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <VivaExamSetsListTable tableData={questionsData} updateExamSetsList={updateExamSetsList} />
      </Grid>
    </Grid>
  )
}

export default VivaExamSetsList
