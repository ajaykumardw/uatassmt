// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports

import NOSWiseReportTable from './NOSWiseReportTable'

// import ExamSetsListTable from './ExamSetsListTable'

// import UserListCards from './UserListCards'

const NOSReportList = () => {

  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <NOSWiseReportTable />
        {/* <ExamSetsListTable tableData={questionsData} updateExamSetsList={updateExamSetsList} /> */}
      </Grid>
    </Grid>
  )
}

export default NOSReportList
