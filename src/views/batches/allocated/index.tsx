// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { batches } from '@prisma/client'

import AssignedBatchesListTable from './AssignedBatchesListTable'
import type { UsersType } from '@/types/users/usersType'

// import BatchesListCards from './BatchesListCards'

const AssignedBatchesList = ({ tableData, assessorData, updateBatchList }: { tableData?: batches[], assessorData: UsersType[], updateBatchList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <BatchesListCards />
      </Grid> */}
      <Grid item xs={12}>
        <AssignedBatchesListTable tableData={tableData} assessorData={assessorData} updateBatchList={updateBatchList} />
      </Grid>
    </Grid>
  )
}

export default AssignedBatchesList
