// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import QuestionsListTable from './QuestionsListTable'


// import UserListCards from './UserListCards'

const QuestionsList = () => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <QuestionsListTable />
      </Grid>
    </Grid>
  )
}

export default QuestionsList
