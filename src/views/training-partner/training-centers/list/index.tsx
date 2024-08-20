// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { users } from '@prisma/client'

import TCListTable from './TCListTable'

const TCList = ({ userData, updateTCList }: { userData?: users[], updateTCList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <TCListTable tableData={userData} updateTCList={updateTCList} />
      </Grid>
    </Grid>
  )
}

export default TCList
