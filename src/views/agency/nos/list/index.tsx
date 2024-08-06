// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { NOSType } from '@/types/nos/nosType'

// Component Imports
import NOSListTable from './NOSListTable'


// import UserListCards from './UserListCards'

const NOSList = ({ nosData, updateNOSList }: { nosData?: NOSType[], updateNOSList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <NOSListTable tableData={nosData} updateNOSList={updateNOSList} />
      </Grid>
    </Grid>
  )
}

export default NOSList
