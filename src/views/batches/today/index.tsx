// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { batches } from '@prisma/client'

import type { QPType } from '@/types/qualification-pack/qpType';

import TodayBatchesListTable from './TodayBatchesListTable'

type BatchesWithQP = batches & {qualification_pack: QPType};

const TodayBatchesList = ({ tableData, updateBatchList }: { tableData?: BatchesWithQP[], updateBatchList: () => void }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TodayBatchesListTable tableData={tableData} updateBatchList={updateBatchList} />
      </Grid>
    </Grid>
  )
}

export default TodayBatchesList
