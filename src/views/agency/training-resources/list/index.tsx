// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
// import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import TrainingResourcesListTable from './TrainingResourcesListTable'
import type { SSCType } from '@/types/sectorskills/sscType'

// import UserListCards from './UserListCards'

const TrainingResourcesList = ({ userData, updateSSCList }: { userData?: SSCType[], updateSSCList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <TrainingResourcesListTable tableData={userData} updateSSCList={updateSSCList} />
      </Grid>
    </Grid>
  )
}

export default TrainingResourcesList
