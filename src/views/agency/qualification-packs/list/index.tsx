// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { QPType } from '@/types/qualification-pack/qpType'

// Component Imports
import QualificationPackListTable from './QualificationPackListTable'


// import UserListCards from './UserListCards'

const QualificationPackList = ({ qPackData, updateQPList }: { qPackData?: QPType[], updateQPList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <QualificationPackListTable tableData={qPackData} updateQPList={updateQPList} />
      </Grid>
    </Grid>
  )
}

export default QualificationPackList
