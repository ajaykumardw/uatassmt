// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { exam_sets } from '@prisma/client'

import PCWiseReportTable from './PCWiseReportTable'

// import ExamSetsListTable from './ExamSetsListTable'

// import UserListCards from './UserListCards'

const PCReportList = ({ questionsData }: { questionsData?: exam_sets[], }) => {

  console.log(questionsData);

  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <PCWiseReportTable />
        {/* <ExamSetsListTable tableData={questionsData} updateExamSetsList={updateExamSetsList} /> */}
      </Grid>
    </Grid>
  )
}

export default PCReportList
