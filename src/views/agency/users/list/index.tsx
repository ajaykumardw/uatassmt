// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports
import type { users } from '@prisma/client'

import UserListTable from './UserListTable'
import UserListCards from './UserListCards'

const UserList = ({ userData }: { userData?: users[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserListCards data={userData} />
      </Grid>
      <Grid item xs={12}>
        <UserListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
