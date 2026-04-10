// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports

import CandidateWiseResultTable from './CandidateWiseResultTable'

// import ExamSetsListTable from './ExamSetsListTable'

// import UserListCards from './UserListCards'

const CandidateWiseResultList = () => {

  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <CandidateWiseResultTable />
        {/* <ExamSetsListTable tableData={questionsData} updateExamSetsList={updateExamSetsList} /> */}
      </Grid>
    </Grid>
  )
}

export default CandidateWiseResultList
