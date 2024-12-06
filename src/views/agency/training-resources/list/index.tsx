// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
// import type { UsersType } from '@/types/apps/userTypes'

import type { training_resources } from '@prisma/client'

// Component Imports
import TrainingResourcesListTable from './TrainingResourcesListTable'

// import UserListCards from './UserListCards'

const TrainingResourcesList = ({ userData, updateTrainingResourceList }: { userData?: training_resources[], updateTrainingResourceList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <TrainingResourcesListTable tableData={userData} updateTrainingResourceList={updateTrainingResourceList} />
      </Grid>
    </Grid>
  )
}

export default TrainingResourcesList
