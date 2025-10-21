// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports

import PCWiseReportTable from './PCWiseReportTable'

// import ExamSetsListTable from './ExamSetsListTable'

// import UserListCards from './UserListCards'

const PCReportList = () => {

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
