// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
// import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import type { SSCType } from '@/types/sectorskills/sscType'

// import UserListCards from './UserListCards'

const UserList = ({ userData, updateSSCList }: { userData?: SSCType[], updateSSCList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <UserListTable tableData={userData} updateSSCList={updateSSCList} />
      </Grid>
    </Grid>
  )
}

export default UserList
