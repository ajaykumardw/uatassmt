// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import StudentListTable from './StudentListTable'

const StudentList = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <StudentListTable />
      </Grid>
    </Grid>
  )
}

export default StudentList
