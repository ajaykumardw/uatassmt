// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { batches } from '@prisma/client'

import type { QPType } from '@/types/qualification-pack/qpType';

import BatchesListTable from './BatchesListTable'

type BatchesWithQP = batches & {qualification_pack: QPType};

const BatchesList = ({ tableData }: { tableData?: BatchesWithQP[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <BatchesListTable tableData={tableData} />
      </Grid>
    </Grid>
  )
}

export default BatchesList
