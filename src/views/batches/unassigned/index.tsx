// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { batches } from '@prisma/client'

import UnassignedBatchesListTable from './UnassignedBatchesListTable'
import type { UsersType } from '@/types/users/usersType'

// import BatchesListCards from './BatchesListCards'

const UnassignedBatchesList = ({ tableData, assessorData, updateBatchList }: { tableData?: batches[], assessorData: UsersType[], updateBatchList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <BatchesListCards />
      </Grid> */}
      <Grid item xs={12}>
        <UnassignedBatchesListTable tableData={tableData} assessorData={assessorData} updateBatchList={updateBatchList} />
      </Grid>
    </Grid>
  )
}

export default UnassignedBatchesList
