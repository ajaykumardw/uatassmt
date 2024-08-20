// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { batches } from '@prisma/client'

import BatchesListTable from './BatchesListTable'

// import BatchesListCards from './BatchesListCards'

const BatchesList = ({ tableData }: { tableData?: batches[] }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <BatchesListCards />
      </Grid> */}
      <Grid item xs={12}>
        <BatchesListTable tableData={tableData} />
      </Grid>
    </Grid>
  )
}

export default BatchesList
