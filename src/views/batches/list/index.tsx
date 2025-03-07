// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { batches } from '@prisma/client'

import type { QPType } from '@/types/qualification-pack/qpType';

import BatchesListTable from './BatchesListTable'

type BatchesWithQP = batches & {qualification_pack: QPType};

// import BatchesListCards from './BatchesListCards'

const BatchesList = ({ tableData, updateBatchList }: { tableData?: BatchesWithQP[], updateBatchList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <BatchesListCards />
      </Grid> */}
      <Grid item xs={12}>
        <BatchesListTable tableData={tableData} updateBatchList={updateBatchList} />
      </Grid>
    </Grid>
  )
}

export default BatchesList
