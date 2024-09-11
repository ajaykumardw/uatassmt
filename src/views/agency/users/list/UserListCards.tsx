// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { users } from '@prisma/client'

// Component Imports
import HorizontalWithSubtitle from '@components/card-statistics/HorizontalWithSubtitle'

const UserListCards = ({ data }: {data?: users[]}) => {

  const assessors = (data)?.filter(user => user.role_id === 1);
  const trainingPartners = (data)?.filter(user => user.role_id === 2);

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6} md={3}>
        <HorizontalWithSubtitle title='Users' value={data?.length.toString() || '0'} avatarIcon='tabler-users' avatarColor='primary' subTitle='Total User' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <HorizontalWithSubtitle title='Assessors' value={assessors?.length.toString() || '0'} avatarIcon='tabler-school' avatarColor='info' subTitle='Total Assessor' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <HorizontalWithSubtitle title='Training Partners' value={trainingPartners?.length.toString() || '0'} avatarIcon='tabler-heart-handshake' avatarColor='warning' subTitle='Total Training Partner' />
      </Grid>
    </Grid>
  )
}

export default UserListCards
